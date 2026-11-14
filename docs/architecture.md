# Project architecture

A standard Next.js (App Router) application deployed on Vercel, with Supabase Postgres as the database.

## Directories

- `app/` — routing, layouts, pages, and HTTP API boundaries only.
- `features/campaign/` — campaign configuration, participant session logic, and the public campaign experience.
- `features/admin/` — administrator-facing components, reporting UI, and admin account management.
- `db/` — Postgres client (`postgres` + Drizzle) and schema.
- `drizzle/` — immutable database migrations and migration metadata.
- `components/ui/` — reusable design-system primitives.
- `lib/` — shared framework infrastructure (Supabase clients, admin auth helpers).
- `scripts/` — local operational scripts (e.g. `create-admin.mjs`).
- `public/` — static assets.
- `docs/` — project documentation and operational notes.

## Dependency direction

Routes may depend on features and the database layer. Features may depend on shared UI, shared libraries, and the database layer. Database and shared infrastructure modules must not import route modules.

Use the `@/` alias for cross-directory imports. Relative imports are reserved for files within the same small module.

## Auth

- Participants: passwordless, identified by a random session token stored in an HTTP-only cookie (`beginning_session`), set on registration.
- Admins: email + password, stored in the `admins` table (password hashed with `scrypt`). Session is a signed, stateless cookie (`admin_session`) verified with `ADMIN_SESSION_SECRET`. The `developer` role can add/remove other admin accounts via `/admin/manage`; the `admin` role is read/operate-only.
