# Kodewar LMS

A full-stack Learning Management System for **Kodewar Technologies**, built with JavaScript only.

> **Current status: Phase 10 certificates, testing and deployment preparation complete.** Authentication, student learning, staff course authoring, assessment building, enrolment management, grading, progress reporting and public certificate verification are all wired to the real TiDB-backed API. Unlock, publication, attempt, grading, late-submission and certificate rules are enforced server-side.

---

## 1. What is running today

| Part | What it does |
|---|---|
| `frontend/` | React + Vite app with Tailwind CSS, a reusable component library, working auth pages and a protected student workspace. |
| `backend/` | Express REST API with JWT authentication, bcrypt password hashing, role checks, validation, rate limiting and central error handling. |
| `database/` | TiDB schema and seed scripts for roles, users, password resets, courses, modules, lessons, enrolments, lesson completions, assessments, attempts, assignments and submissions. |
| `npm run db:check` | Connects to TiDB, creates the `kodewar_lms` database if needed and verifies queries work. |
| `npm run db:migrate` | Applies `database/schema.sql` and every pending numbered migration (safe to run repeatedly). |
| `npm run db:seed` | Creates the three development demo accounts and a small demo course with quizzes and an assignment. |

The status page at `http://localhost:5173` is **not fake data**. It calls the real API, which in turn queries the real database.

Deployment steps for a production host are in [`docs/deployment.md`](docs/deployment.md).

### Pages available now

| Route | Page | Access |
|---|---|---|
| `/` | Live system status page | Public |
| `/login` | Working sign-in form | Public |
| `/register` | Student registration | Public |
| `/forgot-password` | Request a password reset link | Public |
| `/reset-password?token=...` | Set a new password | Public link |
| `/student` | Student overview with the real signed-in account | Student |
| `/student/courses` | Enrolled courses and published course catalogue | Student |
| `/student/courses/:courseId` | Weekly modules, lessons, completion, quizzes and assignments (enrolled students) | Student |
| `/student/assessments` | Weekly quizzes with scores, attempts and lock state | Student |
| `/student/assessments/:assessmentId` | Start/resume an attempt, submit it and review graded answers | Student |
| `/student/assignments` | Assignment list with submission and grading status | Student |
| `/student/assignments/:assignmentId` | Read instructions and submit or update written work | Student |
| `/student/certificates` | Earned certificates with public verification codes | Student |
| `/verify` | Public certificate code lookup | Public |
| `/verify/:code` | Public verification result for one certificate | Public |
| `/staff` | Staff dashboard with live course, enrolment and lesson totals | Staff roles |
| `/staff/courses` | Course manager: search, create, edit, publish and delete | Staff roles |
| `/staff/courses/:courseId` | Course editor with Content, Enrolments and Progress tabs | Staff roles |
| `/staff/assessments/:assessmentId` | Assessment builder: settings, questions, options, attempts and publishing | Staff roles |
| `/staff/assignments/:assignmentId` | Submission review and grading | Staff roles |
| `/staff/students` | Student directory with per-course progress | Staff roles |
| `/staff/users` | User access: create accounts, change roles, suspend or restore access | Admin |
| `/account` | Profile update and password change | Any signed-in role |
| `/design` | Design system gallery with working component demos | Public |
| `/design/auth` | Authentication layout preview | Public |
| any other URL | Functional 404 page | Public |

### Development demo accounts

These accounts are created by `npm run db:seed`. Passwords are hashed with bcrypt and are **never stored as plain text** in the database or source code.

| Role | Email | Password |
|---|---|---|
| Student | `student@kodewar.test` | `Student@123` |
| Trainer | `trainer@kodewar.test` | `Trainer@123` |
| Admin | `admin@kodewar.test` | `Admin@123` |

> These are **development-only** credentials. The seed script refuses to run in production unless `FORCE_SEED=true` is set explicitly. Delete or replace these accounts before deploying.
>
> The login page also shows clickable demo-account buttons in development. They only fill the form; they do not bypass the real login flow.

---

## 2. Requirements

- **Node.js 20.19+ or 22.12+** (we installed with Node 22.19)
- **npm 10+**
- A **TiDB Cloud** cluster (the connection details go in `backend/.env`)

Check your versions:

```powershell
node --version
npm --version
```

---

## 3. First-time setup

Open a terminal in the project folder:

```powershell
cd "C:\Users\91810\OneDrive\Desktop\Lms Kodewar"
```

### Step 1 — Install the root helper

```powershell
npm install
```

### Step 2 — Install frontend and backend dependencies

```powershell
npm run install:all
```

### Step 3 — Create your environment file

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and fill in:

