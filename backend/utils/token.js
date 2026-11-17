import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * JWT and cookie helpers for authentication.
 *
 * The token is stored in an httpOnly cookie. JavaScript in the browser
 * cannot read it, which protects it from cross-site scripting attacks.
 */
export const AUTH_COOKIE_NAME = "kodewar_auth";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
  };
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}

/**
 * Password reset tokens are random 32-byte values. Only the SHA-256 hash is
 * stored in the database, so the raw token cannot be recovered from a leak.
 */
export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export const PASSWORD_RESET_TTL_MINUTES = 30;
