# Supabase and Vercel setup

## Environment files

For local development, copy `.env.example` to `.env.local` and replace every placeholder you intend to use. Keep `.env.local` untracked. The existing `.env` is also ignored, but `.env.local` matches the convention used by Next.js and Vercel projects.

In Vercel, add the same variables under **Project Settings → Environment Variables**. The Supabase integration from the Vercel Marketplace can synchronize the Supabase API keys and Postgres connection strings automatically.

## Key safety

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be included in browser bundles. Enable Row Level Security on every exposed table.
- `SUPABASE_SECRET_KEY`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `BREVO_API_KEY`, and `CRON_SECRET` are server-only. Never add `NEXT_PUBLIC_` to these names.
- Use the current `sb_publishable_...` and `sb_secret_...` keys. The legacy `anon` and `service_role` keys are not required for a new setup.

## Connection choice

- Use `POSTGRES_URL` (transaction pooler, normally port 6543) from Vercel serverless runtime code.
- Use `POSTGRES_URL_NON_POOLING` (direct connection, normally port 5432) for migrations and schema tools.
- Use the Supabase API URL and secret key for trusted server-side Data API operations when a direct Postgres connection is unnecessary.

## Client setup

- `lib/supabase/client.ts` creates the browser client for Client Components.
- `lib/supabase/server.ts` creates a cookie-aware client for Server Components, Server Actions, and Route Handlers.
- `lib/supabase/proxy.ts` and the root `proxy.ts` verify and refresh Supabase Auth sessions using the Next.js 16 proxy convention.

The campaign homepage was intentionally left unchanged. The `todos` page from the Supabase quickstart is only a demonstration and assumes a table that this project does not use.

## Reminder cron

Vercel Cron sends `CRON_SECRET` as `Authorization: Bearer <value>`. The reminder route accepts this standard header and temporarily continues to accept the legacy `x-reminder-key` header with `REMINDER_CRON_SECRET`.

Vercel Hobby cron jobs can run only once per day and execute sometime within the selected UTC hour. A daily reminder check is sufficient for this campaign because the API itself decides whether an active reminder window exists.

## Migration status

Done:

1. Supabase Postgres tables and Row Level Security created (`participants`, `checkins`, `reminder_logs`, `admins`).
2. `db/index.ts` and `db/schema.ts` run on Postgres (`postgres` + Drizzle), not D1/SQLite.
3. Admin authentication is email + hashed password against the `admins` table (not Supabase Auth — see [docs/architecture.md](architecture.md)), with a `developer` role that can manage other admin accounts from `/admin/manage`.
4. The app runs as standard Next.js (no more Cloudflare Worker/vinext runtime).

Still open before production traffic:

1. Add and test the Vercel cron schedule for `/api/reminders/run`.
2. Import any existing participant, check-in, and reminder-log data if migrating from a prior deployment.
