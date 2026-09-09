# birthday — Birthday post

Entry: `index.tsx` → `birthday-tool.tsx`. Template geometry: `template.ts` (locked). Artwork: `public/tools/birthday/provident-birthday-post.webp` (2160×2936).

Flow: pick month(s) → cards for every employee with a birthday (photo, name, designation prefilled) → per-card Adjust / Download, or Export all as ZIP. "Create new" opens the manual form for people not in the list.

Depends on: `_shared/`, `@/lib/demo/employees` (`listEmployees()` — replace with the CRM), `@/lib/demo/types` (`Employee`, `birthMonth`, `birthDay`), `@/lib/store` (`logGeneratedPost`), `@/components/ui/button`, `@/lib/utils`.

Employee photos must be loadable by a `<canvas>` (same-origin or CORS-enabled URLs, or data URLs).
