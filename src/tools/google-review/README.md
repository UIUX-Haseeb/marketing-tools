# google-review — Google Review post

Entry: `index.tsx` → `google-review-tool.tsx`. Geometry + renderer: `review.ts` (measured from Figma
"Birthday-template" file, node 215:116 — frame "Frame" inside "Templates and reference", 1080×1440).

Artwork: `public/tools/google-review/background.webp` — the dotted navy texture, exported straight
off the Figma layer (it's an image fill, not a generated pattern). Everything else is drawn live:
the star row (1–5, gold `#B0905C`), the review quote (wrapped, shrinks to fit up to 8 lines, supports
a blank-line paragraph break the way the reference shows), the reviewer's name, a bordered card
outline (1px, no fill — the texture shows through), the agent's circular headshot (zoom/drag, same
`coverRect` pattern as `listing/`) and the agent's name + tracked-caps designation.

The headshot is centred **on the card's bottom edge by design** (cy 1047, card ends at y 1056.49) —
roughly the lower half of the photo hangs below the card border. It's drawn after the card so its
own ring covers the border where they overlap, matching the reference exactly.

Fields: star rating (click to set), review text, reviewer's name, agent (pick from the employee list
— prefills name + designation + headshot, all editable — or type manually).

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`
(`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select,textarea}`, `@/lib/utils`.

**No variant split yet.** Unlike Just Sold/Just Listed, this design has no natural headline swap —
nothing in the Figma frame changes between one review post and another except the content. If a
3-way split is wanted later (e.g. by review source, or by rating tier), it's the same shape
`listing/` already uses: one shared editor + thin per-variant `index.tsx`-style entry files, no
architecture change.
