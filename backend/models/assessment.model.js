import { pool } from "../config/db.js";

/**
 * Database access for assessments (quizzes), questions, options and attempts.
 * Correct answers are only returned by the grading-specific functions.
 */

export async function findAssessmentContext(assessmentId) {
  const [rows] = await pool.execute(
    `SELECT a.id,
            a.module_id AS moduleId,
            a.title,
            a.description,
            a.passing_score AS passingScore,
            a.max_attempts AS maxAttempts,
            a.is_published AS isPublished,
            cm.title AS moduleTitle,
            cm.week_number AS weekNumber,
            cm.course_id AS courseId,
            c.title AS courseTitle,
            c.is_published AS courseIsPublished
       FROM assessments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.id = ?
      LIMIT 1`,
    [assessmentId]
  );

  return rows[0] || null;
}

export async function findAssessmentWithQuestions(
  assessmentId,
  { includeCorrectAnswers = false } = {}
) {
  const [rows] = await pool.execute(
    `SELECT q.id AS questionId,
            q.prompt,
            q.explanation,
            q.points,
            q.position AS questionPosition,
            o.id AS optionId,
            o.option_text AS optionText,
            o.is_correct AS isCorrect,
            o.position AS optionPosition
       FROM assessment_questions q
       LEFT JOIN assessment_options o ON o.question_id = q.id
      WHERE q.assessment_id = ?
      ORDER BY q.position, o.position`,
    [assessmentId]
  );

  const questions = new Map();

  for (const row of rows) {
    let question = questions.get(row.questionId);

    if (!question) {
      question = {
        id: row.questionId,
        prompt: row.prompt,
        explanation: row.explanation,
        points: row.points,
        position: row.questionPosition,
        options: [],
      };
      questions.set(row.questionId, question);
    }

    if (row.optionId !== null) {
      const option = {
        id: row.optionId,
        text: row.optionText,
        position: row.optionPosition,
      };

      if (includeCorrectAnswers) {
        option.isCorrect = Boolean(row.isCorrect);
      }

      question.options.push(option);
    }
  }

  return [...questions.values()];
}

export async function listAttempts(assessmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT id,
            attempt_number AS attemptNumber,
            status,
            started_at AS startedAt,
            submitted_at AS submittedAt,
            score,
            earned_points AS earnedPoints,
            total_points AS totalPoints,
            passed
       FROM assessment_attempts
      WHERE assessment_id = ? AND user_id = ?
      ORDER BY attempt_number DESC`,
    [assessmentId, userId]
  );

  return rows;
}

export async function findAttempt(attemptId, assessmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT id,
            assessment_id AS assessmentId,
            user_id AS userId,
            attempt_number AS attemptNumber,
            status,
            started_at AS startedAt,
            submitted_at AS submittedAt,
            score,
            earned_points AS earnedPoints,
            total_points AS totalPoints,
            passed
       FROM assessment_attempts
      WHERE id = ? AND assessment_id = ? AND user_id = ?
      LIMIT 1`,
    [attemptId, assessmentId, userId]
  );

  return rows[0] || null;
}

export async function findAttemptById(attemptId) {
  const [rows] = await pool.execute(
    `SELECT id,
            assessment_id AS assessmentId,
            user_id AS userId,
            attempt_number AS attemptNumber,
            status,
            started_at AS startedAt,
            submitted_at AS submittedAt,
            score,
            earned_points AS earnedPoints,
            total_points AS totalPoints,
            passed
       FROM assessment_attempts
      WHERE id = ?
      LIMIT 1`,
    [attemptId]
  );

  return rows[0] || null;
}

export async function findInProgressAttempt(assessmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT id,
            attempt_number AS attemptNumber,
            started_at AS startedAt
       FROM assessment_attempts
      WHERE assessment_id = ? AND user_id = ? AND status = 'in_progress'
      ORDER BY attempt_number DESC
      LIMIT 1`,
    [assessmentId, userId]
  );

  return rows[0] || null;
}

export async function createAttempt({ assessmentId, userId, attemptNumber }) {
  const [result] = await pool.execute(
    `INSERT INTO assessment_attempts
       (assessment_id, user_id, attempt_number, status)
     VALUES (?, ?, ?, 'in_progress')`,
    [assessmentId, userId, attemptNumber]
  );

  return findAttempt(result.insertId, assessmentId, userId);
}

export async function countSubmittedAttempts(assessmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM assessment_attempts
      WHERE assessment_id = ? AND user_id = ? AND status = 'submitted'`,
    [assessmentId, userId]
  );

  return rows[0]?.total ?? 0;
}

