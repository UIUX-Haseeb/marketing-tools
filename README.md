# Prov Toys

Internal marketing tools for Provident Real Estate staff (agents, HR, L&D, Marketing). **Front-end only, TypeScript, demo data — no login, no navigation, no database, no CRM connection.** The web app is just the tool grid; requests, navigation and sign-out belong to the CRM. It's meant to be dropped into the company's own TypeScript stack; every place that would talk to a real system is one small file.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 with Provident design tokens · self-hosted Google Sans Flex · canvas rendering for posts · `html-to-image` for the booklet's pages.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static-friendly production build
npm run snapshot   # Project Booklet only: re-save its off-plan project pages (Node 22.18+)
```

No environment variables are needed.

## What's inside

```
src/
  app/(app)/                 Pages: home (/) and tools/[slug] — that's the whole app
  app/sheet/                 /sheet — the booklet's template sheet (every social design at full size, for review / Figma)
  lib/tools.ts               ← TOOL REGISTRY (one entry per tool)
  lib/teams.ts               Team labels
  lib/demo/employees.ts      ← DEMO EMPLOYEE LIST (stands in for the CRM)
  lib/demo/types.ts          Employee / GeneratedPost shapes
  lib/store.ts               localStorage log of generated posts
  tools/                     ← ONE FOLDER PER TOOL, each with its own README (see tools/README.md for handover)
  tools/_shared/             Post rendering engine shared by the post tools
  components/ui/             Button, Input, Select, Label
public/tools/<tool>/         Each tool's artwork; public/tools/_shared/fonts/ the locked brand font
public/mascot/               Mascot renders
scripts/snapshot-projects.mjs  Saves off-plan project pages into the booklet's local project database
```

## Integration points (for the CRM / platform team)

| What | Where | Replace with |
| --- | --- | --- |
| Employee list (name, designation, DOB, photo) | `src/lib/demo/employees.ts` → `listEmployees()` | Your employee source. Keep the `Employee` type in `lib/demo/types.ts`; `photoUrl` must be readable by a `<canvas>` (same-origin or CORS-enabled). |
| Generated-post log | `src/lib/store.ts` → `logGeneratedPost` | Your analytics / DB (no image is stored, only who/what/when). |
| Off-plan projects (Project Booklet) | `src/tools/project-booklet/projects/` — six saved pages + their pictures | Your project source, as a `ProjectData` (the saved JSON's `data` is exactly that shape), with pictures a `<canvas>` can draw (same-origin or CORS-enabled). |
| Agent mobile, email, BRN (Project Booklet) | placeholders in `src/tools/project-booklet/agent.ts` | Not in the `Employee` type yet — the CRM contract needs these three fields. |
| Who is the user / which team | none — the demo shows every tool | Filter `TOOLS` by `tool.teams` against your session's team. |
| Navigation, requests, sign-out | none — the app is just the tool grid | Provided by the CRM shell the tools are mounted in. |

## Adding a tool

1. `src/tools/<slug>/index.tsx` with a default-export component (client or server).
2. Register it in `src/lib/tools.ts` with `component: () => import("@/tools/<slug>")`. Without `component` it shows as "Coming soon".
3. Follow **STYLEGUIDE.md** (tokens, type weights, layout) and use the primitives in `src/components/ui`.

## Post tools (Birthday, New Baby, Just Sold, Just Listed, Just Rented)

Shared engine in `src/tools/_shared/`, ported 1:1 from the original General Post Generator: locked geometry per template, the bundled Google Sans Flex 400 subset with a fingerprint check (posts are never rendered with a substitute font), fit-to-width text, circular photo crop with zoom/nudge/drag, PNG export that falls back to a byte-budgeted JPEG (custom encoder), and a ZIP writer for "Export all".

- **Birthday** — month view over the employee list, live-rendered cards, per-post Adjust/Download, Export all as ZIP, "Create new" manual form for people not in the list.
- **New Baby** — It's a Boy / It's a Girl, name only.
- **Just Sold / Just Listed / Just Rented** — property photo, bedrooms/bathrooms/sqft (Just Listed only), property type, location, price, agent (prefilled, editable), mandatory DLD QR image. Classic/Minimal design and Post/Story format pickers on each. All three in `src/tools/listing/`.

## Booklets (Project Booklet)

`src/tools/project-booklet/` — pick a source (Dubai Offplan or Abu Dhabi Offplan) and one of its saved off-plan projects, and every field fills in; then download a 4:5 **PDF brochure** (designs A · Paper & navy / B · White) or a **social post** — a single feed (4:5) / story (9:16) post or a carousel ZIP, two designs each — with the agent and the DLD / permit QR. It doesn't use the post engine: pages are HTML/CSS artwork drawn to canvas with `html-to-image`. Its README has the site → field mapping, the layout rules and how to refresh the saved projects.

The design tokens and rules for building new tools are documented in **STYLEGUIDE.md** (repo only — not shown in the app).

**Handing tools to another codebase:** read `src/tools/README.md` — each tool folder is self-contained and lists exactly what it needs from the host app.
