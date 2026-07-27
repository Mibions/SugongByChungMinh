import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const migrationId = "0000_catalog_admin";
const migrationPath = fileURLToPath(new URL("../drizzle/0000_catalog_admin.sql", import.meta.url));
const migrationSql = await readFile(migrationPath, "utf8");
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS sugong_schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const applied = await sql<{ id: string }[]>`
    SELECT id FROM sugong_schema_migrations WHERE id = ${migrationId}
  `;

  if (applied.length > 0) {
    console.log(`Migration ${migrationId} is already applied.`);
  } else {
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
