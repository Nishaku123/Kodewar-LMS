import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPasswordResetToken,
  clearAuthCookie,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MINUTES,
  setAuthCookie,
  signAuthToken,
} from "../utils/token.js";
import {
  cleanText,
  validateEmail,
  validateFullName,
  validateLoginPassword,
  validatePassword,
} from "../utils/validation.js";
import {
  createUser,
  findRoleByName,
  findUserByEmail,
  findUserById,
  getPasswordHash,
  updateLastLogin,
  updateUserName,
  updateUserPassword,
} from "../models/user.model.js";
import {
  createResetToken,
  deleteResetTokensForUser,
  findValidResetToken,
  markResetTokenUsed,
} from "../models/passwordReset.model.js";

const BCRYPT_ROUNDS = 12;
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, a password reset link has been created.";

/**
 * Sends the signed-in user with a fresh auth cookie.
 * The cookie is httpOnly, so the browser cannot read or modify the token.
 */
function sendSignedInUser(res, user, statusCode, message) {
  setAuthCookie(res, signAuthToken(user));

  res.status(statusCode).json({
    success: true,
    message,
    data: { user },
  });
}

/**
 * POST /api/auth/register
 * Public registration always creates a student account. Staff accounts are
 * created by an administrator from the Users & roles screen, never through
 * this form.
 */
export const register = asyncHandler(async (req, res) => {
  const fullName = validateFullName(req.body.fullName);
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);

  const existing = await findUserByEmail(email);

  if (existing) {
    throw ApiError.conflict("An account with this email already exists.", [
      { field: "email", message: "This email is already registered." },
    ]);
  }

  const studentRole = await findRoleByName("student");

  if (!studentRole) {
    throw new ApiError(
      500,
      "The student role is missing. Run npm run db:migrate and npm run db:seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await createUser({
      roleId: studentRole.id,
      fullName,
      email,
      passwordHash,
    });
  } catch (error) {
    // The unique index is the final guard against two simultaneous sign-ups.
    if (error.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("An account with this email already exists.", [
        { field: "email", message: "This email is already registered." },
      ]);
    }

    throw error;
  }

  // A brand-new account is immediately signed in, so record this as its
  // first sign-in instead of showing "Not yet" on the dashboard.
  await updateLastLogin(user.id);
  user = await findUserById(user.id);

  sendSignedInUser(res, user, 201, "Your account was created.");
});

/**
 * POST /api/auth/login
 * The same generic message is returned for an unknown email and a wrong
 * password so the endpoint cannot be used to discover accounts.
 */
export const login = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = validateLoginPassword(req.body.password);

  const account = await findUserByEmail(email);
  const passwordMatches = account
    ? await bcrypt.compare(password, account.passwordHash)
    : false;

  if (!account || !passwordMatches) {
    throw ApiError.unauthorized("Email or password is incorrect.");
  }

  if (account.status !== "active") {
    throw ApiError.forbidden(
      "This account is suspended. Contact an administrator."
    );
  }

  await updateLastLogin(account.id);
  const user = await findUserById(account.id);

  sendSignedInUser(res, user, 200, "Signed in successfully.");
});

/**
 * POST /api/auth/logout
 * Clearing the cookie is enough: the token is not stored server-side.
 */
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "You have been signed out.",
  });
});

/**
 * GET /api/auth/me
 * Protected. The frontend calls this on load to restore the session.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Current user",
    data: { user: req.user },
  });
});

/**
 * PATCH /api/auth/me
 * Lets a signed-in user update their own display name.
 */
export const updateCurrentUser = asyncHandler(async (req, res) => {
  const fullName = validateFullName(req.body.fullName);
  const user = await updateUserName(req.user.id, fullName);

  res.status(200).json({
    success: true,
    message: "Your profile was updated.",
    data: { user },
  });
});

/**
 * PATCH /api/auth/password
 * Requires the current password before setting a new one.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = validateLoginPassword(req.body.currentPassword);
  const newPassword = validatePassword(req.body.newPassword, "newPassword");

  const currentHash = await getPasswordHash(req.user.id);
  const matches = currentHash
    ? await bcrypt.compare(currentPassword, currentHash)
    : false;

  if (!matches) {
    throw ApiError.badRequest("Your current password is incorrect.", [
      { field: "currentPassword", message: "Your current password is incorrect." },
    ]);
  }

  const samePassword = await bcrypt.compare(newPassword, currentHash);

  if (samePassword) {
    throw ApiError.badRequest("Choose a password you have not used before.", [
      {
        field: "newPassword",
        message: "Your new password must be different from your current one.",
      },
    ]);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await updateUserPassword(req.user.id, passwordHash);

  res.status(200).json({
    success: true,
    message: "Your password was changed. Use it the next time you sign in.",
  });
});

/**
 * POST /api/auth/forgot-password
 * Creates a single-use, 30-minute reset link.
 *
 * Email delivery is not connected yet. In development the API returns the
 * reset URL so the flow can be tested. In production it is never returned.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = validateEmail(req.body.email);
  const account = await findUserByEmail(email);
  const data = {};

  if (account && account.status === "active") {
    const { token, tokenHash } = createPasswordResetToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
    );

    await createResetToken({
      userId: account.id,
      tokenHash,
      expiresAt,
    });

    if (env.nodeEnv !== "production") {
      data.resetToken = token;
      data.resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
      data.expiresAt = expiresAt.toISOString();
    }
  }

  res.status(200).json({
    success: true,
    message: GENERIC_RESET_MESSAGE,
    data,
  });
});

/**
 * POST /api/auth/reset-password
 * The raw token is hashed and matched against the stored hash. Tokens are
 * single-use and expire after 30 minutes.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const token = cleanText(req.body.token);
  const password = validatePassword(req.body.password);

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw ApiError.badRequest(
      "This reset link is invalid or has expired. Request a new one.",
      [{ field: "token", message: "Reset link is invalid." }]
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const record = await findValidResetToken(tokenHash);

  if (!record) {
    throw ApiError.badRequest(
      "This reset link is invalid or has expired. Request a new one.",
      [{ field: "token", message: "Reset link is invalid or expired." }]
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await updateUserPassword(record.userId, passwordHash);
  await markResetTokenUsed(record.id);
  await deleteResetTokensForUser(record.userId);
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Your password was reset. You can now sign in.",
  });
});
