import { ApiError } from "./ApiError.js";

/**
 * Small, dependency-free validators for the authentication endpoints.
 * Each validator returns a clean value or throws an ApiError with a
 * field-level detail, so the frontend can highlight the right input.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(field, message) {
  throw ApiError.badRequest(message, [{ field, message }]);
}

export function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateFullName(value) {
  const fullName = cleanText(value);

  if (fullName.length < 2) {
    fail("fullName", "Enter your full name (at least 2 characters).");
  }

  if (fullName.length > 120) {
    fail("fullName", "Your name must be 120 characters or fewer.");
  }

  return fullName;
}

export function validateEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!email) {
    fail("email", "Enter your email address.");
  }

  if (email.length > 190 || !EMAIL_PATTERN.test(email)) {
    fail("email", "Enter a valid email address, for example name@example.com.");
  }

  return email;
}

export function validatePassword(value, field = "password") {
  const password = typeof value === "string" ? value : "";

  if (password.length < 8) {
    fail(field, "Use at least 8 characters for your password.");
  }

  // bcrypt only uses the first 72 bytes, so we reject longer values instead
  // of silently ignoring part of the password.
  if (password.length > 72) {
    fail(field, "Your password must be 72 characters or fewer.");
  }

  if (!/[A-Za-z]/.test(password)) {
    fail(field, "Your password must include at least one letter.");
  }

  if (!/[0-9]/.test(password)) {
    fail(field, "Your password must include at least one number.");
  }

  return password;
}

export function validateLoginPassword(value) {
  const password = typeof value === "string" ? value : "";

  if (!password) {
    fail("password", "Enter your password.");
  }

  return password;
}
