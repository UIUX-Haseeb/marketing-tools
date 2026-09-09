# onboarding — Welcome Aboard post

Entry: `index.tsx` → `onboarding-tool.tsx`. Geometry: `template.ts` (measured from Figma "Birthday-template" node 131:185, 1080×1350). Renderer: `render.ts`.

Layers: `public/tools/onboarding/background.png` (flattened navy gradient + circle pattern + upper gradient) → new joiner's photo, cover-fit in the 622×897 box, clipped → `public/tools/onboarding/bottom-fade.png` (1080×515, fades the photo into the background) → fixed headline + sub text, name (Regular 42 white), designation (Regular 20.2 gold, caps).

Fields: pick from the employee list (prefills name, designation, photo) or type manually; photo upload with size slider + drag. Photos with the background removed (transparent PNG) match the reference.

**Assets:** the two PNGs currently in `public/tools/onboarding/` are code-generated stand-ins. Export the real layers from Figma at 1× and replace them, same file names.

Depends on: `_shared/` (font, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
