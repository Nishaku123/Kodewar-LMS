import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import { validateAttemptAnswers } from "../validators/learning.validators.js";
import {
  countSubmittedAttempts,
  createAttempt,
  findAssessmentContext,
  findAssessmentWithQuestions,
  findAttempt,
  findInProgressAttempt,
  finishAttempt,
  listAttemptAnswers,
  listAttempts,
  saveAttemptAnswers,
} from "../models/assessment.model.js";
import {
  isEnrolledInCourse,
} from "../models/progress.model.js";
import { listEnrolledCoursesForStudent } from "../models/course.model.js";
import {
  findAssessmentInModules,
  getCourseProgress,
} from "../services/progress.service.js";

function remainingAttempts(assessment, attemptsUsed) {
  if (!assessment.maxAttempts) return null;
  return Math.max(0, assessment.maxAttempts - attemptsUsed);
}

async function loadEnrolledAssessment(userId, assessmentId) {
  const context = await findAssessmentContext(assessmentId);

  if (
    !context ||
    !context.isPublished ||
    !context.courseIsPublished
  ) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  const enrolled = await isEnrolledInCourse(userId, context.courseId);

  if (!enrolled) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  const progress = await getCourseProgress(context.courseId, userId);
  const found = findAssessmentInModules(progress.modules, assessmentId);

  if (!found) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  return { context, progress, module: found.module, assessment: found.assessment };
}

function buildReview(attempt, answers) {
  return {
    attempt: {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      earnedPoints: attempt.earnedPoints,
      totalPoints: attempt.totalPoints,
      passed: Boolean(attempt.passed),
    },
    answers: answers.map((answer) => ({
      questionId: answer.questionId,
      prompt: answer.prompt,
      explanation: answer.explanation,
      points: answer.points,
      selectedOptionId: answer.selectedOptionId,
      correctOptionId: answer.correctOptionId,
      isCorrect: Boolean(answer.isCorrect),
    })),
  };
}

export const getMyAssessments = asyncHandler(async (req, res) => {
  const courses = await listEnrolledCoursesForStudent(req.user.id);
  const assessments = [];

  for (const course of courses) {
    const progress = await getCourseProgress(course.id, req.user.id);

    for (const module of progress.modules) {
      for (const assessment of module.assessments) {
        assessments.push({
          ...assessment,
          courseId: course.id,
          courseTitle: course.title,
        });
      }
    }
  }

  const summary = {
    total: assessments.length,
    passed: assessments.filter((assessment) => assessment.passed).length,
    available: assessments.filter(
      (assessment) => assessment.isUnlocked && !assessment.passed
    ).length,
    locked: assessments.filter((assessment) => !assessment.isUnlocked).length,
  };

  res.status(200).json({
    success: true,
    message: "Assessments",
    data: { assessments, summary },
  });
});

export const getAssessment = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const { context, module, assessment } = await loadEnrolledAssessment(
    req.user.id,
    assessmentId
  );

  const [questions, attempts] = await Promise.all([
    findAssessmentWithQuestions(assessmentId),
    listAttempts(assessmentId, req.user.id),
  ]);

  const submittedAttempts = attempts.filter(
    (attempt) => attempt.status === "submitted"
  );
  const activeAttempt =
    attempts.find((attempt) => attempt.status === "in_progress") || null;
  const attemptsUsed = submittedAttempts.length;
  const attemptsRemaining = remainingAttempts(assessment, attemptsUsed);

  const canAttempt =
    assessment.isUnlocked &&
    !assessment.passed &&
    (assessment.maxAttempts === 0 || attemptsUsed < assessment.maxAttempts);

  res.status(200).json({
    success: true,
    message: "Assessment details",
    data: {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        isUnlocked: assessment.isUnlocked,
        passed: assessment.passed,
        bestScore: assessment.bestScore,
        attemptsUsed,
        attemptsRemaining,
        canAttempt,
        course: { id: context.courseId, title: context.courseTitle },
        module: {
          id: module.id,
          title: module.title,
          weekNumber: module.weekNumber,
        },
        questions: questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          points: question.points,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
          })),
        })),
        attempts: submittedAttempts,
        activeAttempt: activeAttempt
          ? {
              id: activeAttempt.id,
              attemptNumber: activeAttempt.attemptNumber,
              startedAt: activeAttempt.startedAt,
            }
          : null,
      },
    },
  });
});

