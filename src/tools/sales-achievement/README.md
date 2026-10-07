# sales-achievement — Sales Achievement post

Entry: `index.tsx` → `sales-achievement-tool.tsx`. Geometry: `template.ts`. Renderer: `render.ts`. 1080 × 1440.

Measured off the approved artwork (two 1500 × 2000 images, no Figma frame), scaled to 1080; text sizes solved against the locked font (name 85.5 px tracked −5.6, designation 25 px caps, headline 37.6 px, stat labels 19 px caps, values 34 px).

**Two stats layouts**, picked in the form: *Total transactions* (Total sale value · Transactions) and *Primary & Secondary* (Total sale value · Primary · Secondary, values as "5 Trx" — the card widens from 831 to 871 px to fit the third column).

Layers, bottom to top: the **background photo** the agent uploads (cover-fit to the whole canvas, Size + drag) → a navy wash, solid at the top and clear by half-way down, so the wordmark, name and designation always read whatever the photo → the **agent's photo** (background removed automatically on upload, `_shared/remove-bg.ts`, Removed / Original toggle, Size + drag) → name and designation → the **glass card**: a blurred copy of everything under it (photo and agent), a dark tint and a hairline → headline "Secured #{rank} for {period}, closing on a high note / with {amount} in sales" (amount in gold) → divider and stats row → the **permit QR** on a white plate over the card's bottom-right corner.

"Drag moves Agent / Background" under the preview picks which photo a drag positions.

Fields: stats layout; agent (from the employee list — name, designation, photo prefilled, all editable — or typed); agent photo; background photo; rank, period, total sale value; transactions, or primary + secondary; DLD QR. All required except rank and period (the headline drops the parts left empty).

Depends on: `_shared/` (font, export, remove-bg, bg-removal overlay, `PhotoDropzone`, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
