import { pool } from "../config/db.js";

/**
 * Database access for lessons inside course modules.
 */

const LESSON_COLUMNS = `
  l.id,
  l.module_id AS moduleId,
  l.title,
  l.description,
  l.position,
  l.duration_minutes AS durationMinutes,
  l.video_provider AS videoProvider,
  l.video_url AS videoUrl,
  l.created_at AS createdAt,
  l.updated_at AS updatedAt
`;

export async function listLessonsForModule(moduleId) {
  const [rows] = await pool.execute(
    `SELECT ${LESSON_COLUMNS}
       FROM lessons l
      WHERE l.module_id = ?
      ORDER BY l.position, l.id`,
    [moduleId]
  );

  return rows;
}

export async function findLessonById(lessonId) {
  const [rows] = await pool.execute(
    `SELECT ${LESSON_COLUMNS},
            cm.title AS moduleTitle,
            cm.week_number AS weekNumber,
            cm.course_id AS courseId,
            c.title AS courseTitle
       FROM lessons l
       JOIN course_modules cm ON cm.id = l.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE l.id = ?
      LIMIT 1`,
    [lessonId]
  );

  return rows[0] || null;
}

async function nextPosition(moduleId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
       FROM lessons WHERE module_id = ?`,
    [moduleId]
  );

  return rows[0].nextPosition;
}

export async function createLesson({ moduleId, position, ...data }) {
  const resolvedPosition = position ?? (await nextPosition(moduleId));

  const [result] = await pool.execute(
    `INSERT INTO lessons
       (module_id, title, description, position, duration_minutes,
        video_provider, video_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      data.title,
      data.description,
      resolvedPosition,
      data.durationMinutes,
      data.videoProvider ?? null,
      data.videoUrl ?? null,
    ]
  );

  return findLessonById(result.insertId);
}

const LESSON_UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  position: "position",
  durationMinutes: "duration_minutes",
  videoProvider: "video_provider",
  videoUrl: "video_url",
};

export async function updateLesson(lessonId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(LESSON_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(data[key]);
  }

  if (assignments.length) {
    values.push(lessonId);
    await pool.execute(
      `UPDATE lessons SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findLessonById(lessonId);
}

export async function deleteLesson(lessonId) {
  const [result] = await pool.execute("DELETE FROM lessons WHERE id = ?", [
    lessonId,
  ]);

  return result.affectedRows > 0;
}
