# Prov Toys

Internal marketing tools portal for Provident Real Estate staff (agents, HR, L&D, Marketing). **Front-end only, TypeScript, demo data — no login, no database, no CRM connection.** It's meant to be dropped into the company's own TypeScript stack; every place that would talk to a real system is one small file.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 with Provident design tokens · self-hosted Google Sans Flex · canvas rendering for posts.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static-friendly production build
```

No environment variables are needed.

## What's inside

```
src/
  app/(app)/                 Pages: home (/), tools/[slug], requests, marketing/requests, styleguide
  lib/tools.ts               ← TOOL REGISTRY (one entry per tool)
  lib/teams.ts               Team labels
  lib/demo/employees.ts      ← DEMO EMPLOYEE LIST (stands in for the CRM)
  lib/demo/requests.ts       Seed requests for the queue
  lib/demo/types.ts          Employee / MarketingRequest / GeneratedPost shapes
  lib/store.ts               localStorage store for requests + generated-post log
  tools/_engine/             Post rendering engine (templates, locked font, export, zip)
  tools/<slug>/              One folder per tool (birthday, baby, custom-request)
  components/ui/             Button, Badge, Input, Textarea, Select, Label, Table, Card
public/post-assets/          Post artwork + the locked 400-weight font
public/mascot/               Mascot renders
```

## Integration points (for the CRM / platform team)

| What | Where | Replace with |
| --- | --- | --- |
| Employee list (name, designation, DOB, photo) | `src/lib/demo/employees.ts` → `listEmployees()` | Your employee source. Keep the `Employee` type in `lib/demo/types.ts`; `photoUrl` must be readable by a `<canvas>` (same-origin or CORS-enabled). |
| Requests to Marketing | `src/lib/store.ts` → `addRequest`, `updateRequestStatus`, `useRequests` | Your API / DB. Same function signatures; the pages don't care where data lives. |
| Generated-post log | `src/lib/store.ts` → `logGeneratedPost` | Your analytics / DB (no image is stored, only who/what/when). |
| Who is the user / which team | none — the demo shows every tool | Filter `TOOLS` by `tool.teams` against your session's team. |

## Adding a tool

1. `src/tools/<slug>/index.tsx` with a default-export component (client or server).
2. Register it in `src/lib/tools.ts` with `component: () => import("@/tools/<slug>")`. Without `component` it shows as "Coming soon".
3. Follow **STYLEGUIDE.md** (tokens, type weights, layout) and use the primitives in `src/components/ui`.

## Post tools (Birthday, New Baby)

Shared engine in `src/tools/_engine/`, ported 1:1 from the original General Post Generator: locked geometry per template, the bundled Google Sans Flex 400 subset with a fingerprint check (posts are never rendered with a substitute font), fit-to-width text, circular photo crop with zoom/nudge/drag, PNG export that falls back to a byte-budgeted JPEG (custom encoder), and a ZIP writer for "Export all".

- **Birthday** — month view over the employee list, live-rendered cards, per-post Adjust/Download, Export all as ZIP, "Create new" manual form for people not in the list.
- **New Baby** — It's a Boy / It's a Girl, name only.
