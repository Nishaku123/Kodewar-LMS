import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  validateLessonInput,
  validateLessonVideo,
} from "../validators/manage.validators.js";
import { findModuleById } from "../models/module.model.js";
import {
  createLesson,
  deleteLesson,
  findLessonById,
  listLessonsForModule,
  updateLesson,
} from "../models/lesson.model.js";

function hasField(body, key) {
  return Object.prototype.hasOwnProperty.call(body || {}, key);
}

function handleDuplicatePosition(error) {
  if (error.code === "ER_DUP_ENTRY") {
    throw ApiError.conflict("Another lesson already uses that position.", [
      { field: "position", message: "Position must be unique in a module." },
    ]);
  }

  throw error;
}

export const listLessons = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const lessons = await listLessonsForModule(moduleId);

  res.status(200).json({
    success: true,
    message: "Module lessons",
    data: { moduleId, lessons },
  });
});

export const getLesson = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const lesson = await findLessonById(lessonId);

  if (!lesson) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  res.status(200).json({
    success: true,
    message: "Lesson details",
    data: { lesson },
  });
});

export const createLessonHandler = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const module = await findModuleById(moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  const data = validateLessonInput(req.body);
  let lesson;

  try {
    lesson = await createLesson({ moduleId, ...data });
  } catch (error) {
    handleDuplicatePosition(error);
  }

  res.status(201).json({
    success: true,
    message: "Lesson created.",
    data: { lesson },
  });
});

export const updateLessonHandler = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const existing = await findLessonById(lessonId);

  if (!existing) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  const data = validateLessonInput(req.body, { partial: true });

  if (hasField(req.body, "videoProvider") || hasField(req.body, "videoUrl")) {
    const provider = hasField(req.body, "videoProvider")
      ? data.videoProvider
      : existing.videoProvider;
    const videoUrl = hasField(req.body, "videoUrl")
      ? data.videoUrl
      : existing.videoUrl;

    if (!provider) {
      data.videoProvider = null;
      data.videoUrl = null;
    } else {
      const video = validateLessonVideo(provider, videoUrl);
      data.videoProvider = video.videoProvider;
      data.videoUrl = video.videoUrl;
    }
  }

  let lesson;

  try {
    lesson = await updateLesson(lessonId, data);
  } catch (error) {
    handleDuplicatePosition(error);
  }

  res.status(200).json({
    success: true,
    message: "Lesson updated.",
    data: { lesson },
  });
});

export const deleteLessonHandler = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const existing = await findLessonById(lessonId);

  if (!existing) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  await deleteLesson(lessonId);

  res.status(200).json({
    success: true,
    message: "Lesson deleted.",
    data: { lessonId },
  });
});
