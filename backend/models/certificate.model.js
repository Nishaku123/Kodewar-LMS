import { pool } from "../config/db.js";

/**
 * Database access for course certificates.
 *
 * A certificate row is written only by the certificate service after the
 * authoritative progress rules confirm that the course is complete. The
 * unique (user_id, course_id) key keeps repeated checks idempotent.
 */

const CERTIFICATE_SELECT = `
  SELECT c.id,
         c.certificate_code AS code,
         c.issued_at AS issuedAt,
         co.id AS courseId,
         co.title AS courseTitle,
         co.category AS courseCategory,
         co.level AS courseLevel,
         co.duration_minutes AS courseDurationMinutes
    FROM certificates c
    JOIN courses co ON co.id = c.course_id
`;

function mapCertificate(row) {
  return {
    id: row.id,
    code: row.code,
    issuedAt: row.issuedAt,
    course: {
      id: row.courseId,
      title: row.courseTitle,
      category: row.courseCategory,
      level: row.courseLevel,
      durationMinutes: row.courseDurationMinutes,
    },
  };
}

export async function listCertificatesForStudent(userId) {
  const [rows] = await pool.execute(
    `${CERTIFICATE_SELECT}
      WHERE c.user_id = ?
      ORDER BY c.issued_at DESC, c.id DESC`,
    [userId]
  );

  return rows.map(mapCertificate);
}

export async function listCertificateCourseIds(userId) {
  const [rows] = await pool.execute(
    "SELECT course_id AS courseId FROM certificates WHERE user_id = ?",
    [userId]
  );

  return new Set(rows.map((row) => row.courseId));
}

export async function findCertificateForStudent(userId, courseId) {
  const [rows] = await pool.execute(
    `${CERTIFICATE_SELECT}
      WHERE c.user_id = ? AND c.course_id = ?
      LIMIT 1`,
    [userId, courseId]
  );

  return rows[0] ? mapCertificate(rows[0]) : null;
}

export async function findCertificateByIdForStudent(userId, certificateId) {
  const [rows] = await pool.execute(
    `${CERTIFICATE_SELECT}
      WHERE c.user_id = ? AND c.id = ?
      LIMIT 1`,
    [userId, certificateId]
  );

  return rows[0] ? mapCertificate(rows[0]) : null;
}

/**
 * Inserts a certificate unless the student already has one for this course.
 * Returns the stored certificate, or null if a code collision prevented the
 * insert. The service retries a collision with a fresh code.
 */
export async function createCertificate(userId, courseId, code) {
  await pool.execute(
    `INSERT IGNORE INTO certificates (user_id, course_id, certificate_code)
     VALUES (?, ?, ?)`,
    [userId, courseId, code]
  );

  return findCertificateForStudent(userId, courseId);
}

export async function findCertificateByCode(code) {
  const [rows] = await pool.execute(
    `SELECT c.id,
            c.certificate_code AS code,
            c.issued_at AS issuedAt,
            u.full_name AS recipientName,
            co.title AS courseTitle,
            co.category AS courseCategory,
            co.level AS courseLevel,
            co.duration_minutes AS courseDurationMinutes
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       JOIN courses co ON co.id = c.course_id
      WHERE c.certificate_code = ?
      LIMIT 1`,
    [code]
  );

  const row = rows[0];

  if (!row) return null;

  return {
    code: row.code,
    issuedAt: row.issuedAt,
    recipientName: row.recipientName,
    course: {
      title: row.courseTitle,
      category: row.courseCategory,
      level: row.courseLevel,
      durationMinutes: row.courseDurationMinutes,
    },
  };
}
