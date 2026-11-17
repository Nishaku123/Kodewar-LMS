# Kodewar LMS API

Base URL in development: `http://localhost:5000/api`

All responses use a consistent shape:

```json
{ "success": true, "message": "...", "data": {} }
```

```json
{ "success": false, "message": "...", "details": null }
```

## Endpoints available

### `GET /api/courses/catalog`

Lists published courses for the signed-in student, including module/lesson
counts and whether that student is enrolled.

- **Auth:** student
- **Status:** `200 OK`

### `GET /api/courses/mine`

Lists the signed-in student's published enrolled courses.

- **Auth:** student
- **Status:** `200 OK`

### `POST /api/courses/:courseId/enroll`

Enrolls the signed-in student in a published course. Duplicate enrolments
return `409 Conflict`; unpublished or missing courses return `404 Not Found`.

- **Auth:** student
- **Status:** `201 Created`

### `GET /api/courses/:courseId`

Returns an enrolled course's weekly modules, ordered lessons, lesson video
metadata, assessments, assignments and derived progress. Each module, lesson,
assessment and assignment carries its server-calculated `isUnlocked` flag.
A student who is not enrolled cannot access its lesson content.

- **Auth:** enrolled student
- **Status:** `200 OK`

Lesson videos support `youtube`, `vimeo`, or `direct` providers using
`video_provider` and `video_url` in the `lessons` table. Direct playback uses
the browser's native video element.

## Progress and lesson completion

### `POST /api/lessons/:lessonId/complete`

Marks a lesson complete for the signed-in student. The request is idempotent.
A locked lesson returns `403`.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `DELETE /api/lessons/:lessonId/complete`

Marks a lesson as not complete. Later modules may lock again as a result.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `GET /api/progress`

Returns every enrolled course's derived progress summary plus an overall
overview (courses completed, lessons completed, assessments passed).

- **Auth:** student
- **Status:** `200 OK`

### `GET /api/progress/courses/:courseId`

Returns the full module/lesson/assessment/assignment structure with unlock and
completion flags for one enrolled course. Locked lessons never include their
video provider or URL, even when the request is made directly against the API.

- **Auth:** enrolled student
- **Status:** `200 OK`

## Assessments

### `GET /api/assessments`

Lists assessments across the student's enrolled courses. Each item includes the
course, week, pass mark, attempts used, best score and `isUnlocked`.

- **Auth:** student
- **Status:** `200 OK`

### `GET /api/assessments/:assessmentId`

Returns the assessment, its questions and options (without correct answers),
submitted attempt history and any in-progress attempt.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `POST /api/assessments/:assessmentId/attempts`

Starts a graded attempt. If an attempt is already open, it is resumed instead of
creating a duplicate. Locked assessments return `403`; passed assessments and
exhausted attempt limits return `409`.

- **Auth:** enrolled student
- **Status:** `201 Created` (or `200 OK` when resuming)

### `POST /api/assessments/:assessmentId/attempts/:attemptId/submit`

Grades an attempt. Unanswered questions count as incorrect. The response
includes the score, pass/fail result, correct option IDs and explanations.

```json
{
  "answers": [
    { "questionId": 1, "optionId": 1 },
    { "questionId": 2, "optionId": 5 }
  ]
}
```

- **Auth:** enrolled student (owner of the attempt)
- **Status:** `200 OK`

### `GET /api/assessments/:assessmentId/attempts/:attemptId`

Returns the graded result and answer review for a submitted attempt.

- **Auth:** enrolled student (owner of the attempt)
- **Status:** `200 OK`

Scores are percentages calculated from question points. `passed` is true when
the score is at or above the assessment's `passing_score`.

## Assignments

### `GET /api/assignments`

Lists assignments across enrolled courses with submission status, unlock state
and an `isLate` flag when the saved submission arrived after the due date.

- **Auth:** student
- **Status:** `200 OK`

### `GET /api/assignments/:assignmentId`

Returns one assignment, its instructions, due date and the student's current
submission (if any). `isLate` is true when that submission was made after the
due date.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `POST /api/assignments/:assignmentId/submissions`

Creates or updates a submission until it is graded. Send written `content`, an
optional `submissionUrl`, or both. Late submissions are accepted and returned
with `isLate: true`.

```json
{
  "content": "Describe what you built…",
  "submissionUrl": "https://example.com/my-work"
}
```

- **Auth:** enrolled student
- **Status:** `201 Created` (or `200 OK` when updating)
- **Errors:** `403` when locked, `409` when already graded, `400` for invalid content

