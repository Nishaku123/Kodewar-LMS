import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  validateAssessmentInput,
  validateOptionInput,
  validateQuestionInput,
} from "../validators/manage.validators.js";
import { findCourseForManagement } from "../models/course.model.js";
import { findModuleById } from "../models/module.model.js";
import {
  createAssessment,
  createOption,
  createQuestion,
  deleteAssessment,
  deleteOption,
  deleteQuestion,
  findAssessmentForManagement,
  findAssessmentWithQuestions,
  findOptionById,
  findQuestionById,
  listAssessmentsByCourse,
  listAssessmentsByModule,
  listAttemptsForAssessment,
  updateAssessment,
  updateOption,
  updateQuestion,
} from "../models/assessment.model.js";

async function assertAssessmentReadyToPublish(assessmentId) {
  const questions = await findAssessmentWithQuestions(assessmentId, {
    includeCorrectAnswers: true,
  });

  if (!questions.length) {
    throw ApiError.badRequest(
      "Add at least one question before publishing the assessment.",
      [{ field: "isPublished", message: "An assessment needs at least one question." }]
    );
  }

  const problems = [];

  questions.forEach((question, index) => {
    if (question.options.length < 2) {
      problems.push({
        field: `questions[${index}].options`,
        message: "Each question needs at least two options.",
      });
    }

    const correct = question.options.filter((option) => option.isCorrect);

    if (correct.length !== 1) {
      problems.push({
        field: `questions[${index}].options`,
        message: "Each question needs exactly one correct option.",
      });
    }
  });

  if (problems.length) {
    throw ApiError.badRequest(
      "This assessment is not ready to publish.",
      problems
    );
  }
}

function assertDraft(isPublished, message) {
  if (isPublished) {
    throw ApiError.conflict(
      message ||
        "Unpublish this assessment before changing its questions or options."
    );
  }
}

export const listCourseAssessments = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const assessments = await listAssessmentsByCourse(courseId);

  res.status(200).json({
    success: true,
    message: "Course assessments",
    data: { courseId, assessments },
  });
});

export const listModuleAssessments = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const assessments = await listAssessmentsByModule(moduleId);

  res.status(200).json({
    success: true,
    message: "Module assessments",
    data: { moduleId, assessments },
  });
});

export const getAssessmentManagement = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const assessment = await findAssessmentForManagement(assessmentId);

  if (!assessment) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  const questions = await findAssessmentWithQuestions(assessmentId, {
    includeCorrectAnswers: true,
  });

  res.status(200).json({
    success: true,
    message: "Assessment content",
    data: { assessment: { ...assessment, questions } },
  });
});

export const createAssessmentHandler = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const data = validateAssessmentInput(req.body);

  if (data.isPublished) {
    throw ApiError.badRequest(
      "Create the assessment as a draft, add questions, then publish it.",
      [{ field: "isPublished", message: "New assessments must start unpublished." }]
    );
  }

  const assessment = await createAssessment({ moduleId, ...data });

  res.status(201).json({
    success: true,
    message: "Assessment created as a draft.",
    data: { assessment },
  });
});

export const updateAssessmentHandler = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const existing = await findAssessmentForManagement(assessmentId);

  if (!existing) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  const data = validateAssessmentInput(req.body, { partial: true });

  if (data.isPublished === true) {
    await assertAssessmentReadyToPublish(assessmentId);
  }

  const assessment = await updateAssessment(assessmentId, data);

  res.status(200).json({
    success: true,
    message: data.isPublished === true
      ? "Assessment published."
      : data.isPublished === false
        ? "Assessment unpublished."
        : "Assessment updated.",
    data: { assessment },
  });
});

function assessmentPublicationHandler(isPublished) {
  return asyncHandler(async (req, res) => {
    const assessmentId = parsePositiveId(
      req.params.assessmentId,
      "Assessment ID"
    );
    const existing = await findAssessmentForManagement(assessmentId);

    if (!existing) {
      throw ApiError.notFound("This assessment could not be found.");
    }

    if (isPublished) {
      await assertAssessmentReadyToPublish(assessmentId);
    }

    const assessment = await updateAssessment(assessmentId, { isPublished });

    res.status(200).json({
      success: true,
      message: isPublished
        ? "Assessment published."
        : "Assessment unpublished.",
      data: { assessment },
    });
  });
}

