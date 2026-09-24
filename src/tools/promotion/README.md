# promotion — Promotion congratulations post

Entry: `index.tsx` → `promotion-tool.tsx`. Geometry: `template.ts`. Renderer: `render.ts`.

**Two DESIGNS, picked in the form** (a `DesignPicker`, same shape as `listing/`'s Design/Format
pickers). `PROMOTION` ("standard") is the original centred layout, geometry measured from Figma
"Birthday-template" node 174:133498, drawn at 1152×1440, output 1080×1440 — centred layout,
x = Figma − 36. `PROMOTION_EXECUTIVE` ("executive") is a distinct left-aligned layout for
VIP/leadership promotions, measured from node 265:596 ("Congratulations VIP", 1080×1440
natively — no Figma-frame-offset math needed for this one). `renderPromotion()` dispatches to
`renderStandard` / `renderExecutive` internally based on `input.design`; `photoRect(img, box, t)`
takes the box explicitly now (was hardcoded to "standard"'s box) so both designs share it.

**"standard" layers**, bottom to top: `public/tools/promotion/background.png` (flattened: navy
gradient, circle pattern, top + low gradients only) → colleague's photo, cover-fit in the
508.7×713.1 frame box, clipped at the frame's sides and bottom edge but free to rise above the
top → `public/tools/promotion/frame.png` (the thin frame outline only, transparent, drawn above
the photo) → "provident." wordmark + gold script *Congratulations* (SVG layers) → name (Regular
51.7 #F4F1EC), "On Your Promotion to {designation}" (Light 23 white, prefix fixed) and the fixed
three-line closing paragraph (Light 23 white).

**"executive" layers**, bottom to top: `public/tools/promotion/background-executive.png`
(flattened: the diagonal navy gradient shapes, gold accent line, circle pattern — no photo, no
text) → colleague's photo, cover-fit in a plain 658×1170 rectangle flush with the canvas's right
and bottom edges (no rounding, no frame outline — none exists in the reference) → the same
wordmark + script assets "standard" uses, redrawn at this design's own box → left-aligned text:
name (Regular 55 white), a fixed subtitle line ("On your well-deserved position to", Light 27,
gray `#6B7280`), the typed designation with a code-appended "!" (Regular 38, gold `#B0905B`,
the same " /year"-style suffix pattern Just Rented uses), a divider line, the typed department
(Medium 24, tracked caps, 14% tracking — same ratio `CHIP_STYLE` uses) and a fixed
"LEADERSHIP ANNOUNCEMENT" tag (Medium 17, tracked caps, right-aligned). Text is drawn on top of
the photo, matching Figma's z-order — the photo box overlaps the text column horizontally, which
is fine since the text has its own opaque colour.

Fields: design (Standard/Executive), pick from the employee list (prefills name + photo — the
designation field stays empty because it's the *new* role) or type manually; department (
executive only, required, free text — no `Employee` field prefills it); photo upload with size
slider + drag. Background removal runs automatically on upload (`_shared/remove-bg.ts`), with
the robot overlay and a Removed / Original toggle.

**Assets:** `background.png` and `background-executive.png` are exported straight off their
Figma frame's own flattened background layer (1080×1440 each) — no text, no logo, no script, no
photo, no frame; `frame.png` ("standard" only) is the "profile frame" outline layer alone on a
transparent canvas. `background.png`/`frame.png` are code-generated stand-ins per the original
note below; `background-executive.png` is a real export (converted from Figma's PNG export with
`sharp`, since a straight PNG re-save left it at ~1.5 MB). Export the real "standard" layers
from Figma at 1× as 1080×1440 (crop 36 px off each side of the 1152 frame, or resize the frame
to 1080 keeping content centred) and replace them, same file names.

Depends on: `_shared/` (font, export, remove-bg, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