export async function saveAttemptAnswers(attemptId, answers) {
  if (!answers.length) return;

  const placeholders = answers
    .map(() => "(?, ?, ?, ?)")
    .join(", ");
  const values = answers.flatMap((answer) => [
    attemptId,
    answer.questionId,
    answer.optionId,
    answer.isCorrect ? 1 : 0,
  ]);

  await pool.execute(
    `INSERT INTO assessment_answers
       (attempt_id, question_id, option_id, is_correct)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       option_id = VALUES(option_id),
       is_correct = VALUES(is_correct)`,
    values
  );
}

export async function finishAttempt(attemptId, result) {
  await pool.execute(
    `UPDATE assessment_attempts
        SET status = 'submitted',
            submitted_at = UTC_TIMESTAMP(),
            score = ?,
            earned_points = ?,
            total_points = ?,
            passed = ?
      WHERE id = ?`,
    [
      result.score,
      result.earnedPoints,
      result.totalPoints,
      result.passed ? 1 : 0,
      attemptId,
    ]
  );
}

export async function listAttemptAnswers(attemptId) {
  const [rows] = await pool.execute(
    `SELECT aa.question_id AS questionId,
            aa.option_id AS selectedOptionId,
            aa.is_correct AS isCorrect,
            q.prompt,
            q.explanation,
            q.points,
            q.position AS questionPosition,
            (SELECT o.id
               FROM assessment_options o
              WHERE o.question_id = q.id AND o.is_correct = 1
              ORDER BY o.position
              LIMIT 1) AS correctOptionId
       FROM assessment_answers aa
       JOIN assessment_questions q ON q.id = aa.question_id
      WHERE aa.attempt_id = ?
      ORDER BY q.position`,
    [attemptId]
  );

  return rows;
}

/* ------------------------------------------------------------------ */
/* Staff / authoring API                                               */
/* ------------------------------------------------------------------ */

const ASSESSMENT_MANAGE_COLUMNS = `
  a.id,
  a.module_id AS moduleId,
  a.title,
  a.description,
  a.passing_score AS passingScore,
  a.max_attempts AS maxAttempts,
  a.is_published AS isPublished,
  a.created_at AS createdAt,
  a.updated_at AS updatedAt,
  cm.title AS moduleTitle,
  cm.week_number AS weekNumber,
  cm.course_id AS courseId,
  c.title AS courseTitle,
  c.is_published AS courseIsPublished
`;

const ASSESSMENT_MANAGE_COUNTS = `
  (SELECT COUNT(*) FROM assessment_questions q WHERE q.assessment_id = a.id)
    AS questionCount,
  (SELECT COUNT(*) FROM assessment_attempts at WHERE at.assessment_id = a.id)
    AS attemptCount
`;

export async function listAssessmentsByCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSESSMENT_MANAGE_COLUMNS}, ${ASSESSMENT_MANAGE_COUNTS}
       FROM assessments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE cm.course_id = ?
      ORDER BY cm.week_number, cm.position, a.id`,
    [courseId]
  );

  return rows;
}

export async function listAssessmentsByModule(moduleId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSESSMENT_MANAGE_COLUMNS}, ${ASSESSMENT_MANAGE_COUNTS}
       FROM assessments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.module_id = ?
      ORDER BY a.id`,
    [moduleId]
  );

  return rows;
}

export async function findAssessmentForManagement(assessmentId) {
  const [rows] = await pool.execute(
    `SELECT ${ASSESSMENT_MANAGE_COLUMNS}, ${ASSESSMENT_MANAGE_COUNTS}
       FROM assessments a
       JOIN course_modules cm ON cm.id = a.module_id
       JOIN courses c ON c.id = cm.course_id
      WHERE a.id = ?
      LIMIT 1`,
    [assessmentId]
  );

  return rows[0] || null;
}

