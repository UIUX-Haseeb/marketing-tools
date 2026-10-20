# birthday — Birthday post

Entry: `index.tsx` → `birthday-tool.tsx`. Template geometry: `template.ts` (locked). Two formats, picked with **Format** at the top of the tool (applies to the month cards, the ZIP export and Create new):

- **Portrait** — `BIRTHDAY`, artwork `public/tools/birthday/provident-birthday-post.webp` (2160×2936).
- **Landscape** — `BIRTHDAY_LANDSCAPE`, artwork `public/tools/birthday/provident-birthday-landscape.webp` (3840×2160, a 1920×1080 post at 2×). The same design laid out side by side: photo circle on the left; Happy Birthday, name, designation and message on the right; wordmark in the footer band. It was composed from the portrait artwork's own elements, so the two stay identical in type and colour; name and designation keep the portrait's sizes. Figma: ProvToys-Templates › Marketing Tools › Birthday, frame *Birthday · Landscape*.

Flow: pick month(s) → cards for every employee with a birthday (photo, name, designation prefilled) → per-card Adjust / Download, or Export all as ZIP. "Create new" opens the manual form for people not in the list.

Depends on: `_shared/`, `@/lib/demo/employees` (`listEmployees()` — replace with the CRM), `@/lib/demo/types` (`Employee`, `birthMonth`, `birthDay`), `@/lib/store` (`logGeneratedPost`), `@/components/ui/button`, `@/lib/utils`.

Employee photos must be loadable by a `<canvas>` (same-origin or CORS-enabled URLs, or data URLs).
