import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import { validateEnrollmentInput } from "../validators/manage.validators.js";
import { findCourseForManagement } from "../models/course.model.js";
import {
  createEnrollment,
  deleteEnrollment,
  findEnrollment,
  listEnrollmentsForCourse,
} from "../models/enrollment.model.js";
import {
  findUserByEmail,
  findUserById,
  listStudents,
} from "../models/user.model.js";

export const listCourseEnrollments = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const enrollments = await listEnrollmentsForCourse(courseId);

  res.status(200).json({
    success: true,
    message: "Course enrolments",
    data: { courseId, enrollments },
  });
});

export const listStudentDirectory = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";

  const students = await listStudents(search);

  res.status(200).json({
    success: true,
    message: "Student directory",
    data: { students },
  });
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const { userId, email } = validateEnrollmentInput(req.body);
  const user = userId
    ? await findUserById(userId)
    : await findUserByEmail(email);

  if (!user) {
    throw ApiError.notFound("This student account could not be found.");
  }

  if (user.role !== "student") {
    throw ApiError.badRequest("Only student accounts can be enrolled in a course.", [
      { field: "userId", message: "The selected account is not a student." },
    ]);
  }

  if (user.status !== "active") {
    throw ApiError.badRequest("This student account is suspended.", [
      { field: "userId", message: "Suspended accounts cannot be enrolled." },
    ]);
  }

  const existing = await findEnrollment(courseId, user.id);

  if (existing) {
    throw ApiError.conflict("This student is already enrolled in the course.");
  }

  try {
    await createEnrollment(courseId, user.id);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("This student is already enrolled in the course.");
    }

    throw error;
  }

  res.status(201).json({
    success: true,
    message: `${user.fullName} is now enrolled.`,
    data: {
      enrollment: {
        courseId,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    },
  });
});

export const removeEnrollment = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const userId = parsePositiveId(req.params.userId, "User ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const existing = await findEnrollment(courseId, userId);

  if (!existing) {
    throw ApiError.notFound("This student is not enrolled in the course.");
  }

  await deleteEnrollment(courseId, userId);

  res.status(200).json({
    success: true,
    message: "Student removed from the course.",
    data: { courseId, userId },
  });
});
