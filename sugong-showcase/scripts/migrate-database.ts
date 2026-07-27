import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  if (process.argv.includes("--if-configured")) {
    console.log("DATABASE_URL is not configured; skipping database migrations.");
    process.exit(0);
  }
  throw new Error("DATABASE_URL is required");
}

const migrationDirectory = fileURLToPath(new URL("../drizzle", import.meta.url));
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS sugong_schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const migrationFiles = (await readdir(migrationDirectory))
    .filter((fileName) => /^\d+.*\.sql$/.test(fileName))
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of migrationFiles) {
    const migrationId = fileName.replace(/\.sql$/, "");
    const applied = await sql<{ id: string }[]>`
      SELECT id FROM sugong_schema_migrations WHERE id = ${migrationId}
    `;
    if (applied.length > 0) {
      console.log(`Migration ${migrationId} is already applied.`);
      continue;
    }

    const migrationSql = await readFile(join(migrationDirectory, fileName), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migrationSql);
      await transaction`
        INSERT INTO sugong_schema_migrations (id) VALUES (${migrationId})
      `;
    });
    console.log(`Applied migration ${migrationId}.`);
  }
} finally {
  await sql.end();
}
