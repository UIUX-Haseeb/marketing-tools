# google-review — Google Review post

Entry: `index.tsx` → `google-review-tool.tsx`. Geometry + renderer: `review.ts`.

**Two FORMATS, picked in the form** — the same Post/Story toggle `listing/` uses.
`REVIEW` ("post", 1080×1440) is measured from Figma "Birthday-template" node 215:116 (frame
"Frame" inside "Templates and reference"); `REVIEW_STORY` ("story", 1080×1920) from node
265:463. `reviewGeometryFor(format)` picks one; `canvasSize(format)` gives the pixel
dimensions. Every render/export/preview call site reads those instead of a hardcoded
`REVIEW.width`/`height`, mirroring `listing.ts`'s `classicGeometryFor()` / `canvasSize()`
pattern.

Artwork: `public/tools/google-review/background.webp` (post) / `background-story.webp`
(story) — the dotted navy texture, exported straight off the Figma layer per format (it's an
image fill, not a generated pattern, so it can't be shared/stretched between formats).
Everything else is drawn live: the star row (1–5, gold `#B0905C`), the review quote (wrapped,
shrinks to fit up to 8 lines, supports a blank-line paragraph break the way the reference
shows), the reviewer's name, a bordered card outline (no fill — the texture shows through;
post: 1px `rgba(255,255,255,0.33)`, story: 0.5px `#ECE7DF` — genuinely different strokes, not
a copy-paste), the agent's circular headshot (zoom/drag, same `coverRect` pattern as
`listing/`, `headshotBoxFor(format)` picks the box) and the agent's name + tracked-caps
designation.

Story's text runs larger throughout (wordmark 49 vs. 41, reviewer/agentName 42 vs. 35,
agentTitle 29 vs. 24) and its own tracked-caps value is its own measured constant (0.5px at
size 29, not scaled from post's 3.36 at size 24) — same "each size is its own value" pattern
`LISTING_MINIMAL_STORY` documents. Card width (910) and headshot radius (148) are identical
between formats; only the taller canvas, repositioned block, and (surprisingly) the headshot
ring opacity (`0.3` vs. post's `0.9`) differ.

The headshot is centred **on the card's bottom edge by design** on both formats (post: cy
1047, card ends at y 1056.49; story: cy 1513, card ends at y 1540) — roughly the lower half of
the photo hangs below the card border. It's drawn after the card so its own ring covers the
border where they overlap, matching the reference exactly.

Fields: format (Post/Story), star rating (click to set), review text, reviewer's name, agent
(pick from the employee list — prefills name + designation + headshot, all editable — or type
manually).

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`
(`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select,textarea}`, `@/lib/utils`.

**No variant split yet.** Unlike Just Sold/Just Listed, this design has no natural headline swap —
nothing in the Figma frame changes between one review post and another except the content. If a
3-way split is wanted later (e.g. by review source, or by rating tier), it's the same shape
`listing/` already uses: one shared editor + thin per-variant `index.tsx`-style entry files, no
architecture change.
