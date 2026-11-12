import { ApiError } from "../utils/ApiError.js";

/**
 * Validation for the staff/authoring REST API.
 *
 * Every validator accepts `{ partial: true }` for PATCH requests. In partial
 * mode only the fields present in the body are validated and returned, so a
 * client never has to send the whole resource to change one value.
 */

function fail(field, message) {
  throw ApiError.badRequest(message, [{ field, message }]);
}

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body || {}, key);
}

function text(value, field, { min = 0, max = 5000, multiline = false } = {}) {
  if (typeof value !== "string") {
    fail(field, `${field} must be text.`);
  }

  const clean = multiline ? value.trim() : value.trim().replace(/\s+/g, " ");

  if (clean.length < min) {
    fail(field, `${field} must be at least ${min} characters.`);
  }

  if (clean.length > max) {
    fail(field, `${field} must be ${max} characters or fewer.`);
  }

  return clean;
}

function integer(value, field, { min = 0, max = 1_000_000 } = {}) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max) {
    fail(field, `${field} must be a whole number between ${min} and ${max}.`);
  }

  return number;
}

function boolean(value, field) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === 0) return Boolean(value);
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;

  fail(field, `${field} must be true or false.`);
}

function url(value, field, { allowLocalhost = false } = {}) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value !== "string") {
    fail(field, `${field} must be a valid link.`);
  }

  const raw = value.trim();

  if (!raw) return null;

  if (raw.length > 2048) {
    fail(field, `${field} must be 2,048 characters or fewer.`);
  }

  let parsed;

  try {
    parsed = new URL(raw);
  } catch {
    fail(field, `${field} must be a valid link.`);
  }

  const localhost =
    allowLocalhost &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

  if (parsed.protocol !== "https:" && !(localhost && parsed.protocol === "http:")) {
    fail(field, `${field} must start with https://.`);
  }

  return parsed.href;
}

export function slugifyTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function validateSlug(value, field = "slug") {
  const slug = String(value || "").trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(
      field,
      "Slug must use lowercase letters, numbers and single hyphens."
    );
  }

  if (slug.length > 120) {
    fail(field, "Slug must be 120 characters or fewer.");
  }

  return slug;
}

export function validateCourseInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "title")) {
    data.title = text(body.title, "title", { min: 2, max: 180 });
  }

  if (!partial || has(body, "description")) {
    data.description = text(body.description, "description", {
      max: 5000,
      multiline: true,
    });
  }

  if (!partial || has(body, "category")) {
    data.category =
      body.category === undefined || body.category === null
        ? "General"
        : text(body.category, "category", { max: 80 });
  }

  if (!partial || has(body, "level")) {
    data.level =
      body.level === undefined || body.level === null
        ? "Beginner"
        : text(body.level, "level", { max: 40 });
  }

  if (!partial || has(body, "durationMinutes")) {
    data.durationMinutes =
      body.durationMinutes === undefined
        ? 0
        : integer(body.durationMinutes, "durationMinutes", {
            min: 0,
            max: 100_000,
          });
  }

  if (has(body, "thumbnailUrl")) {
    data.thumbnailUrl = url(body.thumbnailUrl, "thumbnailUrl", {
      allowLocalhost: true,
    });
  } else if (!partial) {
    data.thumbnailUrl = null;
  }

  if (has(body, "slug")) {
    data.slug = body.slug ? validateSlug(body.slug) : null;
  } else if (!partial) {
    data.slug = null;
  }

  if (has(body, "isPublished")) {
    data.isPublished = boolean(body.isPublished, "isPublished");
  } else if (!partial) {
    data.isPublished = false;
  }

  return data;
}

export function validateModuleInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "title")) {
    data.title = text(body.title, "title", { min: 2, max: 180 });
  }

  if (!partial || has(body, "description")) {
    data.description = text(body.description, "description", {
      max: 5000,
      multiline: true,
    });
  }

  if (!partial || has(body, "weekNumber")) {
    data.weekNumber = integer(body.weekNumber, "weekNumber", {
      min: 1,
      max: 520,
    });
  }

  if (has(body, "position")) {
    data.position = integer(body.position, "position", { min: 1, max: 1000 });
  }

  return data;
}

export function validateLessonVideo(provider, videoUrl) {
  if (!provider) {
    if (videoUrl) {
      fail("videoProvider", "Choose a video provider for this video URL.");
    }
    return { videoProvider: null, videoUrl: null };
  }

  if (!["youtube", "vimeo", "direct"].includes(provider)) {
    fail("videoProvider", "videoProvider must be youtube, vimeo or direct.");
  }

  if (!videoUrl) {
    fail("videoUrl", "Add a video URL or clear the provider.");
  }

  return {
    videoProvider: provider,
    videoUrl: url(videoUrl, "videoUrl", { allowLocalhost: true }),
  };
}

export function validateLessonInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "title")) {
    data.title = text(body.title, "title", { min: 2, max: 180 });
  }

  if (!partial || has(body, "description")) {
    data.description = text(body.description, "description", {
      max: 5000,
      multiline: true,
    });
  }

  if (!partial || has(body, "durationMinutes")) {
    data.durationMinutes =
      body.durationMinutes === undefined
        ? 0
        : integer(body.durationMinutes, "durationMinutes", {
            min: 0,
            max: 10_000,
          });
  }

  if (has(body, "position")) {
    data.position = integer(body.position, "position", { min: 1, max: 1000 });
  }

  if (has(body, "videoProvider")) {
    data.videoProvider = body.videoProvider || null;
  }

  if (has(body, "videoUrl")) {
    data.videoUrl = body.videoUrl || null;
  }

  if (!partial && (has(body, "videoProvider") || has(body, "videoUrl"))) {
    const video = validateLessonVideo(
      data.videoProvider ?? null,
      data.videoUrl ?? null
    );
    data.videoProvider = video.videoProvider;
    data.videoUrl = video.videoUrl;
  } else if (!partial) {
    data.videoProvider = null;
    data.videoUrl = null;
  }

  return data;
}

