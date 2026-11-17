import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  validateAssignmentInput,
  validateGradeInput,
} from "../validators/manage.validators.js";
import { findCourseForManagement } from "../models/course.model.js";
import { findModuleById } from "../models/module.model.js";
import {
  createAssignment,
  deleteAssignment,
  findAssignmentForManagement,
  findSubmissionById,
  gradeSubmission,
  listAssignmentsByCourse,
  listAssignmentsByModule,
  listSubmissionsForAssignment,
  updateAssignment,
} from "../models/assignment.model.js";

export const listCourseAssignments = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const assignments = await listAssignmentsByCourse(courseId);

  res.status(200).json({
    success: true,
    message: "Course assignments",
    data: { courseId, assignments },
  });
});

export const listModuleAssignments = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const assignments = await listAssignmentsByModule(moduleId);

  res.status(200).json({
    success: true,
    message: "Module assignments",
    data: { moduleId, assignments },
  });
});

export const getAssignmentManagement = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const assignment = await findAssignmentForManagement(assignmentId);

  if (!assignment) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  const submissions = await listSubmissionsForAssignment(assignmentId);

  res.status(200).json({
    success: true,
    message: "Assignment content",
    data: { assignment: { ...assignment, submissions } },
  });
});

export const createAssignmentHandler = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const data = validateAssignmentInput(req.body);
  const assignment = await createAssignment({ moduleId, ...data });

  res.status(201).json({
    success: true,
    message: data.isPublished
      ? "Assignment created and published."
      : "Assignment created as a draft.",
    data: { assignment },
  });
});

export const updateAssignmentHandler = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const existing = await findAssignmentForManagement(assignmentId);

  if (!existing) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  const data = validateAssignmentInput(req.body, { partial: true });
  const assignment = await updateAssignment(assignmentId, data);

  res.status(200).json({
    success: true,
    message:
      data.isPublished === true
        ? "Assignment published."
        : data.isPublished === false
          ? "Assignment unpublished."
          : "Assignment updated.",
    data: { assignment },
  });
});

function assignmentPublicationHandler(isPublished) {
  return asyncHandler(async (req, res) => {
    const assignmentId = parsePositiveId(
      req.params.assignmentId,
      "Assignment ID"
    );
    const existing = await findAssignmentForManagement(assignmentId);

    if (!existing) {
      throw ApiError.notFound("This assignment could not be found.");
    }

    const assignment = await updateAssignment(assignmentId, { isPublished });

    res.status(200).json({
      success: true,
      message: isPublished
        ? "Assignment published."
        : "Assignment unpublished.",
      data: { assignment },
    });
  });
}

export const publishAssignment = assignmentPublicationHandler(true);
export const unpublishAssignment = assignmentPublicationHandler(false);

export const deleteAssignmentHandler = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const existing = await findAssignmentForManagement(assignmentId);

  if (!existing) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  await deleteAssignment(assignmentId);

  res.status(200).json({
    success: true,
    message: "Assignment deleted.",
    data: { assignmentId },
  });
});

export const listAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const assignment = await findAssignmentForManagement(assignmentId);

  if (!assignment) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  const submissions = await listSubmissionsForAssignment(assignmentId);
  const graded = submissions.filter(
    (submission) => submission.status === "graded"
  );
  const pending = submissions.filter(
    (submission) => submission.status !== "graded"
  );

  res.status(200).json({
    success: true,
    message: "Assignment submissions",
    data: {
      assignment,
      submissions,
      summary: {
        total: submissions.length,
        graded: graded.length,
        pending: pending.length,
        averageScore: graded.length
          ? Math.round(
              (graded.reduce(
                (total, submission) => total + Number(submission.score),
                0
              ) /
                graded.length) *
                10
            ) / 10
          : null,
      },
    },
  });
});

export const gradeSubmissionHandler = asyncHandler(async (req, res) => {
  const submissionId = parsePositiveId(req.params.submissionId, "Submission ID");
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw ApiError.notFound("This submission could not be found.");
  }

  const { score, feedback } = validateGradeInput(req.body);

  if (score > submission.maxPoints) {
    throw ApiError.badRequest(
      `Score cannot be more than the assignment maximum of ${submission.maxPoints}.`,
      [
        {
          field: "score",
          message: `Score must be between 0 and ${submission.maxPoints}.`,
        },
      ]
    );
  }

  const graded = await gradeSubmission(submissionId, {
    score,
    feedback,
    gradedBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: "Submission graded.",
    data: { submission: graded },
  });
});
