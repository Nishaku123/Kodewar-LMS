import { pool } from "../config/db.js";

/**
 * Database access for assignments and student submissions.
 * A student has at most one active submission per assignment. Submitting again
 * replaces it until a trainer grades it.
 */

export async function findAssignmentContext(assignmentId) {
  const [rows] = await pool.execute(
    `SELECT a.id,
            a.module_id AS moduleId,
            a.title,
            a.description,
            a.instructions,
            a.due_at AS dueAt,
            a.max_points AS maxPoints,
            a.is_published AS isPublished,
            cm.title AS moduleTitle,
            cm.week_number AS weekNumber,
            cm.course_id AS courseId,
            c.title AS courseTitle,
            c.is_published AS courseIsPublished
       FROM assignments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.id = ?
      LIMIT 1`,
    [assignmentId]
  );

  return rows[0] || null;
}

export async function findSubmission(assignmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT id,
            assignment_id AS assignmentId,
            user_id AS userId,
            content,
            submission_url AS submissionUrl,
            status,
            score,
            feedback,
            submitted_at AS submittedAt,
            updated_at AS updatedAt,
            graded_at AS gradedAt
       FROM assignment_submissions
      WHERE assignment_id = ? AND user_id = ?
      LIMIT 1`,
    [assignmentId, userId]
  );

  return rows[0] || null;
}

export async function saveSubmission({
  assignmentId,
  userId,
  content,
  submissionUrl,
}) {
  await pool.execute(
    `INSERT INTO assignment_submissions
       (assignment_id, user_id, content, submission_url, status)
     VALUES (?, ?, ?, ?, 'submitted')
     ON DUPLICATE KEY UPDATE
       content = VALUES(content),
       submission_url = VALUES(submission_url),
       status = 'submitted',
       score = NULL,
       feedback = NULL,
       graded_at = NULL,
       graded_by = NULL,
       submitted_at = UTC_TIMESTAMP()`,
    [assignmentId, userId, content, submissionUrl]
  );

  return findSubmission(assignmentId, userId);
}

/* ------------------------------------------------------------------ */
/* Staff / authoring API                                               */
/* ------------------------------------------------------------------ */

const ASSIGNMENT_MANAGE_COLUMNS = `
  a.id,
  a.module_id AS moduleId,
  a.title,
  a.description,
  a.instructions,
  a.due_at AS dueAt,
  a.max_points AS maxPoints,
  a.is_published AS isPublished,
  a.created_at AS createdAt,
  a.updated_at AS updatedAt,
  cm.title AS moduleTitle,
  cm.week_number AS weekNumber,
  cm.course_id AS courseId,
  c.title AS courseTitle,
  c.is_published AS courseIsPublished
`;

const ASSIGNMENT_MANAGE_COUNTS = `
  (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id)
    AS submissionCount,
  (SELECT COUNT(*) FROM assignment_submissions s
    WHERE s.assignment_id = a.id AND s.status = 'graded') AS gradedCount
`;

export async function listAssignmentsByCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSIGNMENT_MANAGE_COLUMNS}, ${ASSIGNMENT_MANAGE_COUNTS}
       FROM assignments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE cm.course_id = ?
      ORDER BY cm.week_number, cm.position, a.id`,
    [courseId]
  );

  return rows;
}

export async function listAssignmentsByModule(moduleId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSIGNMENT_MANAGE_COLUMNS}, ${ASSIGNMENT_MANAGE_COUNTS}
       FROM assignments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.module_id = ?
      ORDER BY a.id`,
    [moduleId]
  );

  return rows;
}

export async function findAssignmentForManagement(assignmentId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSIGNMENT_MANAGE_COLUMNS}, ${ASSIGNMENT_MANAGE_COUNTS}
       FROM assignments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.id = ?
      LIMIT 1`,
    [assignmentId]
  );

  return rows[0] || null;
}

export async function createAssignment({ moduleId, ...data }) {
  const [result] = await pool.execute(
    `INSERT INTO assignments
       (module_id, title, description, instructions, due_at, max_points,
        is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      data.title,
      data.description,
      data.instructions,
      data.dueAt,
      data.maxPoints,
      data.isPublished ? 1 : 0,
    ]
  );

  return findAssignmentForManagement(result.insertId);
}

const ASSIGNMENT_UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  instructions: "instructions",
  dueAt: "due_at",
  maxPoints: "max_points",
  isPublished: "is_published",
};

export async function updateAssignment(assignmentId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(ASSIGNMENT_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(key === "isPublished" ? (data[key] ? 1 : 0) : data[key]);
  }

  if (assignments.length) {
    values.push(assignmentId);
    await pool.execute(
      `UPDATE assignments SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findAssignmentForManagement(assignmentId);
}

export async function deleteAssignment(assignmentId) {
  const [result] = await pool.execute(
    "DELETE FROM assignments WHERE id = ?",
    [assignmentId]
  );

  return result.affectedRows > 0;
}

export async function listSubmissionsForAssignment(assignmentId) {
  const [rows] = await pool.execute(
    `SELECT s.id,
            s.assignment_id AS assignmentId,
            s.user_id AS userId,
            s.content,
            s.submission_url AS submissionUrl,
            s.status,
            s.score,
            s.feedback,
            s.submitted_at AS submittedAt,
            s.updated_at AS updatedAt,
            s.graded_at AS gradedAt,
            (a.due_at IS NOT NULL AND s.submitted_at > a.due_at) AS isLate,
            u.full_name AS studentName,
            u.email AS studentEmail,
            g.full_name AS gradedByName
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users g ON g.id = s.graded_by
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC, s.id DESC`,
    [assignmentId]
  );

  return rows;
}

export async function findSubmissionById(submissionId) {
  const [rows] = await pool.execute(
    `SELECT s.id,
            s.assignment_id AS assignmentId,
            s.user_id AS userId,
            s.content,
            s.submission_url AS submissionUrl,
            s.status,
            s.score,
            s.feedback,
            s.submitted_at AS submittedAt,
            s.updated_at AS updatedAt,
            s.graded_at AS gradedAt,
            a.max_points AS maxPoints,
            a.title AS assignmentTitle
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
      WHERE s.id = ?
      LIMIT 1`,
    [submissionId]
  );

  return rows[0] || null;
}

export async function gradeSubmission(submissionId, { score, feedback, gradedBy }) {
  await pool.execute(
    `UPDATE assignment_submissions
        SET status = 'graded',
            score = ?,
            feedback = ?,
            graded_at = UTC_TIMESTAMP(),
            graded_by = ?
      WHERE id = ?`,
    [score, feedback, gradedBy, submissionId]
  );

  return findSubmissionById(submissionId);
}
