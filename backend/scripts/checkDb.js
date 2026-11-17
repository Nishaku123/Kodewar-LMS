import mysql from "mysql2/promise";
import { env } from "../config/env.js";

/**
 * Phase 1 database check.
 *
 * 1. Connects to the TiDB Cloud server.
 * 2. Creates the application database if it does not exist yet.
 * 3. Reconnects using that database and confirms it answers queries.
 *
 * Run it with: npm run db:check
 *
 * This script never prints the database password.
 */
const ssl = env.db.ssl ? { minVersion: "TLSv1.2" } : undefined;

const baseConnectionOptions = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  ssl,
  connectTimeout: 20_000,
};

async function main() {
  console.log(`\nConnecting to TiDB at ${env.db.host}:${env.db.port} ...`);

  const adminConnection = await mysql.createConnection(baseConnectionOptions);

  try {
    const [serverRows] = await adminConnection.query(
      "SELECT VERSION() AS version, CURRENT_USER() AS currentUser"
    );

    console.log("  Connected successfully.");
    console.log(`  TiDB version: ${serverRows[0].version}`);

    // The database name was validated in config/env.js.
    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``
    );
    console.log(`  Database "${env.db.name}" is ready.`);
  } finally {
    await adminConnection.end();
  }

  const appConnection = await mysql.createConnection({
    ...baseConnectionOptions,
    database: env.db.name,
  });

  try {
    const [rows] = await appConnection.query(
      "SELECT DATABASE() AS name, VERSION() AS version, NOW() AS serverTime"
    );
    const [tables] = await appConnection.query("SHOW TABLES");

    console.log(`  Connection to "${rows[0].name}" works.`);
    console.log(`  Server time: ${rows[0].serverTime.toISOString()}`);
    console.log(`  Tables currently in database: ${tables.length}`);
  } finally {
    await appConnection.end();
  }

  console.log("\nDatabase check passed.\n");
}

main().catch((error) => {
  console.error("\nDatabase check failed.");
  console.error(`Reason: ${error.message}`);

  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }

  console.error(
    "\nCheck backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) and try again.\n"
  );

  process.exitCode = 1;
});
