import { pool } from "../config/db.js";

const COURSE_SUMMARY_COLUMNS = `
  c.id,
  c.slug,
  c.title,
  c.description,
  c.category,
  c.level,
  c.thumbnail_url AS thumbnailUrl,
  c.duration_minutes AS durationMinutes
`;

const COURSE_COUNTS = `
  (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) AS moduleCount,
  (SELECT COUNT(*)
     FROM lessons l
     JOIN course_modules cm ON cm.id = l.module_id
    WHERE cm.course_id = c.id) AS lessonCount,
  (SELECT COUNT(*)
     FROM assessments a
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id AND a.is_published = 1) AS assessmentCount,
  (SELECT COUNT(*)
     FROM assignments a
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id AND a.is_published = 1) AS assignmentCount
`;

/**
 * These subqueries read the signed-in student's real progress. The three
 * placeholders are always the student's user ID, in this order.
 */
const COURSE_PROGRESS_COUNTS = `
  (SELECT COUNT(*)
     FROM lesson_completions lc
     JOIN lessons l ON l.id = lc.lesson_id
     JOIN course_modules cm ON cm.id = l.module_id
    WHERE cm.course_id = c.id AND lc.user_id = ?) AS completedLessonCount,
  (SELECT COUNT(DISTINCT at.assessment_id)
     FROM assessment_attempts at
     JOIN assessments a ON a.id = at.assessment_id
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id
      AND at.user_id = ?
      AND at.status = 'submitted'
      AND at.passed = 1) AS passedAssessmentCount,
  (SELECT COUNT(*)
     FROM assignment_submissions s
     JOIN assignments a ON a.id = s.assignment_id
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id AND s.user_id = ?) AS submittedAssignmentCount
`;

function withProgressPercent(course) {
  const totalUnits =
    Number(course.lessonCount) +
    Number(course.assessmentCount) +
    Number(course.assignmentCount);
  const completedUnits =
    Number(course.completedLessonCount) +
    Number(course.passedAssessmentCount) +
    Number(course.submittedAssignmentCount);

  return {
    ...course,
    progressPercent: totalUnits
      ? Math.round((completedUnits / totalUnits) * 100)
      : 0,
    isComplete: totalUnits > 0 && completedUnits >= totalUnits,
  };
}

const COURSE_MANAGE_COLUMNS = `
  c.id,
  c.slug,
  c.title,
  c.description,
  c.category,
  c.level,
  c.thumbnail_url AS thumbnailUrl,
  c.duration_minutes AS durationMinutes,
  c.is_published AS isPublished,
  c.created_at AS createdAt,
  c.updated_at AS updatedAt
`;

const COURSE_MANAGE_COUNTS = `
  (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) AS moduleCount,
  (SELECT COUNT(*)
     FROM lessons l
     JOIN course_modules cm ON cm.id = l.module_id
    WHERE cm.course_id = c.id) AS lessonCount,
  (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS enrollmentCount,
  (SELECT COUNT(*)
     FROM assessments a
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id) AS assessmentCount,
  (SELECT COUNT(*)
     FROM assignments a
     JOIN course_modules cm ON cm.id = a.module_id
    WHERE cm.course_id = c.id) AS assignmentCount
`;