| Variable | Meaning |
|---|---|
| `DB_HOST` | TiDB Cloud gateway host |
| `DB_PORT` | Usually `4000` |
| `DB_USER` | Your TiDB username (format: `clusterId.root`) |
| `DB_PASSWORD` | Your TiDB password |
| `DB_NAME` | `kodewar_lms` |
| `DB_SSL` | `true` (TiDB Cloud requires TLS) |
| `JWT_SECRET` | A long random string |

Generate a safe JWT secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

> **Never commit `backend/.env`.** It is already listed in `.gitignore`. Only `.env.example` (with placeholders) belongs in Git.

### Step 4 — Verify the database

```powershell
npm run db:check
```

Expected output:

```
Database "kodewar_lms" is ready.
Connection to "kodewar_lms" works.
Database check passed.
```

### Step 5 — Create the application tables

```powershell
npm run db:migrate
```

Expected output:

```
roles table ready
users table ready
password_reset_tokens table ready
courses table ready
...
assignment_submissions table ready
schema_migrations table ready
Applying numbered migrations ...
Migration complete.
```

### Step 6 — Seed the development demo accounts

```powershell
npm run db:seed
```

This creates the three demo accounts listed in section 1, a small **JavaScript Foundations** demo course with two weekly modules, two quizzes and one assignment, and enrols the demo student. It resets the demo student's progress on that course so the unlock chain can be demonstrated again. Re-running it restores the demo accounts and demo content to a known state.

### Step 7 — Start both servers

```powershell
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:5000**
- Health check: **http://localhost:5000/api/health**

Press `Ctrl + C` to stop both servers.

Prefer two terminals? Run these separately:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

---

## 4. Folder guide

```
Lms Kodewar/
├── frontend/                  The React application (what users see)
│   ├── public/                Static files served as-is (logo, favicon)
│   └── src/
│       ├── assets/            Images imported by components
│       ├── components/
│       │   ├── ui/            Small reusable pieces (buttons, inputs, logo)
│       │   ├── layout/        Sidebar, top bar, mobile navigation
│       │   ├── auth/          ProtectedRoute, PublicOnlyRoute, demo accounts
│       │   ├── student/       Shared student empty-state page
│       │   └── course/        Course-specific pieces (cards, progress)
│       ├── pages/
│       │   ├── auth/          Login, register, forgot/reset password
│       │   ├── student/       All student screens
│       │   ├── trainer/       Trainer panel (later)
│       │   └── admin/         Admin panel (later)
│       ├── layouts/           Shared page shells (auth shell, dashboard shell)
│       ├── config/            Navigation items for each role
│       ├── services/          All API calls (fetch lives only here)
│       ├── hooks/             Reusable React logic (e.g. useSystemHealth)
│       ├── context/           Shared app state (auth user, toast notifications)
│       ├── utils/             Formatting and validation helpers
│       ├── styles/            Tailwind import and design tokens
│       ├── App.jsx            Route table
│       └── main.jsx           React entry point
│
├── backend/                   The Express API (the "brain")
│   ├── config/                Environment variables + TiDB connection pool
│   ├── controllers/           Receive requests, send responses
│   ├── models/                SQL queries (one file per data area)
│   ├── routes/                URL definitions for the API
│   ├── middleware/            Auth, roles, validation, uploads, errors
│   ├── services/              Business rules (unlocks, progress, certificates)
│   ├── validators/            Request validation rules
│   ├── utils/                 JWT/cookie helpers, validation, ApiError
│   ├── uploads/               Assignment files (ignored by Git)
│   ├── scripts/               checkDb, migrate and seed scripts
│   ├── app.js                 Express configuration
│   └── server.js              Starts the HTTP server
│
├── database/                  TiDB schema, migrations and seed data
├── docs/                      Extra documentation
├── package.json               Root commands for running both servers
└── README.md                  This file
```

### Where business rules live

Rules such as "week 2 unlocks only after week 1 is passed" are **not** enforced in React. They live in `backend/services/progress.service.js` and run for every request. Hiding a button in the browser is never treated as security.

---

## 5. How the frontend and backend communicate

```
Browser (React)
   │  fetch("/api/health")
   ▼
Vite dev server (localhost:5173)
   │  proxies /api  →  localhost:5000
   ▼
Express API
   │  mysql2 connection pool
   ▼
TiDB Cloud
```

- React never talks to TiDB directly.
- During development, `frontend/vite.config.js` proxies `/api` to Express. This avoids CORS problems.
- `frontend/src/services/api.js` is the only place that calls `fetch`. Pages use services, not raw URLs.
- In production, the frontend is built to static files and the API is hosted separately.

### Health response

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

### Authentication flow

```
POST /api/auth/login
   → bcrypt compares the password with the hash in TiDB
   → a JWT is signed and stored in an httpOnly cookie
   → React calls GET /api/auth/me to load the signed-in user
   → ProtectedRoute decides whether the role may open the page
