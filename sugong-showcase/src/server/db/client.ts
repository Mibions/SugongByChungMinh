import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
let sqlClient: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when DATA_SOURCE=database");
  }

  sqlClient = postgres(databaseUrl, {
    // Supabase port 6543 is a transaction pooler. A single connection per
    // serverless instance avoids bursts that can stall concurrent functions.
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
