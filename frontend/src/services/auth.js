import { apiRequest } from "./api.js";

/**
 * Authentication API calls.
 * Each function returns the API response payload:
 * { success, message, data? }.
 */

// React StrictMode calls mount effects twice in development. Sharing the
// in-flight /auth/me request avoids a duplicated network call (and the
// duplicated "Failed to load resource" console entries that came with it).
let currentUserRequest = null;

export function loginRequest(credentials) {
  currentUserRequest = null;

  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function registerRequest(details) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function logoutRequest() {
  currentUserRequest = null;

  return apiRequest("/auth/logout", { method: "POST" });
}

export function getCurrentUserRequest() {
  if (!currentUserRequest) {
    const promise = apiRequest("/auth/me");
    currentUserRequest = promise;

    const clear = () => {
      if (currentUserRequest === promise) currentUserRequest = null;
    };

    promise.then(clear, clear);
  }

  return currentUserRequest;
}

export function updateProfileRequest(details) {
  return apiRequest("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(details),
  });
}

export function changePasswordRequest(details) {
  return apiRequest("/auth/password", {
    method: "PATCH",
    body: JSON.stringify(details),
  });
}

export function forgotPasswordRequest(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(details) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(details),
  });
}