export async function listCoursesForManagement({
  search = "",
  isPublished = null,
} = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(c.title LIKE ? OR c.slug LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (isPublished !== null) {
    conditions.push("c.is_published = ?");
    params.push(isPublished ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `SELECT ${COURSE_MANAGE_COLUMNS}, ${COURSE_MANAGE_COUNTS}
       FROM courses c
       ${where}
      ORDER BY c.created_at DESC, c.id DESC`,
    params
  );

  return rows;
}

export async function findCourseForManagement(courseId) {
  const [rows] = await pool.execute(
    `SELECT ${COURSE_MANAGE_COLUMNS}, ${COURSE_MANAGE_COUNTS}
       FROM courses c
      WHERE c.id = ?
      LIMIT 1`,
    [courseId]
  );

  return rows[0] || null;
}

export async function findCourseBySlug(slug, excludeCourseId = null) {
  const [rows] = await pool.execute(
    `SELECT id, slug FROM courses
      WHERE slug = ? ${excludeCourseId ? "AND id <> ?" : ""}
      LIMIT 1`,
    excludeCourseId ? [slug, excludeCourseId] : [slug]
  );

  return rows[0] || null;
}

export async function createCourse(data) {
  const [result] = await pool.execute(
    `INSERT INTO courses
       (slug, title, description, category, level, thumbnail_url,
        duration_minutes, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.slug,
      data.title,
      data.description,
      data.category,
      data.level,
      data.thumbnailUrl,
      data.durationMinutes,
      data.isPublished ? 1 : 0,
    ]
  );

  return findCourseForManagement(result.insertId);
}

const COURSE_UPDATE_COLUMNS = {
  slug: "slug",
  title: "title",
  description: "description",
  category: "category",
  level: "level",
  thumbnailUrl: "thumbnail_url",
  durationMinutes: "duration_minutes",
  isPublished: "is_published",
};

export async function updateCourse(courseId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(COURSE_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(
      key === "isPublished" ? (data[key] ? 1 : 0) : data[key]
    );
  }

  if (assignments.length) {
    values.push(courseId);
    await pool.execute(
      `UPDATE courses SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findCourseForManagement(courseId);
}

export async function setCoursePublished(courseId, isPublished) {
  await pool.execute(
    "UPDATE courses SET is_published = ? WHERE id = ?",
    [isPublished ? 1 : 0, courseId]
  );

  return findCourseForManagement(courseId);
}

export async function deleteCourse(courseId) {
  const [result] = await pool.execute("DELETE FROM courses WHERE id = ?", [
    courseId,
  ]);

  return result.affectedRows > 0;
}

export async function listPublishedCoursesForStudent(userId) {
  const [rows] = await pool.execute(
    `SELECT ${COURSE_SUMMARY_COLUMNS},
            ${COURSE_COUNTS},
            ${COURSE_PROGRESS_COUNTS},
            EXISTS (
              SELECT 1 FROM course_enrollments ce
               WHERE ce.course_id = c.id AND ce.user_id = ?
            ) AS isEnrolled
       FROM courses c
      WHERE c.is_published = 1
      ORDER BY c.title, c.id`,
    [userId, userId, userId, userId]
  );

  return rows.map(withProgressPercent);
}

export async function listEnrolledCoursesForStudent(userId) {
  const [rows] = await pool.execute(
    `SELECT ${COURSE_SUMMARY_COLUMNS},
            ${COURSE_COUNTS},
            ${COURSE_PROGRESS_COUNTS},
            ce.enrolled_at AS enrolledAt
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
      WHERE ce.user_id = ? AND c.is_published = 1
      ORDER BY ce.enrolled_at DESC, c.title`,
    [userId, userId, userId, userId]
  );

  return rows.map(withProgressPercent);
}

export async function findPublishedCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT ${COURSE_SUMMARY_COLUMNS},
            ${COURSE_COUNTS}
       FROM courses c
      WHERE c.id = ? AND c.is_published = 1
      LIMIT 1`,
    [courseId]
  );

  return rows[0] || null;
}

export async function findEnrolledCourseForStudent(courseId, userId) {
  const [rows] = await pool.execute(
    `SELECT ${COURSE_SUMMARY_COLUMNS},
            ${COURSE_COUNTS},
            ${COURSE_PROGRESS_COUNTS},
            ce.enrolled_at AS enrolledAt
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
      WHERE c.id = ? AND ce.user_id = ? AND c.is_published = 1
      LIMIT 1`,
    [userId, userId, userId, courseId, userId]
  );

  return rows[0] ? withProgressPercent(rows[0]) : null;
}

export async function createCourseEnrollment(courseId, userId) {
  const [result] = await pool.execute(
    `INSERT INTO course_enrollments (user_id, course_id)
     VALUES (?, ?)`,
    [userId, courseId]
  );

  return result.affectedRows === 1;
}
