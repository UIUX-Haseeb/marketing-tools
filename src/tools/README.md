# Tools — handover guide

Every tool is a self-contained folder here. To move a tool into another codebase, copy:

1. its folder from `src/tools/<tool>/`
2. the shared folder `src/tools/_shared/` (needed by every post tool — copy it once)
3. its assets from `public/tools/<tool>/` and the shared fonts `public/tools/_shared/`

Then satisfy the small **host contract** below and mount the tool's `index.tsx` (or the named entry) on a route.

| Folder | What it is | Entry | Assets |
| --- | --- | --- | --- |
| `_shared/` | Canvas post engine: locked brand font loader, renderer, PNG/JPEG export with byte budget, ZIP writer, editor + UI pieces | — | `public/tools/_shared/fonts/` |
| `birthday/` | Birthday post — month view over the employee list + manual form | `index.tsx` | `public/tools/birthday/` |
| `baby/` | New Baby post (Boy / Girl) | `index.tsx` | `public/tools/baby/` |
| `condolence/` | Condolence post with read-before-download gate | `index.tsx` | `public/tools/condolence/` |
| `listing/` | Just Sold + Just Listed (one design, two headlines) | `just-sold.tsx`, `just-listed.tsx` | none (photo is uploaded) |

## Host contract (what the tools import from the app)

| Import | Purpose | In this repo | In the CRM |
| --- | --- | --- | --- |
| `@/components/ui/*` | Button, Input, Label, Select, Textarea | `src/components/ui/` | Map to your UI kit, or copy the folder (plain Tailwind, no deps beyond `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`) |
| `@/lib/utils` → `cn()` | class merging | `src/lib/utils.ts` | copy (3 lines) |
| `@/lib/demo/employees` → `EMPLOYEES`, `listEmployees()` | employee list (name, designation, DOB, photo) | demo data | **your CRM** — keep the `Employee` type from `src/lib/demo/types.ts` |
| `@/lib/store` → `logGeneratedPost` | post log | localStorage | **your API** — same signature |
| `lucide-react` | icons | npm | npm |

Fonts: `_shared/font.ts` registers Google Sans Flex (300, 400-subset, 500) under a private family name via the FontFace API and refuses to export if a substitute font is detected. Keep the three woff2 files reachable at `/tools/_shared/fonts/` (or change `POST_FONT_URL` / `EXTRA_FACES`).

Styling: Tailwind v4 with the tokens in `src/app/globals.css` (see STYLEGUIDE.md). Tools use semantic classes (`bg-card`, `text-muted-foreground`, `text-brand`…), so bring those token definitions or map them to yours.

No server code, no environment variables, no database — everything runs in the browser.
