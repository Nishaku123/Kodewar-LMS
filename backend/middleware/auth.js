import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/token.js";
import { findUserById } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Reads the httpOnly auth cookie, verifies the JWT and loads the current
 * user from the database. Loading the user on every request means a
 * suspended or deleted account loses access immediately.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    throw ApiError.unauthorized("Please sign in to continue.");
  }

  let payload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw ApiError.unauthorized("This account no longer exists.");
  }

  if (user.status !== "active") {
    throw ApiError.forbidden("This account is suspended. Contact an administrator.");
  }

  req.user = user;
  next();
});

/**
 * Allows only the listed role names. Use it after requireAuth:
 *
 *   router.get("/", requireAuth, requireRole("student"), handler)
 */
export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized("Please sign in to continue."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("Your account does not have access to this resource.")
      );
    }

    next();
  };
}

/**
 * Staff roles can author and manage learning content.
 */
export function requireStaff(req, res, next) {
  return requireRole("trainer", "admin")(req, res, next);
}

/**
 * Administrators can perform destructive, account-changing and
 * user-access actions.
 */
export function requireAdmin(req, res, next) {
  return requireRole("admin")(req, res, next);
}
