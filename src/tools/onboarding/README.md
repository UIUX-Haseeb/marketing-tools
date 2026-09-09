# onboarding — Welcome Aboard post

Entry: `index.tsx` → `onboarding-tool.tsx`. Geometry: `template.ts` (measured from Figma "Birthday-template" node 131:185, 1080×1350). Renderer: `render.ts`.

Layers: `public/tools/onboarding/background.png` (flattened navy gradient + circle pattern + upper gradient) → new joiner's photo, cover-fit in the 622×897 box, clipped → `public/tools/onboarding/bottom-fade.png` (1080×515, fades the photo into the background) → fixed headline + sub text, name (Regular 42 white), designation (Regular 20.2 gold, caps).

Fields: pick from the employee list (prefills name, designation, photo) or type manually; photo upload with size slider + drag. On upload the background is removed automatically in the browser (`src/tools/_shared/remove-bg.ts`, see the shared README) behind a full-screen overlay with the robot video; a Removed / Original toggle appears once it's done and "Use the photo as it is" on the overlay skips the wait.

**Assets:** the two PNGs currently in `public/tools/onboarding/` are code-generated stand-ins. Export the real layers from Figma at 1× and replace them, same file names.

Depends on: `_shared/` (font, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
