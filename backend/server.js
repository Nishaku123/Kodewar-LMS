import { app } from "./app.js";
import { env } from "./config/env.js";
import { closePool } from "./config/db.js";

const server = app.listen(env.port, () => {
  console.log("");
  console.log("  KODEWAR LMS API");
  console.log(`  Running at:  http://localhost:${env.port}`);
  console.log(`  Health:      http://localhost:${env.port}/api/health`);
  console.log(`  Environment: ${env.nodeEnv}`);
  console.log("");
});

/**
 * Close the HTTP server and the database pool cleanly on Ctrl+C or when
 * the hosting platform stops the process.
 */
async function shutdown(signal) {
  console.log(`\n[${signal}] Shutting down Kodewar LMS API...`);

  server.close(async () => {
    try {
      await closePool();
      console.log("Database connections closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error while closing the database pool:", error.message);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