```

- The JWT is never stored in `localStorage` or exposed to JavaScript.
- The API reloads the user from TiDB on every protected request, so suspension or deletion takes effect immediately.
- Passwords are hashed with bcrypt (12 rounds). Login, registration and password reset are rate-limited.
- Password reset tokens are random, single-use, expire after 30 minutes and are stored only as SHA-256 hashes.
- Email delivery is not configured yet. In **development only**, `POST /api/auth/forgot-password` returns a reset URL so the flow can be tested. Production responses never include it.
- A `401` in the browser console when signed out is expected: the app is checking whether a session cookie exists.

See `docs/api.md` for request and response examples.

### Assessments, assignments and progress

Progress is never stored as a separate percentage that can drift. It is derived from three real records:

- a row in `lesson_completions` when a student marks a lesson complete;
- a **passed** attempt in `assessment_attempts` (score at or above the assessment's pass mark);
- a row in `assignment_submissions` (submitted, whether or not it has been graded yet).

**Unlock rules** run on the server for every request:

1. The first module is unlocked. A later module unlocks only when the previous module is complete.
2. A module is complete when all its lessons are complete, every published assessment is passed, and every published assignment is submitted.
3. Assessments and assignments unlock once that module's lessons are complete.
4. Locked lessons never return their video provider or URL, so a direct API request cannot bypass the player's lock.
5. A course can only be published once it has at least one module and at least one lesson.

Quizzes are graded server-side. Correct answers and explanations are never sent to the browser before an attempt is submitted. Starting an attempt twice resumes the open attempt instead of creating duplicates, and the attempt limit is enforced when a new attempt starts.

Assignments accept written work plus an optional `http(s)` link. Students can update a submission until a trainer grades it. Late submissions are accepted but flagged with `isLate` for both students and staff. File uploads are intentionally not required in this phase.

Course progress is `(completed lessons + passed assessments + submitted assignments) / all published learning items`. Course cards, the dashboard, the course page and the assessments page all read the same API values.

### Staff management API

Phase 6 adds a complete authoring API under `/api/manage`, available to trainers and admins:

- course, module and lesson CRUD with unique slugs, week numbers and positions;
- enrolment management by student ID or email, plus a searchable student directory;
- assessment drafts with questions and options, validated before publishing (at least one question, at least two options and exactly one correct answer per question);
- assignment CRUD, submission lists and trainer grading with a server-side maximum-score check;
- derived progress views for a whole course roster, one student in a course and one student across all courses.

Destructive actions, enrolment changes and user-access management additionally require `admin`. Students receive `403` from every `/api/manage` route. See `docs/api.md` for the full endpoint list.

### Staff workspace screens

Phase 8 connects every staff screen to the management API:

- the dashboard shows live course and enrolment totals; module and lesson counts are shown after opening a course;
- the course manager searches, creates, edits, publishes and deletes courses, including cover thumbnails that appear on student course cards;
- the course editor manages weekly modules, lessons, assessments and assignments, plus enrolment and progress tabs;
- the assessment builder edits settings, questions, options and correct answers, and validates content before publishing;
- the assignment screen lists submissions and saves server-checked grades;
- the student directory shows every student's progress across all enrolled courses;
- administrators get a Users & roles screen to create accounts, change roles and suspend or restore access.

Admin-only controls (course deletion, module/lesson deletion, enrolment changes, question deletion and user access) are hidden for trainers, and the API rejects them with `403` even if the request is sent directly.

### Certificates and public verification

A certificate is issued automatically the first time a student opens `/student/certificates` after the server confirms the course is complete. Completion uses the same rule as the course page: every published lesson completed, every published assessment passed and every published assignment submitted. The `(user_id, course_id)` database key makes issuance idempotent, so a course can never receive two certificates.

Each certificate has a public code such as `KDW-1A2B3C4D5E6F7A8B`. Anyone can check it at `/verify` or `/verify/:code`; the public API returns only the recipient name, course title, category, level and issue date. Students can download their certificate as a PDF from `/student/certificates`, and the public verification page offers the same download once a code is confirmed. Deleting a course also removes its certificates, so a deleted course cannot be verified.

---

## 6. Design system

The full component gallery is at **http://localhost:5173/design**. It includes working buttons, form controls, validation, password visibility, toast notifications, modal dialogs, progress indicators, course cards, alerts, empty states and loading skeletons.

### Reusable components

| Folder | Components |
|---|---|
| `components/ui/` | `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`, `Alert`, `Card`, `ProgressBar`, `ProgressRing`, `Avatar`, `Modal`, `Skeleton`, `EmptyState`, `StatCard` |
| `components/layout/` | `Sidebar`, `Topbar`, `MobileNav`, `PageHeader` |
| `components/auth/` | `ProtectedRoute`, `PublicOnlyRoute`, `DemoAccounts` |
| `components/course/` | `CourseCard` |
| `layouts/` | `DashboardLayout`, `AuthLayout` |
| `context/` | `AuthProvider`/`useAuth()` and `ToastProvider`/`useToast()` |

Every reusable component lives in one file with a short comment explaining its purpose. See `docs/design-system.md` for import examples.

### Design tokens

| Token | Value |
|---|---|
| Background | `#06070b` (deep black) |
| Surfaces | `#0a0c12` / `#11151e` |
| Border | `#1c2230` |
| Primary accent | `#8b5cf6` (violet) |
| Secondary accent | Cyan `#67e8f9` |
| Body font | DM Sans |
| Display font | Space Grotesk |

