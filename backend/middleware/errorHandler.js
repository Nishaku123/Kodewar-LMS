import { env } from "../config/env.js";

/**
 * Central error handler. Every error in the API ends up here, so responses
 * always have the same JSON shape:
 * { success: false, message: "...", details?: ... }
 *
 * Express recognises this as an error handler because it has 4 parameters.
 */
export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error("[API ERROR]", error);
  }

  // In production we never expose internal error messages or stack traces.
  const message =
    isServerError && env.nodeEnv === "production"
      ? "Something went wrong on the server."
      : error.message || "Something went wrong.";

  const response = {
    success: false,
    message,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (env.nodeEnv === "development" && isServerError && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}
