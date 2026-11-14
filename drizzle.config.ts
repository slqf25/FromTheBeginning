import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {}

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) throw new Error("POSTGRES_URL_NON_POOLING is not set. Add it to .env.local before running drizzle-kit.");

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
});
