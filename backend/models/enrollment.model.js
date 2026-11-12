import { pool } from "../config/db.js";

/**
 * Database access for course enrolments. Student self-enrolment lives in
 * course.model.js; these helpers power the staff management API.
 */

export async function listEnrollmentsForCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT u.id AS userId,
            u.full_name AS fullName,
            u.email,
            u.status,
            ce.enrolled_at AS enrolledAt
       FROM course_enrollments ce
       JOIN users u ON u.id = ce.user_id
      WHERE ce.course_id = ?
      ORDER BY u.full_name, u.id`,
    [courseId]
  );

  return rows;
}

export async function findEnrollment(courseId, userId) {
  const [rows] = await pool.execute(
    `SELECT user_id AS userId,
            course_id AS courseId,
            enrolled_at AS enrolledAt
       FROM course_enrollments
      WHERE course_id = ? AND user_id = ?
      LIMIT 1`,
    [courseId, userId]
  );

  return rows[0] || null;
}

export async function createEnrollment(courseId, userId) {
  const [result] = await pool.execute(
    `INSERT INTO course_enrollments (user_id, course_id)
     VALUES (?, ?)`,
    [userId, courseId]
  );

  return result.affectedRows === 1;
}

export async function deleteEnrollment(courseId, userId) {
  const [result] = await pool.execute(
    `DELETE FROM course_enrollments
      WHERE course_id = ? AND user_id = ?`,
    [courseId, userId]
  );

  return result.affectedRows > 0;
}
