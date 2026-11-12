import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  findEnrolledCourseForStudent,
  listEnrolledCoursesForStudent,
} from "../models/course.model.js";
import {
  findLessonCourseContext,
  isEnrolledInCourse,
  markLessonComplete,
  unmarkLessonComplete,
} from "../models/progress.model.js";
import { findModuleById } from "../models/module.model.js";
import {
  findLessonInModules,
  getCourseProgress,
} from "../services/progress.service.js";

export const getMyProgress = asyncHandler(async (req, res) => {
  const enrolledCourses = await listEnrolledCoursesForStudent(req.user.id);
  const courses = [];
  let totalCompletedLessons = 0;
  let totalLessons = 0;
  let totalPassedAssessments = 0;
  let totalAssessments = 0;
  let coursesCompleted = 0;

  for (const course of enrolledCourses) {
    const { summary } = await getCourseProgress(course.id, req.user.id);
    totalCompletedLessons += summary.completedLessons;
    totalLessons += summary.lessonCount;
    totalPassedAssessments += summary.passedAssessments;
    totalAssessments += summary.assessmentCount;
    if (summary.isComplete) coursesCompleted += 1;

    courses.push({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      progress: summary,
    });
  }

  res.status(200).json({
    success: true,
    message: "Your learning progress",
    data: {
      courses,
      overview: {
        coursesEnrolled: courses.length,
        coursesCompleted,
        lessonsCompleted: totalCompletedLessons,
        lessonCount: totalLessons,
        assessmentsPassed: totalPassedAssessments,
        assessmentCount: totalAssessments,
      },
    },
  });
});

export const getCourseProgressDetails = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findEnrolledCourseForStudent(courseId, req.user.id);

  if (!course) {
    throw ApiError.notFound(
      "The course was not found or you are not enrolled."
    );
  }

  const { modules, summary } = await getCourseProgress(courseId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Course progress",
    data: {
      course: {
        id: course.id,
        title: course.title,
        category: course.category,
        level: course.level,
      },
      modules,
      progress: summary,
    },
  });
});

async function loadLessonForStudent(userId, lessonId) {
  const context = await findLessonCourseContext(lessonId);

  if (!context) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  const enrolled = await isEnrolledInCourse(userId, context.courseId);

  if (!enrolled) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  const progress = await getCourseProgress(context.courseId, userId);
  const found = findLessonInModules(progress.modules, lessonId);

  if (!found) {
    throw ApiError.notFound("This lesson could not be found.");
  }

  return { context, progress, module: found.module, lesson: found.lesson };
}

export const getCourseModules = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findEnrolledCourseForStudent(courseId, req.user.id);

  if (!course) {
    throw ApiError.notFound(
      "The course was not found or you are not enrolled."
    );
  }

  const { modules, summary } = await getCourseProgress(courseId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Course modules",
    data: {
      course: {
        id: course.id,
        title: course.title,
        category: course.category,
        level: course.level,
      },
      modules,
      progress: summary,
    },
  });
});

export const getModuleDetails = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveId(req.params.moduleId, "Module ID");
  const moduleContext = await findModuleById(moduleId);

  if (!moduleContext) {
    throw ApiError.notFound("This module could not be found.");
  }

  if (!moduleContext.courseIsPublished) {
    throw ApiError.notFound("This module could not be found.");
  }

  const enrolled = await isEnrolledInCourse(
    req.user.id,
    moduleContext.courseId
  );

  if (!enrolled) {
    throw ApiError.notFound("This module could not be found.");
  }

  const { modules } = await getCourseProgress(moduleContext.courseId, req.user.id);
  const module = modules.find((item) => item.id === moduleId);

  if (!module) {
    throw ApiError.notFound("This module could not be found.");
  }

  res.status(200).json({
    success: true,
    message: "Module details",
    data: { module },
  });
});

export const getLessonDetails = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const { module, lesson } = await loadLessonForStudent(
    req.user.id,
    lessonId
  );

  res.status(200).json({
    success: true,
    message: "Lesson details",
    data: {
      lesson,
      module: {
        id: module.id,
        title: module.title,
        weekNumber: module.weekNumber,
        isUnlocked: module.isUnlocked,
        isCompleted: module.isCompleted,
      },
    },
  });
});

export const completeLesson = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const { context, lesson } = await loadLessonForStudent(
    req.user.id,
    lessonId
  );

  if (!lesson.isUnlocked) {
    throw ApiError.forbidden(
      "Finish the previous week before completing this lesson."
    );
  }

  await markLessonComplete(req.user.id, lessonId);
  const { summary } = await getCourseProgress(
    context.courseId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Lesson marked complete.",
    data: { lessonId, isCompleted: true, progress: summary },
  });
});

export const uncompleteLesson = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveId(req.params.lessonId, "Lesson ID");
  const { context } = await loadLessonForStudent(req.user.id, lessonId);

  await unmarkLessonComplete(req.user.id, lessonId);
  const { summary } = await getCourseProgress(
    context.courseId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Lesson marked as not complete.",
    data: { lessonId, isCompleted: false, progress: summary },
  });
});
