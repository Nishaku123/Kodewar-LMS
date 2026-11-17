import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  findCourseForManagement,
  listEnrolledCoursesForStudent,
} from "../models/course.model.js";
import { findEnrollment } from "../models/enrollment.model.js";
import { findUserById } from "../models/user.model.js";
import {
  getCourseProgress,
  getCourseRosterProgress,
} from "../services/progress.service.js";

export const getCourseProgressRoster = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const { students, summary } = await getCourseRosterProgress(courseId);

  res.status(200).json({
    success: true,
    message: "Course progress roster",
    data: { courseId, students, summary },
  });
});

export const getStudentCourseProgress = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const userId = parsePositiveId(req.params.userId, "User ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const enrollment = await findEnrollment(courseId, userId);

  if (!enrollment) {
    throw ApiError.notFound(
      "This student is not enrolled in the course."
    );
  }

  const student = await findUserById(userId);
  const { modules, summary } = await getCourseProgress(courseId, userId);

  res.status(200).json({
    success: true,
    message: "Student course progress",
    data: {
      courseId,
      student: {
        userId,
        fullName: student?.fullName ?? null,
        email: student?.email ?? null,
        enrolledAt: enrollment.enrolledAt,
      },
      modules,
      progress: summary,
    },
  });
});

export const getStudentProgress = asyncHandler(async (req, res) => {
  const userId = parsePositiveId(req.params.userId, "User ID");
  const student = await findUserById(userId);

  if (!student || student.role !== "student") {
    throw ApiError.notFound("This student account could not be found.");
  }

  const enrolledCourses = await listEnrolledCoursesForStudent(userId);
  const courses = [];

  for (const course of enrolledCourses) {
    const { summary } = await getCourseProgress(course.id, userId);

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
    message: "Student progress across courses",
    data: {
      student: {
        userId: student.id,
        fullName: student.fullName,
        email: student.email,
        status: student.status,
      },
      courses,
      overview: {
        coursesEnrolled: courses.length,
        coursesCompleted: courses.filter((course) => course.progress.isComplete)
          .length,
      },
    },
  });
});
