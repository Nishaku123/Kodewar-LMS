// All calls to the Express API go through this file.
// Keeping fetch() in one place makes it easy to change the backend address later.

/**
 * The API base URL:
 * - Development: "/api" (Vite proxies it to the Express server).
 * - Split hosting: set VITE_API_URL to the public API origin, e.g.
 *   "https://api.example.com/api".
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAYS_MS = [600, 1_500];
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/**
 * An error with extra information about the failed API call.
 * `status` is 0 when the request never reached the server.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A 502/503/504 normally comes from a proxy or hosting gateway, not from the
 * API itself. Explain that instead of showing a bare status code.
 */
function gatewayMessage(status) {
  if (status === 502) {
    return (
      "Bad Gateway (502): the API server could not be reached. " +
      "Make sure the backend is running on http://localhost:5000."
    );
  }

  if (status === 503) {
    return "The API is temporarily unavailable (503). Please try again shortly.";
  }

  return "The API took too long to respond (504). Please try again.";
}

/**
 * Runs one fetch attempt with a timeout and converts every failure into an
 * ApiError with a message the UI can display.
 */
async function requestOnce(url, { method, headers, body, signal }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Respect a caller-provided signal (for example when a page unmounts).
  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(url, {
      method,
      body,
      // Authentication uses an httpOnly cookie, so every request must include
      // credentials. Vite proxies /api to Express during development.
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // Only send a content type when there is actually a body. GET and
        // HEAD requests do not need it and some proxies reject them.
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
    });

    // Some errors (for example a proxy failure) may not return JSON.
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const status = response.status;
      const message =
        payload?.message ||
        (RETRYABLE_STATUSES.has(status)
          ? gatewayMessage(status)
          : `Request failed with status ${status}`);

      throw new ApiError(message, {
        status,
        code: payload?.code || (RETRYABLE_STATUSES.has(status) ? "API_UNAVAILABLE" : null),
        details: payload?.details,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === "AbortError") {
      throw new ApiError(
        "The API did not respond in time. Check that the backend is running and try again.",
        { code: "TIMEOUT" }
      );
    }

    throw new ApiError(
      "Cannot reach the API server. Start the backend with \"npm run dev\" and make sure http://localhost:5000/api/health responds.",
      { code: "NETWORK_ERROR" }
    );
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener("abort", abortFromCaller);
  }
}

export async function apiRequest(path, options = {}) {
  const { headers, signal, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;
  const body = rest.body;

  let attempt = 0;

  // Retry temporary failures (server still starting, proxy hiccup). The
  // delay is short so the UI never feels stuck.
  for (;;) {
    try {
      return await requestOnce(url, {
        method,
        headers,
        body,
        signal,
      });
    } catch (error) {
      const isTransient =
        error.code === "NETWORK_ERROR" ||
        error.code === "TIMEOUT" ||
        RETRYABLE_STATUSES.has(error.status);

      const hasRetryLeft = attempt < RETRY_DELAYS_MS.length;

      if (!isTransient || !hasRetryLeft || signal?.aborted) {
        throw error;
      }

      await wait(RETRY_DELAYS_MS[attempt]);
      attempt += 1;
    }
  }
}

export function getHealth() {
  return apiRequest("/health");
}

/**
 * Downloads a binary response (for example a certificate PDF) and saves it
 * with the filename supplied by the API. Errors use the same ApiError shape
 * as JSON requests so callers can show a useful message.
 */
export async function downloadRequest(path, fallbackName = "download") {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    throw new ApiError(payload?.message || `Download failed (${response.status}).`, {
      status: response.status,
      code: payload?.code || null,
      details: payload?.details,
    });
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] || fallbackName;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
