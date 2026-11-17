import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

/**
 * Applies database/schema.sql and every numbered file in database/migrations.
 *
 * Run it with: npm run db:migrate
 *
 * The baseline schema uses CREATE TABLE IF NOT EXISTS, so running this command
 * again is safe and will not delete existing data. Numbered migrations are
 * recorded in the schema_migrations table and each file is applied only once.
 */
const currentFolder = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(currentFolder, "../../database/schema.sql");
const migrationsFolder = path.resolve(
  currentFolder,
  "../../database/migrations"
);

const REQUIRED_TABLES = [
  "roles",
  "users",
  "password_reset_tokens",
  "courses",
  "course_modules",
  "lessons",
  "course_enrollments",
  "lesson_completions",
  "assessments",
  "assessment_questions",
  "assessment_options",
  "assessment_attempts",
  "assessment_answers",
  "assignments",
  "assignment_submissions",
  "schema_migrations",
];

async function listMigrationFiles() {
  const entries = await fs.readdir(migrationsFolder, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^\d+.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

async function applyMigrations(connection) {
  const files = await listMigrationFiles();
  const [appliedRows] = await connection.query(
    "SELECT filename FROM schema_migrations"
  );
  const applied = new Set(appliedRows.map((row) => row.filename));

  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`  skipped ${filename} (already applied)`);
      continue;
    }

    const migrationPath = path.join(migrationsFolder, filename);
    const sql = await fs.readFile(migrationPath, "utf8");

    console.log(`  applying ${filename}`);
    await connection.query(sql);
    await connection.execute(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [filename]
    );
    console.log(`  applied  ${filename}`);
  }

  if (!files.length) {
    console.log("  no numbered migrations found");
  }
}

async function main() {
  const sql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    ssl: env.db.ssl ? { minVersion: "TLSv1.2" } : undefined,
    multipleStatements: true,
    connectTimeout: 20_000,
  });

  try {
    console.log(`\nApplying schema to "${env.db.name}" ...`);
    await connection.query(sql);

    console.log("\nApplying numbered migrations ...");
    await applyMigrations(connection);

    const missingTables = [];

    for (const table of REQUIRED_TABLES) {
      const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
      if (rows.length !== 1) missingTables.push(table);
    }

    if (missingTables.length) {
      throw new Error(
        `Schema ran but these required tables are missing: ${missingTables.join(", ")}`
      );
    }

    for (const table of REQUIRED_TABLES) {
      console.log(`  ${table} table ready`);
    }
    console.log("\nMigration complete.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("\nMigration failed.");
  console.error(`Reason: ${error.message}`);
  console.error("\nCheck backend/.env and run npm run db:check, then try again.\n");
  process.exitCode = 1;
});