export function validateAssessmentInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "title")) {
    data.title = text(body.title, "title", { min: 2, max: 180 });
  }

  if (!partial || has(body, "description")) {
    data.description = text(body.description, "description", {
      max: 5000,
      multiline: true,
    });
  }

  if (!partial || has(body, "passingScore")) {
    data.passingScore =
      body.passingScore === undefined
        ? 60
        : integer(body.passingScore, "passingScore", { min: 0, max: 100 });
  }

  if (!partial || has(body, "maxAttempts")) {
    data.maxAttempts =
      body.maxAttempts === undefined
        ? 3
        : integer(body.maxAttempts, "maxAttempts", { min: 0, max: 100 });
  }

  if (has(body, "isPublished")) {
    data.isPublished = boolean(body.isPublished, "isPublished");
  } else if (!partial) {
    data.isPublished = false;
  }

  return data;
}

export function validateQuestionInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "prompt")) {
    data.prompt = text(body.prompt, "prompt", { min: 2, max: 2000 });
  }

  if (!partial || has(body, "explanation")) {
    data.explanation =
      body.explanation === undefined || body.explanation === null
        ? ""
        : text(body.explanation, "explanation", { max: 2000, multiline: true });
  }

  if (!partial || has(body, "points")) {
    data.points =
      body.points === undefined
        ? 1
        : integer(body.points, "points", { min: 1, max: 100 });
  }

  if (has(body, "position")) {
    data.position = integer(body.position, "position", { min: 1, max: 1000 });
  }

  return data;
}

export function validateOptionInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "text")) {
    data.text = text(body.text, "text", { min: 1, max: 500 });
  }

  if (!partial || has(body, "isCorrect")) {
    data.isCorrect =
      body.isCorrect === undefined
        ? false
        : boolean(body.isCorrect, "isCorrect");
  }

  if (has(body, "position")) {
    data.position = integer(body.position, "position", { min: 1, max: 1000 });
  }

  return data;
}

function dateOrNull(value, field) {
  if (value === null || value === undefined || value === "") return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    fail(field, `${field} must be a valid date.`);
  }

  return date;
}

export function validateAssignmentInput(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || has(body, "title")) {
    data.title = text(body.title, "title", { min: 2, max: 180 });
  }

  if (!partial || has(body, "description")) {
    data.description = text(body.description, "description", {
      max: 5000,
      multiline: true,
    });
  }

  if (!partial || has(body, "instructions")) {
    data.instructions = text(body.instructions, "instructions", {
      max: 5000,
      multiline: true,
    });
  }

  if (has(body, "dueAt")) {
    data.dueAt = dateOrNull(body.dueAt, "dueAt");
  } else if (!partial) {
    data.dueAt = null;
  }

  if (!partial || has(body, "maxPoints")) {
    data.maxPoints =
      body.maxPoints === undefined
        ? 100
        : integer(body.maxPoints, "maxPoints", { min: 1, max: 10_000 });
  }

  if (has(body, "isPublished")) {
    data.isPublished = boolean(body.isPublished, "isPublished");
  } else if (!partial) {
    data.isPublished = false;
  }

  return data;
}

export function validateGradeInput(body = {}) {
  const score = Number(body.score);

  if (!Number.isFinite(score) || score < 0) {
    fail("score", "Score must be a number of zero or more.");
  }

  const feedback =
    body.feedback === undefined || body.feedback === null
      ? null
      : text(body.feedback, "feedback", { max: 5000, multiline: true });

  return { score, feedback };
}

/* User access management --------------------------------------------- */

export const ASSIGNABLE_ROLES = ["student", "trainer", "admin"];
export const USER_STATUSES = ["active", "suspended"];

export function validateUserRoleInput(body = {}) {
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!ASSIGNABLE_ROLES.includes(role)) {
    fail(
      "role",
      `role must be one of: ${ASSIGNABLE_ROLES.join(", ")}.`
    );
  }

  return { role };
}

export function validateUserStatusInput(body = {}) {
  const status = typeof body.status === "string" ? body.status.trim() : "";

  if (!USER_STATUSES.includes(status)) {
    fail("status", "status must be active or suspended.");
  }

  return { status };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateManagedUserInput(body = {}) {
  const fullName = text(body.fullName, "fullName", { min: 2, max: 120 });

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    fail("email", "Enter an email address.");
  }

  if (email.length > 190 || !EMAIL_PATTERN.test(email)) {
    fail("email", "Enter a valid email address, for example name@example.com.");
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (password.length < 8) {
    fail("password", "Use at least 8 characters for the password.");
  }

  if (password.length > 72) {
    fail("password", "The password must be 72 characters or fewer.");
  }

  if (!/[A-Za-z]/.test(password)) {
    fail("password", "The password must include at least one letter.");
  }

  if (!/[0-9]/.test(password)) {
    fail("password", "The password must include at least one number.");
  }

  const { role } = validateUserRoleInput(body);

  return { fullName, email, password, role };
}

export function validateEnrollmentInput(body = {}) {
  if (has(body, "userId")) {
    return {
      userId: integer(body.userId, "userId", { min: 1, max: Number.MAX_SAFE_INTEGER }),
      email: null,
    };
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    fail("userId", "Provide a student userId or email address.");
  }

  return { userId: null, email: body.email.trim().toLowerCase() };
}
