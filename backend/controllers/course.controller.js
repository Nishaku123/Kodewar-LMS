import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  createCourseEnrollment,
  findEnrolledCourseForStudent,
  findPublishedCourse,
  listEnrolledCoursesForStudent,
  listPublishedCoursesForStudent,
} from "../models/course.model.js";
import { getCourseProgress } from "../services/progress.service.js";

export const getCourseCatalogue = asyncHandler(async (req, res) => {
  const courses = await listPublishedCoursesForStudent(req.user.id);

  res.status(200).json({
    success: true,
    message: "Course catalogue",
    data: { courses },
  });
});

export const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await listEnrolledCoursesForStudent(req.user.id);

  res.status(200).json({
    success: true,
    message: "Enrolled courses",
    data: { courses },
  });
});

export const getCourseDetails = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findEnrolledCourseForStudent(courseId, req.user.id);

  if (!course) {
    throw ApiError.notFound("The course was not found or you are not enrolled.");
  }

  const progress = await getCourseProgress(courseId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Course details",
    data: {
      course: {
        ...course,
        modules: progress.modules,
        progress: progress.summary,
      },
    },
  });
});

export const enrollInCourse = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findPublishedCourse(courseId);

  if (!course) {
    throw ApiError.notFound("This published course could not be found.");
  }

  try {
    await createCourseEnrollment(courseId, req.user.id);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("You are already enrolled in this course.");
    }

    throw error;
  }

  res.status(201).json({
    success: true,
    message: `You are now enrolled in ${course.title}.`,
    data: { courseId },
  });
});
