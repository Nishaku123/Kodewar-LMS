import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  slugifyTitle,
  validateCourseInput,
} from "../validators/manage.validators.js";
import {
  createCourse,
  deleteCourse,
  findCourseBySlug,
  findCourseForManagement,
  listCoursesForManagement,
  setCoursePublished,
  updateCourse,
} from "../models/course.model.js";
import { listModulesByCourse } from "../models/module.model.js";
import { listLessonsForModule } from "../models/lesson.model.js";
import { listAssessmentsByModule } from "../models/assessment.model.js";
import { listAssignmentsByModule } from "../models/assignment.model.js";

function parseBooleanQuery(value) {
  if (value === undefined || value === "") return null;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw ApiError.badRequest("isPublished must be true or false.");
}

async function uniqueSlug(base) {
  const root = (slugifyTitle(base) || "course").slice(0, 110);
  let candidate = root;
  let suffix = 2;

  while (await findCourseBySlug(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

/**
 * A published course must be usable by students. Publishing an empty shell
 * would put a course in the catalogue that cannot be started.
 */
async function assertCourseReadyToPublish(courseId) {
  const modules = await listModulesByCourse(courseId);

  if (!modules.length) {
    throw ApiError.badRequest(
      "Add at least one module before publishing this course.",
      [
        {
          field: "isPublished",
          message: "A course needs at least one module.",
        },
      ]
    );
  }

  const lessonLists = await Promise.all(
    modules.map((module) => listLessonsForModule(module.id))
  );

  if (!lessonLists.some((lessons) => lessons.length)) {
    throw ApiError.badRequest(
      "Add at least one lesson before publishing this course.",
      [
        {
          field: "isPublished",
          message: "A course needs at least one lesson.",
        },
      ]
    );
  }
}

export async function loadCourseContent(courseId) {
  const modules = await listModulesByCourse(courseId);

  return Promise.all(
    modules.map(async (module) => ({
      ...module,
      lessons: await listLessonsForModule(module.id),
      assessments: await listAssessmentsByModule(module.id),
      assignments: await listAssignmentsByModule(module.id),
    }))
  );
}

export const listCourses = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const courses = await listCoursesForManagement({
    search,
    isPublished: parseBooleanQuery(req.query.isPublished),
  });

  res.status(200).json({
    success: true,
    message: "All courses",
    data: { courses },
  });
});

export const getCourse = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const course = await findCourseForManagement(courseId);

  if (!course) {
    throw ApiError.notFound("This course could not be found.");
  }

  const modules = await loadCourseContent(courseId);

  res.status(200).json({
    success: true,
    message: "Course content",
    data: { course: { ...course, modules } },
  });
});

export const createCourseHandler = asyncHandler(async (req, res) => {
  const data = validateCourseInput(req.body);
  const explicitSlug = data.slug;
  data.slug = explicitSlug || (await uniqueSlug(data.title));

  if (explicitSlug) {
    const existing = await findCourseBySlug(explicitSlug);
    if (existing) {
      throw ApiError.conflict("A course with this slug already exists.", [
        { field: "slug", message: "Slug is already in use." },
      ]);
    }
  }

  const course = await createCourse(data);

  res.status(201).json({
    success: true,
    message: "Course created.",
    data: { course },
  });
});

export const updateCourseHandler = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const existing = await findCourseForManagement(courseId);

  if (!existing) {
    throw ApiError.notFound("This course could not be found.");
  }

  const data = validateCourseInput(req.body, { partial: true });

  if (data.slug === null) {
    delete data.slug;
  }

  if (data.slug) {
    const duplicate = await findCourseBySlug(data.slug, courseId);
    if (duplicate) {
      throw ApiError.conflict("A course with this slug already exists.", [
        { field: "slug", message: "Slug is already in use." },
      ]);
    }
  }

  if (data.isPublished === true) {
    await assertCourseReadyToPublish(courseId);
  }

  const course = await updateCourse(courseId, data);

  res.status(200).json({
    success: true,
    message: "Course updated.",
    data: { course },
  });
});

export const deleteCourseHandler = asyncHandler(async (req, res) => {
  const courseId = parsePositiveId(req.params.courseId, "Course ID");
  const existing = await findCourseForManagement(courseId);

  if (!existing) {
    throw ApiError.notFound("This course could not be found.");
  }

  await deleteCourse(courseId);

  res.status(200).json({
    success: true,
    message: "Course deleted.",
    data: { courseId },
  });
});

function publicationHandler(isPublished) {
  return asyncHandler(async (req, res) => {
    const courseId = parsePositiveId(req.params.courseId, "Course ID");
    const existing = await findCourseForManagement(courseId);

    if (!existing) {
      throw ApiError.notFound("This course could not be found.");
    }

    if (isPublished) {
      await assertCourseReadyToPublish(courseId);
    }

    const course = await setCoursePublished(courseId, isPublished);

    res.status(200).json({
      success: true,
      message: isPublished ? "Course published." : "Course unpublished.",
      data: { course },
    });
  });
}

export const publishCourse = publicationHandler(true);
export const unpublishCourse = publicationHandler(false);
