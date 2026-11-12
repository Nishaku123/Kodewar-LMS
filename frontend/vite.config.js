import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Where the Express API listens during development.
// 127.0.0.1 is used instead of "localhost" so Windows does not resolve the
// name to IPv6 (::1) and fail to reach an API listening on IPv4 only.
const DEFAULT_API_TARGET = "http://127.0.0.1:5000";

// Vite is the frontend development server and production bundler.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiTarget = (
    env.VITE_PROXY_TARGET ||
    env.VITE_DEV_API_TARGET ||
    DEFAULT_API_TARGET
  ).replace(/\/$/, "");

  // Shared by `vite` (dev) and `vite preview` (built app preview).
  // Without this, `npm run preview` would send /api requests to the static
  // preview server and every API call would fail.
  const proxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
      // When the API is down the default gateway error is an opaque 502.
      // Return a helpful JSON response instead so the UI can explain it.
      configure(proxyServer) {
        proxyServer.on("error", (error, req, res) => {
          if (!res || typeof res.writeHead !== "function" || res.headersSent) {
            return;
          }

          const isConnectionError = [
            "ECONNREFUSED",
            "ECONNRESET",
            "EHOSTUNREACH",
            "ENOTFOUND",
          ].includes(error.code);

          const message = isConnectionError
            ? `Cannot reach the API at ${apiTarget}. Start the backend with "npm run dev:backend" (or "npm run dev" from the project root).`
            : `The API proxy failed: ${error.message}`;

          res.writeHead(isConnectionError ? 503 : 502, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(
            JSON.stringify({
              success: false,
              code: "API_UNAVAILABLE",
              message,
            })
          );
        });
      },
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Listen on all interfaces so phones and other devices on the LAN work.
      host: true,
      // During development, requests to /api are forwarded to Express.
      // This means the browser sees one origin and we avoid CORS problems.
      proxy,
    },
    preview: {
      port: 4173,
      host: true,
      // `vite preview` does not inherit server.proxy automatically.
      proxy,
    },
  };
});
