# Provident Marketing Tools

Internal web app for non-technical teams (agents, HR, L&D, …) to create marketing posts and send requests to the Marketing team.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind v4 + shadcn-style UI · Auth.js v5 (Google Workspace SSO) · Prisma 7 + Postgres (Vercel Postgres / Neon) · Vercel.

## How it works

- Staff sign in with their `@providentestate.com` Google account. Only people on the **admin-managed user list** can get in.
- Each user has a **team** (`AGENTS`, `HR`, `LND`, `MARKETING`, `OTHER`) and a **role** (`MEMBER`, `ADMIN`). The team decides which tools show on their dashboard.
- Every tool is declared in one place: `src/lib/tools.ts` (the **tool registry**).
- Any tool can send a **request to Marketing** (`createRequest()` in `src/lib/actions/requests.ts`). Marketing works the queue at `/marketing/requests`; requesters follow theirs at `/requests`.
- Admins manage the user list at `/admin/users`.

```
src/
  auth.ts, auth.config.ts     Google SSO, domain restriction, team/role on the session
  proxy.ts                    Redirects signed-out users to /login
  lib/tools.ts                ← TOOL REGISTRY (add tools here)
  lib/teams.ts                Team/role labels + helpers (isAdmin, isMarketing)
  lib/actions/                Server actions (requests, users)
  lib/prisma.ts               DB client
  tools/<slug>/index.tsx      One folder per tool
  app/(app)/                  Signed-in pages: dashboard, tools/[slug], requests, marketing/requests, admin/users
  app/login/                  Sign-in page
  components/ui/              Button, Card, Input, Textarea, Select, Label, Badge, Table
prisma/schema.prisma          User, Request
```

## Design tokens & style guide

Brand tokens (Provident navy / orange / warm neutrals), self-hosted Google Sans Flex (the only typeface; 300/400/500 weight logic), and UI primitives are defined in `src/app/globals.css` and `src/components/ui`. Read **STYLEGUIDE.md** before building a tool, and use `/styleguide` (admins) as the live reference. Brand source files are in `Provident Guidelines Kit/`.

## Adding a tool (for tool builders)

1. Create `src/tools/<your-slug>/index.tsx` with a **default export** component. It can be a client component (`"use client"`) or a server component. It renders inside the tool page under the tool's title.
2. Register it in `src/lib/tools.ts`:
   ```ts
   {
     slug: "just-listed",
     name: "Just Listed",
     description: "Create a Just Listed post for a new property.",
     teams: ["AGENTS"],
     category: "posts",
     icon: "Home",                                   // any lucide icon name
     component: () => import("@/tools/just-listed"), // add this line when your tool is ready
   }
   ```
   While `component` is missing the dashboard shows the tool as **Coming soon**.
3. Need the current user inside your tool? In a server component: `const user = await requireUser()` from `@/auth`. In a client component: pass what you need as props from a small server wrapper.
4. To send something to Marketing from your tool (e.g. "make a video for this listing"):
   ```ts
   import { createRequest } from "@/lib/actions/requests";
   await createRequest({ type: "listing-video", title, description, payload: { listingId, ... } });
   ```
5. Need extra tables? Add them to `prisma/schema.prisma`, run `npm run db:migrate`, commit the migration.

Keep the UI simple and use the primitives in `src/components/ui`. Add more shadcn components with `npx shadcn@latest add <name>`.

## Post tools (Birthday, New Baby)

Shared canvas engine in `src/tools/_engine/` (ported from the original General Post Generator — geometry, locked Google Sans Flex 400, PNG/JPEG byte budget, ZIP writer). Templates in `public/post-assets/`.

- **Birthday** (`src/tools/birthday`): month view pulls employees from the Portal via `/api/portal/employees`, renders each card live, per-post Adjust/Download, Export all as ZIP. "Create new" opens the manual form for people not in the Portal.
- **New Baby** (`src/tools/baby`): Boy/Girl variant, name only.
- Every download is logged to `GeneratedPost` (no images stored) via `logGeneratedPost()`.

**Portal (CRM) connection** — `src/lib/portal/`. Without `PORTAL_API_URL` + `PORTAL_API_KEY` the app uses `mock.ts` (sample employees, generated portraits) and shows a notice. To go live: set the two env vars and adjust the endpoint path + field mapping in `client.ts` (`toEmployee`) to match the Portal API docs. Photos are proxied through `/api/portal/photo/[id]` so the key never reaches the browser.

New DB table: run `npm run db:deploy` (or `db:migrate` locally) to apply `prisma/migrations/20260908120000_generated_post`.

## Local setup

```bash
npm install
cp .env.example .env          # fill in the values below
npm run db:migrate            # creates tables (first run: name the migration "init")
npm run db:seed               # adds the first admin (edit prisma/seed.ts)
npm run dev
```

Environment variables (`.env` locally, Project → Settings → Environment Variables on Vercel):

| Variable | What |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled). From Vercel Storage → Postgres/Neon. |
| `AUTH_SECRET` | `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Redirect URI: `https://<domain>/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`. Set the OAuth consent screen to **Internal** so only Workspace accounts can use it. |
| `ALLOWED_EMAIL_DOMAIN` | `providentestate.com` |

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add a Postgres database (Storage tab) — it fills `DATABASE_URL` automatically — and the other env vars above.
3. `npm run build` already runs `prisma generate`. Run migrations once against the production DB: `npx prisma migrate deploy` (with `DATABASE_URL` set to production) and seed the first admin.
4. Add the production callback URL to the Google OAuth client.

## Notes

- Sessions are JWTs; team/role are read from the DB at sign-in. If an admin changes someone's team, they see it on their next sign-in (or call `update()` from `next-auth/react`).
- Request `type` is free text on purpose so each tool can define its own kinds; `payload` is JSON for tool-specific fields.
- File uploads (reference images, videos) aren't wired yet — Vercel Blob is the natural fit when a tool needs them.