## Certificates

### `GET /api/certificates`

Returns the signed-in student's certificates. Before responding, the API checks
every enrolled course that does not yet have a certificate and issues one when
the authoritative progress rules report the course as complete. The unique
`(user_id, course_id)` key makes repeated calls idempotent.

- **Auth:** student
- **Status:** `200 OK`

```json
{
  "success": true,
  "message": "Your certificates",
  "data": {
    "certificates": [
      {
        "id": 1,
        "code": "KDW-1A2B3C4D5E6F7A8B",
        "issuedAt": "2026-11-10T09:00:00.000Z",
        "course": {
          "id": 1,
          "title": "JavaScript Foundations",
          "category": "Web Development",
          "level": "Beginner",
          "durationMinutes": 240
        }
      }
    ],
    "summary": {
      "total": 1,
      "latestIssuedAt": "2026-11-10T09:00:00.000Z"
    }
  }
}
```

### `GET /api/certificates/verify/:code`

Publicly verifies a certificate code. The lookup is case-insensitive. The
response deliberately omits the student's email, internal user ID and internal
certificate ID.

- **Auth:** none
- **Status:** `200 OK`
- **Errors:** `400` for a malformed code, `404` when no certificate matches

```json
{
  "success": true,
  "message": "Certificate verified.",
  "data": {
    "certificate": {
      "code": "KDW-1A2B3C4D5E6F7A8B",
      "issuedAt": "2026-11-10T09:00:00.000Z",
      "recipientName": "Aarav Sharma",
      "course": {
        "title": "JavaScript Foundations",
        "category": "Web Development",
        "level": "Beginner",
        "durationMinutes": 240
      }
    }
  }
}
```

### `GET /api/certificates/:certificateId/download`

Downloads the signed-in student's own certificate as a one-page landscape PDF
with the recipient name, course, category, level, issue date and public code.

- **Auth:** student (owner only)
- **Status:** `200 OK` with `Content-Type: application/pdf`
- **Errors:** `404` when the certificate does not belong to the student

### `GET /api/certificates/verify/:code/download`

Publicly downloads the PDF for a valid certificate code. Useful from the public
verification page after a code has been confirmed.

- **Auth:** none
- **Status:** `200 OK` with `Content-Type: application/pdf`
- **Errors:** `400` for a malformed code, `404` when no certificate matches

### `GET /api/health`

Checks the API process and runs a real query against TiDB.

- **Auth:** none
- **Status:** `200 OK`
- **Note:** if the API is up but the database is unreachable, the response is
  still `200` with `data.status = "degraded"` and `data.database.connected = false`.
  This lets the UI explain the problem instead of showing a generic failure.

Example:

```json
{
  "success": true,
  "message": "Kodewar LMS API is running",
  "data": {
    "status": "ok",
    "environment": "development",
    "uptimeSeconds": 42,
    "timestamp": "2026-11-09T03:00:00.000Z",
    "database": {
      "connected": true,
      "name": "kodewar_lms",
      "version": "8.0.11-TiDB-v8.5.3-serverless"
    }
  }
}
```

### `POST /api/auth/register`

Creates a **student** account and signs the user in. Staff accounts cannot be created through this endpoint.

- **Auth:** none
- **Status:** `201 Created`
- **Rate limit:** 10 requests per hour per address

```json
{
  "fullName": "Aarav Sharma",
  "email": "student@kodewar.test",
  "password": "Student@123"
}
```

Passwords require 8–72 characters, at least one letter and one number.

### `POST /api/auth/login`

Verifies the password with bcrypt and sets the `kodewar_auth` httpOnly cookie.

- **Auth:** none
- **Status:** `200 OK`
- **Rate limit:** failed attempts only (15 per 15 minutes)

```json
{ "email": "student@kodewar.test", "password": "Student@123" }
```

```json
{
  "success": true,
  "message": "Signed in successfully.",
  "data": {
    "user": {
      "id": 1,
      "fullName": "Aarav Sharma",
      "email": "student@kodewar.test",
      "status": "active",
      "role": "student",
      "lastLoginAt": "2026-11-09T09:00:00.000Z",
      "createdAt": "2026-11-09T08:00:00.000Z"
    }
  }
}
```

Unknown emails and wrong passwords both return the same `401` message.

### `POST /api/auth/logout`

Clears the auth cookie.

- **Auth:** cookie optional
- **Status:** `200 OK`

### `GET /api/auth/me`

Returns the signed-in user. The frontend calls this on every page load to restore the session.

