# anniversary — Work Anniversary post

Entry: `index.tsx` → `anniversary-tool.tsx`. Geometry: `template.ts`. Renderer: `render.ts`. 1080 × 1440.

Measured off the approved artwork (supplied as a 1500 × 2000 image — there is no Figma frame for it), scaled to 1080 wide. The text sizes were solved against the locked font itself: header and name 47.6–47.8, designation 17 px caps tracked 3.7 px, message Light 20.5 px on a 33.1 px line — and every block lands within a pixel of the artwork.

Layers, bottom to top:

1. `public/tools/anniversary/background.webp` — flat `#16263F` navy with fine monochrome grain, plus the gold confetti. Built from the artwork: the grain is synthesised to the artwork's own statistics (σ ≈ 4.1, ~1 px soft) and the eleven confetti pieces are lifted from it, so nothing of the old person, numeral or copy remains.
2. **The numeral** — the anniversary year, drawn in code so it changes with the year. Google Sans Flex 400 (the artwork's own numeral was a different face), stroked as a hollow outline like the artwork, finished as **glossy brass**: a soft drop shadow for depth, a metallic gradient (champagne → brass → a bright gloss band → deep bronze) and a thin specular glint along the upper edges. It's sized from the glyph's measured bounds to the artwork's 664 px height, centred where the artwork's "3" sat; a wider number grows left only as far as the header's right edge (x ≈ 488), then shrinks, so "12" never sits behind "Work Anniversary".
3. The colleague's photo — cutout (background removed automatically on upload, `_shared/remove-bg.ts`, Removed / Original toggle), cover-fit in a 750 × 1180 box on the right, clipped only on its left edge so it never runs into the text column; a soft shadow lifts it off the numeral. Size slider + drag.
4. Gold script *Congratulations* (`congratulations.svg`, the same artwork as Promotion's, copied so the tool stays self-contained) → "{n} Years Of / Work Anniversary" → name → designation (tracked caps) → brass divider → message → `provident.` wordmark.

All text is aligned by its visible ink to x = 111 (`inkX` in `render.ts`) rather than by its origin, because that is how the artwork lines its blocks up — a name starting "O" and one starting "M" sit on the same edge.

Copy follows the year: "1 Year Of" / "3 Years Of"; the message is "Celebrating {n} incredible" / "{year|years} with {first name} at Provident." (wrapped at 300 px) / "Here's to many more" / "milestones ahead!". The first name is the first word of the name field.

Fields: pick from the employee list (prefills name, designation and photo — all editable) or type manually; years (1–60, required); name (required); designation (optional — the line is skipped when empty); photo (required).

Depends on: `_shared/` (font, export, remove-bg, bg-removal overlay, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