export const publishAssessment = assessmentPublicationHandler(true);
export const unpublishAssessment = assessmentPublicationHandler(false);

export const deleteAssessmentHandler = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const existing = await findAssessmentForManagement(assessmentId);

  if (!existing) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  await deleteAssessment(assessmentId);

  res.status(200).json({
    success: true,
    message: "Assessment deleted.",
    data: { assessmentId },
  });
});

export const createQuestionHandler = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const assessment = await findAssessmentForManagement(assessmentId);

  if (!assessment) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  assertDraft(assessment.isPublished);

  const data = validateQuestionInput(req.body);
  const question = await createQuestion({ assessmentId, ...data });

  res.status(201).json({
    success: true,
    message: "Question created.",
    data: { question },
  });
});

export const updateQuestionHandler = asyncHandler(async (req, res) => {
  const questionId = parsePositiveId(req.params.questionId, "Question ID");
  const existing = await findQuestionById(questionId);

  if (!existing) {
    throw ApiError.notFound("This question could not be found.");
  }

  assertDraft(existing.assessmentIsPublished);

  const data = validateQuestionInput(req.body, { partial: true });
  const question = await updateQuestion(questionId, data);

  res.status(200).json({
    success: true,
    message: "Question updated.",
    data: { question },
  });
});

export const deleteQuestionHandler = asyncHandler(async (req, res) => {
  const questionId = parsePositiveId(req.params.questionId, "Question ID");
  const existing = await findQuestionById(questionId);

  if (!existing) {
    throw ApiError.notFound("This question could not be found.");
  }

  assertDraft(existing.assessmentIsPublished);

  await deleteQuestion(questionId);

  res.status(200).json({
    success: true,
    message: "Question deleted.",
    data: { questionId },
  });
});

export const createOptionHandler = asyncHandler(async (req, res) => {
  const questionId = parsePositiveId(req.params.questionId, "Question ID");
  const question = await findQuestionById(questionId);

  if (!question) {
    throw ApiError.notFound("This question could not be found.");
  }

  assertDraft(question.assessmentIsPublished);

  const data = validateOptionInput(req.body);
  const option = await createOption({ questionId, ...data });

  res.status(201).json({
    success: true,
    message: "Option created.",
    data: { option },
  });
});

export const updateOptionHandler = asyncHandler(async (req, res) => {
  const optionId = parsePositiveId(req.params.optionId, "Option ID");
  const existing = await findOptionById(optionId);

  if (!existing) {
    throw ApiError.notFound("This option could not be found.");
  }

  assertDraft(existing.assessmentIsPublished);

  const data = validateOptionInput(req.body, { partial: true });
  const option = await updateOption(optionId, data);

  res.status(200).json({
    success: true,
    message: "Option updated.",
    data: { option },
  });
});

export const deleteOptionHandler = asyncHandler(async (req, res) => {
  const optionId = parsePositiveId(req.params.optionId, "Option ID");
  const existing = await findOptionById(optionId);

  if (!existing) {
    throw ApiError.notFound("This option could not be found.");
  }

  assertDraft(existing.assessmentIsPublished);

  await deleteOption(optionId);

  res.status(200).json({
    success: true,
    message: "Option deleted.",
    data: { optionId },
  });
});

export const getAssessmentAttempts = asyncHandler(async (req, res) => {
  const assessmentId = parsePositiveId(req.params.assessmentId, "Assessment ID");
  const assessment = await findAssessmentForManagement(assessmentId);

  if (!assessment) {
    throw ApiError.notFound("This assessment could not be found.");
  }

  const attempts = await listAttemptsForAssessment(assessmentId);
  const submitted = attempts.filter((attempt) => attempt.status === "submitted");
  const passed = submitted.filter((attempt) => attempt.passed);

  res.status(200).json({
    success: true,
    message: "Assessment attempts",
    data: {
      assessment,
      attempts,
      summary: {
        total: attempts.length,
        submitted: submitted.length,
        passed: passed.length,
        averageScore: submitted.length
          ? Math.round(
              (submitted.reduce(
                (total, attempt) => total + Number(attempt.score),
                0
              ) /
                submitted.length) *
                10
            ) / 10
          : null,
      },
    },
  });
});
