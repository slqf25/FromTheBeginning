// One-off local script to create or update an admin login.
// Usage: node scripts/create-admin.mjs <email> <password> ["Display Name"]
import { scryptSync, randomBytes } from "node:crypto";
import postgres from "postgres";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const [, , email, password, displayName] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [\"Display Name\"]");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const passwordHash = `${salt}:${hash}`;

const sql = postgres(process.env.POSTGRES_URL, { prepare: false, ssl: "require" });
await sql`
  insert into admins (email, password_hash, display_name)
  values (${email.toLowerCase()}, ${passwordHash}, ${displayName ?? null})
  on conflict (email) do update set password_hash = excluded.password_hash, display_name = excluded.display_name
`;
await sql.end();
console.log(`Admin account ready: ${email.toLowerCase()}`);
