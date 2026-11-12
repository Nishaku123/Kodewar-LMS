import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import { validateModuleInput } from "../validators/manage.validators.js";
import { findCourseForManagement } from "../models/course.model.js";
import {
  createModule,
  deleteModule,
  findModuleById,
  findModuleByWeek,
  listModulesByCourse,
  updateModule,
} from "../models/module.model.js";
import { listLessonsForModule } from "../models/lesson.model.js";
import { listAssessmentsByModule } from "../models/assessment.model.js";
import { listAssignmentsByModule } from "../models/assignment.model.js";

function handleDuplicateWeek(error) {
  if (error.code === "ER_DUP_ENTRY") {
    throw ApiError.conflict("That week number is already used in this course.", [
      { field: "weekNumber", message: "Week number must be unique in a course." },
    ]);
  }

  throw error;
}

export const listModules = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const modules = await listModulesByCourse(courseId);

  res.status(200).json({
    success: true,
    message: "Course modules",
    data: { courseId, modules },
  });
});

export const getModule = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const [lessons, assessments, assignments] = await Promise.all([
    listLessonsForModule(moduleId),
    listAssessmentsByModule(moduleId),
    listAssignmentsByModule(moduleId),
  ]);

  res.status(200).json({
    success: true,
    message: "Module content",
    data: { module: { ...module, lessons, assessments, assignments } },
  });
});

export const createModuleHandler = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const data = validateModuleInput(req.body);
  const duplicate = await findModuleByWeek(courseId, data.weekNumber);

  if (duplicate) {
    throw ApiError.conflict("That week number is already used in this course.", [
      { field: "weekNumber", message: "Week number must be unique in a course." },
    ]);
  }

  let module;

  try {
    module = await createModule({ courseId, ...data });
  } catch (error) {
    handleDuplicateWeek(error);
  }

  res.status(201).json({
    success: true,
    message: "Module created.",
    data: { module },
  });
});

export const updateModuleHandler = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const existing = await findModuleById(moduleId);

  if (!existing) {
    throw ApiError.notFound("This module could not be found.");
  }

  const data = validateModuleInput(req.body, { partial: true });

  if (data.weekNumber !== undefined) {
    const duplicate = await findModuleByWeek(
      existing.courseId,
      data.weekNumber,
      moduleId
    );

    if (duplicate) {
      throw ApiError.conflict(
        "That week number is already used in this course.",
        [{ field: "weekNumber", message: "Week number must be unique in a course." }]
      );
    }
  }

  let module;

  try {
    module = await updateModule(moduleId, data);
  } catch (error) {
    handleDuplicateWeek(error);
  }

  res.status(200).json({
    success: true,
    message: "Module updated.",
    data: { module },
  });
});

export const deleteModuleHandler = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const existing = await findModuleById(moduleId);

  if (!existing) {
    throw ApiError.notFound("This module could not be found.");
  }

  await deleteModule(moduleId);

  res.status(200).json({
    success: true,
    message: "Module deleted.",
    data: { moduleId },
  });
});
