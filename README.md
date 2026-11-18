# 起初的光

Participants register with a name and email, watch one video each week, record attendance, and qualify for one of two Christmas gift tiers. Administrators can review progress and export the gift list as CSV.

## Technology

- Next.js (App Router) / React 19, deployed on Vercel
- Supabase Postgres via `postgres` + Drizzle ORM
- Supabase browser/server clients with cookie-based session refresh
- TypeScript and Tailwind CSS
- Brevo-backed reminder email endpoint
- Email+password admin login (`developer` role manages other admin accounts)

## Getting started

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run db:generate
npm run dev
```

Copy `.env.example` to `.env.local` for local development. Configure the same values in Vercel Project Settings for Preview and Production as appropriate. Never commit real credentials.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run check` | Run lint and a production build |
| `npm run db:generate` | Generate a migration after a schema change |

## Repository layout

```text
app/                       Routes, layouts, and API boundaries
features/
  admin/
    components/            Administrator reporting UI and admin management
    server/                Admin session verification
  campaign/
    components/            Public campaign experience
    server/                Participant session logic
    config.ts              Campaign dates, copy, and video helpers
db/                        Postgres client and Drizzle schema
drizzle/                   Versioned SQL migrations
components/ui/             Shared UI primitives
lib/                       Shared framework infrastructure
  supabase/                Browser, server, and session-refresh clients
  admin-auth.ts            Admin password hashing and session tokens
scripts/create-admin.mjs   Seed or update an admin account locally
docs/                      Architecture and operational documentation
```

See [docs/architecture.md](docs/architecture.md) for dependency rules.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Local or production canonical site URL |
| `ADMIN_SESSION_SECRET` | Yes | Signs the admin login session cookie; admin accounts live in the `admins` table |
| `NEXT_PUBLIC_SUPABASE_URL` | For Supabase | Browser-safe Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For Supabase | Browser-safe publishable key; protect tables with RLS |
| `SUPABASE_URL` | For Supabase | Server-only Supabase project URL |
| `SUPABASE_SECRET_KEY` | For Supabase | Server-only secret key; never expose to the browser |
| `POSTGRES_URL` | For database runtime | Supabase transaction-pooler URL for serverless functions |
| `POSTGRES_URL_NON_POOLING` | For migrations | Direct/non-pooling Postgres URL for schema tools |
| `BREVO_API_KEY` | For reminders | Brevo API credential |
| `REMINDER_FROM` | For reminders | Verified sender identity |
| `CRON_SECRET` | For Vercel reminders | Long random value sent by Vercel as a Bearer token |
| `REMINDER_CRON_SECRET` | Migration only | Legacy local/Cloudflare alias accepted by the endpoint |

## Database changes

Edit `db/schema.ts`, run `npm run db:generate`, and commit the generated SQL and metadata under `drizzle/`. Existing applied migrations are immutable.

## Admin accounts

Admin accounts live in the `admins` table (email + hashed password), not in an environment variable. Seed or update one locally:

```bash
node scripts/create-admin.mjs <email> <password> ["Display Name"]
```

The `developer` role can add and remove other admins from `/admin/manage`; the `admin` role is read/operate-only. See [docs/supabase-vercel.md](docs/supabase-vercel.md) for the Supabase setup.

## Weekly video links

Each week's YouTube/Vimeo link is stored in the `week_videos` table (not an environment variable) and is editable from `/admin` by any admin. Saving a link takes effect immediately — no redeploy needed. Check-in itself only depends on the campaign dates in `features/campaign/config.ts`, not on whether a video link has been set.
