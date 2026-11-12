import { checkDatabase } from "../config/db.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/health
 *
 * The frontend uses this endpoint to show whether the API and the database
 * are reachable. It never reveals credentials or internal details.
 */
export const getHealth = asyncHandler(async (req, res) => {
  let database = {
    connected: false,
    name: env.db.name,
    version: null,
  };

  try {
    const result = await checkDatabase();
    database = {
      connected: true,
      name: result.name,
      version: result.version,
    };
  } catch (error) {
    // A failed database check should not crash the API. The API reports
    // "degraded" so the frontend can display a useful message.
    console.error("[HEALTH] Database check failed:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "Kodewar LMS API is running",
    data: {
      status: database.connected ? "ok" : "degraded",
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    },
  });
});
