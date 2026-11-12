import { pool } from "../config/db.js";

/**
 * Database access for course modules (the "weeks" of a course).
 */

const MODULE_COLUMNS = `
  cm.id,
  cm.course_id AS courseId,
  cm.title,
  cm.description,
  cm.week_number AS weekNumber,
  cm.position,
  cm.created_at AS createdAt,
  cm.updated_at AS updatedAt
`;

const MODULE_COUNTS = `
  (SELECT COUNT(*) FROM lessons l WHERE l.module_id = cm.id) AS lessonCount,
  (SELECT COUNT(*) FROM assessments a WHERE a.module_id = cm.id) AS assessmentCount,
  (SELECT COUNT(*) FROM assignments a WHERE a.module_id = cm.id) AS assignmentCount
`;

export async function listModulesByCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT ${MODULE_COLUMNS}, ${MODULE_COUNTS}
       FROM course_modules cm
      WHERE cm.course_id = ?
      ORDER BY cm.week_number, cm.position, cm.id`,
    [courseId]
  );

  return rows;
}

export async function findModuleById(moduleId) {
  const [rows] = await pool.execute(
    `SELECT ${MODULE_COLUMNS},
            c.title AS courseTitle,
            c.slug AS courseSlug,
            c.is_published AS courseIsPublished
       FROM course_modules cm
       JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = ?
      LIMIT 1`,
    [moduleId]
  );

  return rows[0] || null;
}

export async function findModuleByWeek(courseId, weekNumber, excludeModuleId = null) {
  const [rows] = await pool.execute(
    `SELECT id FROM course_modules
      WHERE course_id = ? AND week_number = ?
        ${excludeModuleId ? "AND id <> ?" : ""}
      LIMIT 1`,
    excludeModuleId
      ? [courseId, weekNumber, excludeModuleId]
      : [courseId, weekNumber]
  );

  return rows[0] || null;
}

async function nextPosition(courseId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
       FROM course_modules WHERE course_id = ?`,
    [courseId]
  );

  return rows[0].nextPosition;
}

export async function createModule({ courseId, position, ...data }) {
  const resolvedPosition = position ?? (await nextPosition(courseId));

  const [result] = await pool.execute(
    `INSERT INTO course_modules
       (course_id, title, description, week_number, position)
     VALUES (?, ?, ?, ?, ?)`,
    [
      courseId,
      data.title,
      data.description,
      data.weekNumber,
      resolvedPosition,
    ]
  );

  return findModuleById(result.insertId);
}

const MODULE_UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  weekNumber: "week_number",
  position: "position",
};

export async function updateModule(moduleId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(MODULE_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(data[key]);
  }

  if (assignments.length) {
    values.push(moduleId);
    await pool.execute(
      `UPDATE course_modules SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findModuleById(moduleId);
}

export async function deleteModule(moduleId) {
  const [result] = await pool.execute(
    "DELETE FROM course_modules WHERE id = ?",
    [moduleId]
  );

  return result.affectedRows > 0;
}
