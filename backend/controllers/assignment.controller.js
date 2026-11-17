import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import { validateSubmission } from "../validators/learning.validators.js";
import {
  findAssignmentContext,
  findSubmission,
  saveSubmission,
} from "../models/assignment.model.js";
import { isEnrolledInCourse } from "../models/progress.model.js";
import { listEnrolledCoursesForStudent } from "../models/course.model.js";
import {
  findAssignmentInModules,
  getCourseProgress,
} from "../services/progress.service.js";

async function loadEnrolledAssignment(userId, assignmentId) {
  const context = await findAssignmentContext(assignmentId);

  if (!context || !context.isPublished || !context.courseIsPublished) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  const enrolled = await isEnrolledInCourse(userId, context.courseId);

  if (!enrolled) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  const progress = await getCourseProgress(context.courseId, userId);
  const found = findAssignmentInModules(progress.modules, assignmentId);

  if (!found) {
    throw ApiError.notFound("This assignment could not be found.");
  }

  return {
    context,
    progress,
    module: found.module,
    assignment: found.assignment,
  };
}

function isPastDue(dueAt) {
  return Boolean(dueAt) && new Date(dueAt).getTime() < Date.now();
}

/**
 * A submission is late when it reached the server after the due date.
 * Late work is accepted, but staff and students see it flagged.
 */
function submissionIsLate(dueAt, submittedAt) {
  if (!dueAt || !submittedAt) return false;
  return new Date(submittedAt).getTime() > new Date(dueAt).getTime();
}

export const getMyAssignments = asyncHandler(async (req, res) => {
  const courses = await listEnrolledCoursesForStudent(req.user.id);
  const assignments = [];

  for (const course of courses) {
    const progress = await getCourseProgress(course.id, req.user.id);

    for (const module of progress.modules) {
      for (const assignment of module.assignments) {
        assignments.push({
          ...assignment,
          courseId: course.id,
          courseTitle: course.title,
          isPastDue: isPastDue(assignment.dueAt),
          isLate: submissionIsLate(
            assignment.dueAt,
            assignment.submission?.submittedAt
          ),
        });
      }
    }
  }

  const summary = {
    total: assignments.length,
    submitted: assignments.filter((assignment) => assignment.isCompleted).length,
    graded: assignments.filter(
      (assignment) => assignment.submission?.status === "graded"
    ).length,
    locked: assignments.filter((assignment) => !assignment.isUnlocked).length,
  };

  res.status(200).json({
    success: true,
    message: "Assignments",
    data: { assignments, summary },
  });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const { context, module, assignment } = await loadEnrolledAssignment(
    req.user.id,
    assignmentId
  );

  res.status(200).json({
    success: true,
    message: "Assignment details",
    data: {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueAt: assignment.dueAt,
        maxPoints: assignment.maxPoints,
        isUnlocked: assignment.isUnlocked,
        isPastDue: isPastDue(assignment.dueAt),
        isLate: submissionIsLate(
          assignment.dueAt,
          assignment.submission?.submittedAt
        ),
        submission: assignment.submission,
        course: { id: context.courseId, title: context.courseTitle },
        module: {
          id: module.id,
          title: module.title,
          weekNumber: module.weekNumber,
        },
      },
    },
  });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignmentId = parsePositiveId(req.params.assignmentId, "Assignment ID");
  const { assignment } = await loadEnrolledAssignment(
    req.user.id,
    assignmentId
  );

  if (!assignment.isUnlocked) {
    throw ApiError.forbidden(
      "Finish the earlier lessons before submitting this assignment."
    );
  }

  const existing = await findSubmission(assignmentId, req.user.id);

  if (existing?.status === "graded") {
    throw ApiError.conflict(
      "This assignment has already been graded and can no longer be changed."
    );
  }

  const { content, submissionUrl } = validateSubmission({
    content: req.body?.content,
    submissionUrl: req.body?.submissionUrl,
  });

  const submission = await saveSubmission({
    assignmentId,
    userId: req.user.id,
    content,
    submissionUrl,
  });

  const isLate = submissionIsLate(assignment.dueAt, submission.submittedAt);

  res.status(existing ? 200 : 201).json({
    success: true,
    message: existing
      ? "Your submission has been updated."
      : "Assignment submitted.",
    data: { submission: { ...submission, isLate } },
  });
});