These are defined once in `frontend/src/styles/index.css` using Tailwind v4 `@theme` tokens, so every page stays consistent. Reduced-motion preferences are respected globally.

---

## 7. Backend security in place

- Passwords are hashed with bcrypt (`bcryptjs`, 12 rounds) and never stored as plain text.
- The JWT is stored in an `httpOnly`, `SameSite=Lax` cookie (not in `localStorage`) and is marked `Secure` in production.
- Protected routes verify the token, reload the user from TiDB and check the account status on every request.
- Role checks live in the API (`requireRole`), not only in the React UI.
- Student routes require the `student` role, staff routes require a staff role, and destructive or enrolment routes require an administrator.
- Locked lessons hide their media, and publication, attempt-limit, grading and late-submission rules run in the API on every request.
- `helmet` sets security headers.
- `express-rate-limit` limits global API abuse plus login, registration and password reset attempts.
- CORS only allows the configured frontend origin and credentials.
- Request bodies are size-limited and every auth field is validated.
- Database credentials and the JWT secret only exist in `backend/.env`.
- Errors are centralised and never expose stack traces in production.
- Password reset tokens are single-use, expire after 30 minutes and are stored as SHA-256 hashes.
- The database name is validated before being used in SQL DDL.

> The TiDB password was shared in chat during setup. **Rotate it in the TiDB Cloud console** after the project is configured, then update `backend/.env`.
>
> Demo accounts use well-known development passwords. Remove them before deploying to production.

---

## 8. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API and frontend together |
| `npm run dev:backend` | Start only the API |
| `npm run dev:frontend` | Start only the frontend |
| `npm run install:all` | Install both sub-projects |
| `npm run db:check` | Verify TiDB and create the database if missing |
| `npm run db:migrate` | Apply the baseline schema and any pending numbered migrations (safe to re-run) |
| `npm run db:seed` | Create/restore the three development demo accounts |
| `npm run build` | Build the frontend for production |
| `npm run test:api` | Run the repeatable API smoke test against a running backend |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Status card says **API offline** | Start the backend with `npm run dev:backend`. |
| `ECONNREFUSED 127.0.0.1:5000` | The backend is not running, or it crashed. Read the API terminal. |
| Database check fails | Re-check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`. |
| `EADDRINUSE` | Another program uses port 5000 or 5173. Stop it or change `PORT` / `server.port`. |
| Fonts look different | Google Fonts needs internet. Local fallback fonts are used automatically. |
| `Missing environment variable` | Create `backend/.env` from `backend/.env.example`. |

---

## 10. Roadmap

1. **Phase 1 — Foundation** ✅ structure, Tailwind theme, Express health API, TiDB connection
2. **Phase 2 — Design system** ✅ component library, responsive app shell, auth layout, interactive gallery
3. **Phase 3 — Authentication** ✅ auth schema, bcrypt/JWT, role guards, login/register/reset pages, account settings, protected student workspace
4. **Phase 4 — Courses, weekly modules and video learning** ✅ student catalogue, enrolment and lesson playback
5. **Phase 5 — Assessments, assignments and progress tracking** ✅ weekly quizzes, attempts and scores, lesson completion, unlock rules, assignment submissions and derived course progress
6. **Phase 6 — Full REST API modules** ✅ staff CRUD for courses, modules, lessons, enrolments, assessments, questions/options, assignments, grading and student progress views
7. **Phase 7 — TiDB schema, migrations and seed data** ✅ full baseline schema, tracked numbered migrations, publish-default alignment, grading index and repeatable demo seed
8. **Phase 8 — Connect every screen to the API** ✅ staff dashboard, course manager/editor, assessment builder, assignment grading and student progress screens use the real management API
9. **Phase 9 — Auth, permissions and backend learning rules** ✅ student/staff/admin route guards, locked-lesson media protection, course publish readiness, server-graded attempts, attempt limits, grading limits and late-submission flags
10. **Phase 10 — Certificates, testing and deployment preparation** ✅ automatic server-issued certificates, public verification page, repeatable API test command, production checks and deployment guide

---

© 2026 Kodewar Technologies. JavaScript only — no TypeScript anywhere.
