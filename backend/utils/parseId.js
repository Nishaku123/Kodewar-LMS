import { ApiError } from "./ApiError.js";

/**
 * Parses a positive integer route parameter such as :courseId or :lessonId.
 * Rejects decimals, negative numbers and non-numeric values with a 400.
 */
export function parsePositiveId(value, label = "ID") {
  if (!/^[1-9]\d*$/.test(value || "")) {
    throw ApiError.badRequest(`${label} must be a positive integer.`);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    throw ApiError.badRequest(`${label} must be a positive integer.`);
  }

  return id;
}
