import { pool } from "../config/db.js";

/**
 * Database access for lesson completions and course progress.
 * Progress itself is never stored as a mutable percentage: it is derived from
 * real lesson completions, passed assessment attempts and assignment
 * submissions. That keeps the numbers honest after content changes.
 */

export async function listCourseStructure(courseId) {
  const [lessonRows] = await pool.execute(
    `SELECT cm.id AS moduleId,
            cm.title AS moduleTitle,
            cm.description AS moduleDescription,
            cm.week_number AS weekNumber,
            cm.position AS modulePosition,
            l.id AS lessonId,
            l.title AS lessonTitle,
            l.description AS lessonDescription,
            l.position AS lessonPosition,
            l.duration_minutes AS lessonDurationMinutes,
            l.video_provider AS videoProvider,
            l.video_url AS videoUrl
       FROM course_modules cm
       LEFT JOIN lessons l ON l.module_id = cm.id
      WHERE cm.course_id = ?
      ORDER BY cm.week_number, cm.position, l.position`,
    [courseId]
  );

  const [assessmentRows] = await pool.execute(
    `SELECT a.id,
            a.module_id AS moduleId,
            a.title,
            a.description,
            a.passing_score AS passingScore,
            a.max_attempts AS maxAttempts
       FROM assessments a
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE cm.course_id = ? AND a.is_published = 1
      ORDER BY cm.week_number, cm.position, a.id`,
    [courseId]
  );

  const [assignmentRows] = await pool.execute(
    `SELECT a.id,
            a.module_id AS moduleId,
            a.title,
            a.description,
            a.instructions,
            a.due_at AS dueAt,
            a.max_points AS maxPoints
       FROM assignments a
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE cm.course_id = ? AND a.is_published = 1
      ORDER BY cm.week_number, cm.position, a.id`,
    [courseId]
  );

  const modules = new Map();

  for (const row of lessonRows) {
    let module = modules.get(row.moduleId);

    if (!module) {
      module = {
        id: row.moduleId,
        title: row.moduleTitle,
        description: row.moduleDescription,
        weekNumber: row.weekNumber,
        lessons: [],
        assessments: [],
        assignments: [],
      };
      modules.set(row.moduleId, module);
    }

    if (row.lessonId !== null) {
      module.lessons.push({
        id: row.lessonId,
        title: row.lessonTitle,
        description: row.lessonDescription,
        durationMinutes: row.lessonDurationMinutes,
        videoProvider: row.videoProvider,
        videoUrl: row.videoUrl,
      });
    }
  }

  for (const assessment of assessmentRows) {
    modules.get(assessment.moduleId)?.assessments.push(assessment);
  }

  for (const assignment of assignmentRows) {
    modules.get(assignment.moduleId)?.assignments.push(assignment);
  }

  return [...modules.values()];
}

export async function listLessonCompletionIds(userId, courseId) {
  const [rows] = await pool.execute(
    `SELECT lc.lesson_id AS lessonId
       FROM lesson_completions lc
       JOIN lessons l ON l.id = lc.lesson_id
       JOIN course_modules cm ON cm.id = l.module_id
      WHERE lc.user_id = ? AND cm.course_id = ?`,
    [userId, courseId]
  );

  return new Set(rows.map((row) => row.lessonId));
}

export async function listAssessmentProgress(userId, courseId) {
  const [rows] = await pool.execute(
    `SELECT at.assessment_id AS assessmentId,
            COUNT(*) AS attemptsUsed,
            MAX(at.score) AS bestScore,
            MAX(at.passed) AS passed,
            MAX(at.submitted_at) AS lastAttemptAt
       FROM assessment_attempts at
       JOIN assessments a ON a.id = at.assessment_id
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE at.user_id = ?
        AND at.status = 'submitted'
        AND cm.course_id = ?
      GROUP BY at.assessment_id`,
    [userId, courseId]
  );

  return new Map(rows.map((row) => [row.assessmentId, row]));
}

export async function listAssignmentProgress(userId, courseId) {
  const [rows] = await pool.execute(
    `SELECT s.assignment_id AS assignmentId,
            s.id AS submissionId,
            s.status,
            s.score,
            s.feedback,
            s.submitted_at AS submittedAt,
            s.updated_at AS updatedAt,
            s.graded_at AS gradedAt
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE s.user_id = ? AND cm.course_id = ?`,
    [userId, courseId]
  );

  return new Map(rows.map((row) => [row.assignmentId, row]));
}

export async function findLessonCourseContext(lessonId) {
  const [rows] = await pool.execute(
    `SELECT l.id,
            l.title,
            l.module_id AS moduleId,
            cm.course_id AS courseId,
            cm.week_number AS weekNumber
       FROM lessons l
       JOIN course_modules cm ON cm.id = l.module_id
      WHERE l.id = ?
      LIMIT 1`,
    [lessonId]
  );

  return rows[0] || null;
}

export async function markLessonComplete(userId, lessonId) {
  await pool.execute(
    `INSERT INTO lesson_completions (user_id, lesson_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE completed_at = completed_at`,
    [userId, lessonId]
  );
}

export async function unmarkLessonComplete(userId, lessonId) {
  const [result] = await pool.execute(
    "DELETE FROM lesson_completions WHERE user_id = ? AND lesson_id = ?",
    [userId, lessonId]
  );

  return result.affectedRows > 0;
}

export async function isEnrolledInCourse(userId, courseId) {
  const [rows] = await pool.execute(
    `SELECT 1 AS enrolled
       FROM course_enrollments
      WHERE user_id = ? AND course_id = ?
      LIMIT 1`,
    [userId, courseId]
  );

  return rows.length > 0;
}
