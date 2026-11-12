import mysql from "mysql2/promise";
import { env } from "./env.js";

/**
 * A connection pool keeps a small set of reusable database connections.
 * This is faster and safer than opening a new connection for every request.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: "Z",
  decimalNumbers: true,
  // TiDB Cloud requires an encrypted (TLS) connection.
  ssl: env.db.ssl ? { minVersion: "TLSv1.2" } : undefined,
});

/**
 * Runs a tiny query to confirm the database really answers.
 */
export async function checkDatabase() {
  const [rows] = await pool.query(
    "SELECT DATABASE() AS name, VERSION() AS version, NOW() AS serverTime"
  );
  return rows[0];
}

/**
 * Called when the server shuts down so connections are closed cleanly.
 */
export async function closePool() {
  await pool.end();
}