export async function createAssessment({ moduleId, ...data }) {
  const [result] = await pool.execute(
    `INSERT INTO assessments
       (module_id, title, description, passing_score, max_attempts, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      data.title,
      data.description,
      data.passingScore,
      data.maxAttempts,
      data.isPublished ? 1 : 0,
    ]
  );

  return findAssessmentForManagement(result.insertId);
}

const ASSESSMENT_UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  passingScore: "passing_score",
  maxAttempts: "max_attempts",
  isPublished: "is_published",
};

export async function updateAssessment(assessmentId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(ASSESSMENT_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(key === "isPublished" ? (data[key] ? 1 : 0) : data[key]);
  }

  if (assignments.length) {
    values.push(assessmentId);
    await pool.execute(
      `UPDATE assessments SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findAssessmentForManagement(assessmentId);
}

export async function deleteAssessment(assessmentId) {
  const [result] = await pool.execute(
    "DELETE FROM assessments WHERE id = ?",
    [assessmentId]
  );

  return result.affectedRows > 0;
}

export async function findQuestionById(questionId) {
  const [rows] = await pool.execute(
    `SELECT q.id,
            q.assessment_id AS assessmentId,
            q.prompt,
            q.explanation,
            q.points,
            q.position,
            a.is_published AS assessmentIsPublished,
            a.module_id AS moduleId,
            a.title AS assessmentTitle
       FROM assessment_questions q
       JOIN assessments a ON a.id = q.assessment_id
      WHERE q.id = ?
      LIMIT 1`,
    [questionId]
  );

  return rows[0] || null;
}

async function nextQuestionPosition(assessmentId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
       FROM assessment_questions WHERE assessment_id = ?`,
    [assessmentId]
  );

  return rows[0].nextPosition;
}

export async function createQuestion({ assessmentId, position, ...data }) {
  const resolvedPosition =
    position ?? (await nextQuestionPosition(assessmentId));

  const [result] = await pool.execute(
    `INSERT INTO assessment_questions
       (assessment_id, prompt, explanation, points, position)
     VALUES (?, ?, ?, ?, ?)`,
    [
      assessmentId,
      data.prompt,
      data.explanation,
      data.points,
      resolvedPosition,
    ]
  );

  return findQuestionById(result.insertId);
}

const QUESTION_UPDATE_COLUMNS = {
  prompt: "prompt",
  explanation: "explanation",
  points: "points",
  position: "position",
};

export async function updateQuestion(questionId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(QUESTION_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(data[key]);
  }

  if (assignments.length) {
    values.push(questionId);
    await pool.execute(
      `UPDATE assessment_questions SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findQuestionById(questionId);
}

export async function deleteQuestion(questionId) {
  const [result] = await pool.execute(
    "DELETE FROM assessment_questions WHERE id = ?",
    [questionId]
  );

  return result.affectedRows > 0;
}

export async function findOptionById(optionId) {
  const [rows] = await pool.execute(
    `SELECT o.id,
            o.question_id AS questionId,
            o.option_text AS text,
            o.is_correct AS isCorrect,
            o.position,
            q.assessment_id AS assessmentId,
            a.is_published AS assessmentIsPublished
       FROM assessment_options o
       JOIN assessment_questions q ON q.id = o.question_id
       JOIN assessments a ON a.id = q.assessment_id
      WHERE o.id = ?
      LIMIT 1`,
    [optionId]
  );

  return rows[0] || null;
}

async function nextOptionPosition(questionId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
       FROM assessment_options WHERE question_id = ?`,
    [questionId]
  );

  return rows[0].nextPosition;
}

export async function createOption({ questionId, position, ...data }) {
  const resolvedPosition = position ?? (await nextOptionPosition(questionId));

  const [result] = await pool.execute(
    `INSERT INTO assessment_options
       (question_id, option_text, is_correct, position)
     VALUES (?, ?, ?, ?)`,
    [questionId, data.text, data.isCorrect ? 1 : 0, resolvedPosition]
  );

  return findOptionById(result.insertId);
}

const OPTION_UPDATE_COLUMNS = {
  text: "option_text",
  isCorrect: "is_correct",
  position: "position",
};

export async function updateOption(optionId, data) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(OPTION_UPDATE_COLUMNS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(key === "isCorrect" ? (data[key] ? 1 : 0) : data[key]);
  }

  if (assignments.length) {
    values.push(optionId);
    await pool.execute(
      `UPDATE assessment_options SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );
  }

  return findOptionById(optionId);
}

export async function deleteOption(optionId) {
  const [result] = await pool.execute(
    "DELETE FROM assessment_options WHERE id = ?",
    [optionId]
  );

  return result.affectedRows > 0;
}

export async function countQuestions(assessmentId) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM assessment_questions WHERE assessment_id = ?",
    [assessmentId]
  );

  return rows[0].total;
}

export async function countCorrectOptions(questionId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM assessment_options
      WHERE question_id = ? AND is_correct = 1`,
    [questionId]
  );

  return rows[0].total;
}

export async function listAttemptsForAssessment(assessmentId) {
  const [rows] = await pool.execute(
    `SELECT at.id,
            at.attempt_number AS attemptNumber,
            at.status,
            at.started_at AS startedAt,
            at.submitted_at AS submittedAt,
            at.score,
            at.earned_points AS earnedPoints,
            at.total_points AS totalPoints,
            at.passed,
            u.id AS userId,
            u.full_name AS studentName,
            u.email AS studentEmail
       FROM assessment_attempts at
       JOIN users u ON u.id = at.user_id
      WHERE at.assessment_id = ?
      ORDER BY at.submitted_at DESC, at.id DESC`,
    [assessmentId]
  );

  return rows;
}