- **Auth:** required
- **Status:** `200 OK`, or `401` when no valid cookie exists

### `PATCH /api/auth/me`

Updates the signed-in user's display name.

- **Auth:** required
- **Status:** `200 OK`

```json
{ "fullName": "Aarav S. Sharma" }
```

### `PATCH /api/auth/password`

Changes the signed-in user's password. The current password is required.

- **Auth:** required
- **Status:** `200 OK`, or `400` when the current password is wrong

```json
{ "currentPassword": "Student@123", "newPassword": "NewSecret@123" }
```

### `POST /api/auth/forgot-password`

Creates a single-use reset token that expires after 30 minutes.

- **Auth:** none
- **Status:** `200 OK`
- **Rate limit:** 8 requests per 15 minutes
- **Privacy:** the same message is returned whether or not the email exists

In development, the response includes the reset URL so the flow can be tested:

```json
{
  "success": true,
  "message": "If an account exists for that email, a password reset link has been created.",
  "data": {
    "resetToken": "64-character hex token",
    "resetUrl": "http://localhost:5173/reset-password?token=...",
    "expiresAt": "2026-11-09T09:30:00.000Z"
  }
}
```

Production responses omit `resetToken`, `resetUrl` and `expiresAt`.

### `POST /api/auth/reset-password`

Consumes a valid reset token and sets a new password. Tokens are single-use.

- **Auth:** none
- **Status:** `200 OK`, or `400` for an invalid, used or expired token

```json
{ "token": "64-character hex token", "password": "NewSecret@123" }
```

### `GET /api/courses/:courseId/modules`

Returns the weekly module structure with lessons, assessments, assignments and
server-calculated unlock/completion flags. Same data as
`GET /api/courses/:courseId`, shaped for the modules screen.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `GET /api/modules/:moduleId`

Returns one module with its lessons, assessments, assignments and unlock state.

- **Auth:** enrolled student
- **Status:** `200 OK`

### `GET /api/lessons/:lessonId`

Returns one lesson, its video metadata and the module summary. Includes
`isUnlocked` and `isCompleted` so the player can block locked lessons.

- **Auth:** enrolled student
- **Status:** `200 OK`

## Staff management API

All `/api/manage` routes require a signed-in `trainer` or `admin`.
Routes marked **admin** require `admin`. Students always receive `403`.

### Courses

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/courses` | List all courses. Optional `search` and `isPublished=true\|false`. |
| `POST` | `/api/manage/courses` | Create a course. New courses start unpublished. `slug` is generated when omitted. |
| `GET` | `/api/manage/courses/:courseId` | Course detail with modules, lessons, assessments and assignments. |
| `PATCH` | `/api/manage/courses/:courseId` | Update course fields. |
| `DELETE` | `/api/manage/courses/:courseId` | **Admin.** Delete a course and its content. |
| `POST` | `/api/manage/courses/:courseId/publish` | Publish a course. Requires at least one module with at least one lesson. |
| `POST` | `/api/manage/courses/:courseId/unpublish` | Unpublish a course. |

### Modules and lessons

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/courses/:courseId/modules` | List modules for a course. |
| `POST` | `/api/manage/courses/:courseId/modules` | Create a module. `weekNumber` must be unique in the course. |
| `GET` | `/api/manage/modules/:moduleId` | Module detail with lessons, assessments and assignments. |
| `PATCH` | `/api/manage/modules/:moduleId` | Update a module. |
| `DELETE` | `/api/manage/modules/:moduleId` | **Admin.** Delete a module and its content. |
| `GET` | `/api/manage/modules/:moduleId/lessons` | List lessons in a module. |
| `POST` | `/api/manage/modules/:moduleId/lessons` | Create a lesson. Position defaults to the next free value. |
| `GET` | `/api/manage/lessons/:lessonId` | Lesson detail. |
| `PATCH` | `/api/manage/lessons/:lessonId` | Update lesson text, duration, position or video. |
| `DELETE` | `/api/manage/lessons/:lessonId` | **Admin.** Delete a lesson. |

Lesson videos accept `videoProvider` of `youtube`, `vimeo` or `direct` together
with an `https://` `videoUrl`.

