import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (db) return db;

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is unavailable. Set it in .env.local (Supabase Connect panel) or in your deployment's environment variables before using the database."
    );
  }

  const client = postgres(connectionString, { prepare: false, ssl: "require" });
  db = drizzle(client, { schema });
  return db;
}