export const startAssessmentAttempt = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const { assessment } = await loadEnrolledAssessment(
    req.user.id,
    assessmentId
  );

  if (!assessment.isUnlocked) {
    throw ApiError.forbidden(
      "Finish the earlier lessons before starting this assessment."
    );
  }

  if (assessment.passed) {
    throw ApiError.conflict("You have already passed this assessment.");
  }

  const existing = await findInProgressAttempt(assessmentId, req.user.id);

  if (existing) {
    return res.status(200).json({
      success: true,
      message: "Resuming your assessment attempt.",
      data: { attempt: existing, resumed: true },
    });
  }

  const attemptsUsed = await countSubmittedAttempts(
    assessmentId,
    req.user.id
  );

  if (assessment.maxAttempts && attemptsUsed >= assessment.maxAttempts) {
    throw ApiError.conflict(
      "You have used all attempts for this assessment."
    );
  }

  let attempt;

  try {
    attempt = await createAttempt({
      assessmentId,
      userId: req.user.id,
      attemptNumber: attemptsUsed + 1,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      attempt = await findInProgressAttempt(assessmentId, req.user.id);

      if (attempt) {
        return res.status(200).json({
          success: true,
          message: "Resuming your assessment attempt.",
          data: { attempt, resumed: true },
        });
      }
    }

    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Assessment attempt started.",
    data: { attempt, resumed: false },
  });
});

export const submitAssessmentAttempt = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const attemptId = parsePositiveId(req.params.attemptId, "Attempt ID");
  const { assessment } = await loadEnrolledAssessment(
    req.user.id,
    assessmentId
  );

  const attempt = await findAttempt(attemptId, assessmentId, req.user.id);

  if (!attempt) {
    throw ApiError.notFound("This attempt could not be found.");
  }

  if (attempt.status === "submitted") {
    throw ApiError.conflict("This attempt has already been submitted.");
  }

  const answers = validateAttemptAnswers(req.body?.answers);
  const questions = await findAssessmentWithQuestions(assessmentId, {
    includeCorrectAnswers: true,
  });

  if (!questions.length) {
    throw ApiError.badRequest(
      "This assessment does not have any questions yet."
    );
  }

  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.optionId])
  );

  let totalPoints = 0;
  let earnedPoints = 0;

  const gradedAnswers = questions.map((question) => {
    const selectedOptionId = answerMap.get(question.id) ?? null;

    if (selectedOptionId !== null) {
      const belongsToQuestion = question.options.some(
        (option) => option.id === selectedOptionId
      );

      if (!belongsToQuestion) {
        throw ApiError.badRequest(
          "One of the selected answers does not belong to this assessment."
        );
      }
    }

    const correctOption = question.options.find((option) => option.isCorrect);
    const isCorrect = Boolean(
      correctOption && selectedOptionId === correctOption.id
    );

    totalPoints += Number(question.points);
    if (isCorrect) earnedPoints += Number(question.points);

    return {
      questionId: question.id,
      optionId: selectedOptionId,
      isCorrect,
    };
  });

  const score = totalPoints
    ? Math.round((earnedPoints / totalPoints) * 10000) / 100
    : 0;
  const passed = score >= assessment.passingScore;

  await saveAttemptAnswers(attemptId, gradedAnswers);
  await finishAttempt(attemptId, {
    score,
    earnedPoints,
    totalPoints,
    passed,
  });

  const [submittedAttempt, reviewAnswers, attemptsUsed] = await Promise.all([
    findAttempt(attemptId, assessmentId, req.user.id),
    listAttemptAnswers(attemptId),
    countSubmittedAttempts(assessmentId, req.user.id),
  ]);

  const review = buildReview(submittedAttempt, reviewAnswers);
  const attemptsRemaining = remainingAttempts(assessment, attemptsUsed);

  res.status(200).json({
    success: true,
    message: passed
      ? "Assessment passed. Well done!"
      : "Assessment submitted. You can try again if attempts remain.",
    data: {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        attemptsUsed,
        attemptsRemaining,
        canRetake: !passed && (attemptsRemaining === null || attemptsRemaining > 0),
      },
      ...review,
    },
  });
});

export const getAssessmentAttempt = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const attemptId = parsePositiveId(req.params.attemptId, "Attempt ID");
  const { assessment } = await loadEnrolledAssessment(
    req.user.id,
    assessmentId
  );

  const attempt = await findAttempt(attemptId, assessmentId, req.user.id);

  if (!attempt) {
    throw ApiError.notFound("This attempt could not be found.");
  }

  if (attempt.status !== "submitted") {
    throw ApiError.conflict("This attempt has not been submitted yet.");
  }

  const reviewAnswers = await listAttemptAnswers(attemptId);
  const attemptsUsed = await countSubmittedAttempts(
    assessmentId,
    req.user.id
  );
  const attemptsRemaining = remainingAttempts(assessment, attemptsUsed);

  res.status(200).json({
    success: true,
    message: "Attempt result",
    data: {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        attemptsUsed,
        attemptsRemaining,
        canRetake:
          !assessment.passed &&
          !attempt.passed &&
          (attemptsRemaining === null || attemptsRemaining > 0),
      },
      ...buildReview(attempt, reviewAnswers),
    },
  });
});
