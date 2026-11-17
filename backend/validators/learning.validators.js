import { ApiError } from "../utils/ApiError.js";

/**
 * Validation for assessment and assignment requests.
 * These helpers return clean values or throw an ApiError with a field-level
 * detail so the frontend can point at the right input.
 */

function fail(field, message) {
  throw ApiError.badRequest(message, [{ field, message }]);
}

function toPositiveInt(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function validateAttemptAnswers(value) {
  if (!Array.isArray(value)) {
    fail("answers", "Answers must be sent as an array.");
  }

  if (value.length > 200) {
    fail("answers", "This attempt has too many answers.");
  }

  const answers = new Map();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      fail("answers", "Each answer must include a question and an option.");
    }

    const questionId = toPositiveInt(entry.questionId);
    const optionId =
      entry.optionId === null || entry.optionId === undefined
        ? null
        : toPositiveInt(entry.optionId);

    if (!questionId) {
      fail("answers", "Each answer needs a valid question ID.");
    }

    if (entry.optionId !== null && entry.optionId !== undefined && !optionId) {
      fail("answers", "Each selected option needs a valid option ID.");
    }

    // A later answer for the same question replaces an earlier one.
    answers.set(questionId, { questionId, optionId });
  }

  return [...answers.values()];
}

export function validateSubmissionContent(value) {
  const content = typeof value === "string" ? value.trim() : "";

  if (content.length > 10_000) {
    fail("content", "Your submission must be 10,000 characters or fewer.");
  }

  return content;
}

export function validateSubmissionUrl(value) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") {
    fail("submissionUrl", "Enter a valid link, for example https://example.com.");
  }

  const raw = value.trim();

  if (!raw) return null;

  if (raw.length > 2048) {
    fail("submissionUrl", "The link must be 2,048 characters or fewer.");
  }

  let url;

  try {
    url = new URL(raw);
  } catch {
    fail("submissionUrl", "Enter a valid link, for example https://example.com.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    fail("submissionUrl", "The link must start with http:// or https://.");
  }

  return url.href;
}

export function validateSubmission({ content, submissionUrl }) {
  const cleanContent = validateSubmissionContent(content);
  const cleanUrl = validateSubmissionUrl(submissionUrl);

  if (!cleanContent && !cleanUrl) {
    fail(
      "content",
      "Write your submission or add a link before submitting the assignment."
    );
  }

  return { content: cleanContent, submissionUrl: cleanUrl };
}
