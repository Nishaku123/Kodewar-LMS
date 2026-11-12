import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const currentFolder = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Do not advertise the server technology.
app.disable("x-powered-by");

// Production deployments usually sit behind nginx, a load balancer or a
// hosting gateway. Trusting exactly one proxy hop makes rate limiting and
// secure cookies use the real client IP and protocol.
if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

// Security headers. crossOriginResourcePolicy is relaxed so uploaded files
// can be displayed by the frontend in a later phase.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Only the configured frontend may call the API with credentials.
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Parse JSON and form bodies with a reasonable size limit.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Reads the httpOnly authentication cookie into req.cookies.
app.use(cookieParser());

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// Basic protection against API abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please wait a moment and try again.",
  },
});

app.use("/api", apiLimiter, apiRoutes);

// A single-service deployment can serve the built React app from Express.
// This block stays opt-in and is skipped in development, where Vite serves
// the frontend with hot reload. SPA routes fall back to index.html.
if (env.serveFrontend) {
  const frontendDist = path.resolve(currentFolder, "../frontend/dist");

  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    app.use(express.static(frontendDist, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        return next();
      }

      return res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    console.warn(
      "[deploy] SERVE_FRONTEND is enabled but frontend/dist was not found. Run npm run build first."
    );
  }
}

// These must always be last.
app.use(notFound);
app.use(errorHandler);
