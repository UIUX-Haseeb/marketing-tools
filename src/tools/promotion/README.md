# promotion — Promotion congratulations post

Entry: `index.tsx` → `promotion-tool.tsx`. Geometry: `template.ts` (measured from Figma "Birthday-template" node 174:133498, 1152×1440). Renderer: `render.ts`.

Layers: `public/tools/promotion/background.png` (flattened: navy gradient, circle pattern, top + low gradients, "provident." wordmark, gold script *Congratulations*, fixed closing paragraph) → colleague's photo, cover-fit in the 508.7×713.1 frame box, clipped at the frame's sides and bottom edge but free to rise above the top → `public/tools/promotion/frame.png` (the thin frame outline only, transparent, drawn above the photo) → name (Regular 51.7 #F4F1EC) and "On Your Promotion to {designation}" (Light 23 white, prefix fixed).

Fields: pick from the employee list (prefills name + photo — the designation field stays empty because it's the *new* role) or type manually; photo upload with size slider + drag. Background removal runs automatically on upload (`_shared/remove-bg.ts`), with the robot overlay and a Removed / Original toggle.

**Assets:** the two PNGs in `public/tools/promotion/` are code-generated stand-ins. Export the real layers from Figma at 1× (1152×1440) and replace them, same file names: `background.png` = everything except the "profile frame", "prov logo", "Congratulations" layers and the two editable texts (the logo and script are drawn from SVG by code); `frame.png` = the "profile frame" layer alone on a transparent canvas.

Depends on: `_shared/` (font, export, remove-bg, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