### Assessments and questions

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/courses/:courseId/assessments` | List assessments in a course. |
| `GET` | `/api/manage/modules/:moduleId/assessments` | List assessments in a module. |
| `POST` | `/api/manage/modules/:moduleId/assessments` | Create an assessment draft. |
| `GET` | `/api/manage/assessments/:assessmentId` | Assessment with questions, options and correct-answer flags. |
| `PATCH` | `/api/manage/assessments/:assessmentId` | Update settings, or set `isPublished`. |
| `DELETE` | `/api/manage/assessments/:assessmentId` | **Admin.** Delete an assessment. |
| `POST` | `/api/manage/assessments/:assessmentId/publish` | Publish after validation. |
| `POST` | `/api/manage/assessments/:assessmentId/unpublish` | Return the assessment to draft. |
| `GET` | `/api/manage/assessments/:assessmentId/attempts` | Attempts with per-student scores and summary. |
| `POST` | `/api/manage/assessments/:assessmentId/questions` | Add a question to a draft assessment. |
| `PATCH` | `/api/manage/questions/:questionId` | Update a question while draft. |
| `DELETE` | `/api/manage/questions/:questionId` | **Admin.** Delete a question while draft. |
| `POST` | `/api/manage/questions/:questionId/options` | Add an option to a draft question. |
| `PATCH` | `/api/manage/options/:optionId` | Update an option while draft. |
| `DELETE` | `/api/manage/options/:optionId` | **Admin.** Delete an option while draft. |

Questions and options can only be changed while the assessment is unpublished.
Publishing returns `400` unless the assessment has at least one question and
every question has at least two options with exactly one correct option.

### Assignments and grading

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/courses/:courseId/assignments` | List assignments in a course. |
| `GET` | `/api/manage/modules/:moduleId/assignments` | List assignments in a module. |
| `POST` | `/api/manage/modules/:moduleId/assignments` | Create an assignment draft or publish it immediately. |
| `GET` | `/api/manage/assignments/:assignmentId` | Assignment detail with submissions. |
| `PATCH` | `/api/manage/assignments/:assignmentId` | Update an assignment. |
| `DELETE` | `/api/manage/assignments/:assignmentId` | **Admin.** Delete an assignment. |
| `POST` | `/api/manage/assignments/:assignmentId/publish` | Publish an assignment. |
| `POST` | `/api/manage/assignments/:assignmentId/unpublish` | Unpublish an assignment. |
| `GET` | `/api/manage/assignments/:assignmentId/submissions` | List submissions with grading summary. |
| `PATCH` | `/api/manage/submissions/:submissionId/grade` | Grade a submission. |

```json
{ "score": 8, "feedback": "Clear and accurate." }
```

`score` must be zero or more and cannot exceed the assignment's `maxPoints`
(a larger value returns `400`).

### Enrolments and student progress

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/courses/:courseId/enrollments` | List enrolled students. |
| `POST` | `/api/manage/courses/:courseId/enrollments` | **Admin.** Enrol a student by `userId` or `email`. |
| `DELETE` | `/api/manage/courses/:courseId/enrollments/:userId` | **Admin.** Remove an enrolment. |
| `GET` | `/api/manage/students` | Student directory. Optional `search` by name or email. |
| `GET` | `/api/manage/courses/:courseId/progress` | Every enrolled student's derived progress plus course summary. |
| `GET` | `/api/manage/courses/:courseId/progress/:userId` | One student's full course progress. |
| `GET` | `/api/manage/students/:userId/progress` | One student's progress across all enrolled courses. |

Enrolment accepts either:

```json
{ "userId": 4 }
```

```json
{ "email": "student@kodewar.test" }
```

Only active student accounts can be enrolled. Duplicate enrolments return
`409 Conflict`.

### User access management (admin only)

Every account in the platform can be managed from this API. All routes
require the `admin` role.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/manage/users` | List accounts and assignable roles. Optional `search` by name or email. |
| `POST` | `/api/manage/users` | Create an account with `fullName`, `email`, `password` and `role`. |
| `PATCH` | `/api/manage/users/:userId/role` | Change an account's role. |
| `PATCH` | `/api/manage/users/:userId/status` | Suspend (`suspended`) or restore (`active`) an account. |

Assignable roles are `student`, `trainer` and `admin`. An administrator cannot
change their own role or suspend their own account, so the last administrator
cannot accidentally lock themselves out.

## Error codes

| Code | Meaning |
|---|---|
| `400` | Invalid request data |
| `401` | Not signed in or invalid credentials |
| `403` | Signed in but not allowed, or account suspended |
| `404` | Route or resource not found |
| `409` | Duplicate account or enrolment, already-passed assessment, exhausted attempts or graded submission |
| `429` | Too many requests |
| `500` | Unexpected server error |

## Planned modules

File uploads for assignment attachments.
