import { ApiError } from "../utils/ApiError.js";

/**
 * Runs when no route matched the request.
 * It forwards a clean 404 error to the central error handler.
 */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
