/**
 * ApiError is an Error we create on purpose (for example a 404 or 403).
 * Centralised error handling can then return the right HTTP status code.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "You are not signed in.") {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to do that.") {
    return new ApiError(403, message);
  }

  static notFound(message = "The requested resource was not found.") {
    return new ApiError(404, message);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }

  static tooManyRequests(message = "Too many attempts. Please try again later.") {
    return new ApiError(429, message);
  }
}
