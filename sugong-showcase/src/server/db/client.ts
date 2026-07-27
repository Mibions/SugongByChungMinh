import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
let sqlClient: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when DATA_SOURCE=database");
  }

  sqlClient = postgres(databaseUrl, {
    // Supavisor transaction mode is most reliable with one connection per
    // serverless invocation. Product reads are now one query and config is
    // warmed in the background, so a second connection only adds timeout risk.
    max: 1,
    idle_timeout: 10,
    connect_timeout: 15,
    max_lifetime: 60 * 15,
    prepare: false,
  });
  database = drizzle(sqlClient, { schema });
  return database;
}

export async function closeDatabase() {
  await sqlClient?.end();
  database = undefined;
  sqlClient = undefined;
}
