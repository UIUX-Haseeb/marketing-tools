# listing — Just Sold / Just Listed

Entries: `just-sold.tsx`, `just-listed.tsx` (same `ListingEditor`, different headline). Renderer + locked geometry: `listing.ts` (measured from Figma "Images-Vol.02" node 685:60, 1080×1440). Editor: `listing-editor.tsx`.

Fields: property photo (cover, size slider, drag to move), listing line, price, agent (prefilled from the employee list, editable; headshot with size slider, drag inside the circle to move), **DLD permit QR image (mandatory)**. The frosted card is drawn live so it blurs whatever photo is behind it. A navy scrim (`LISTING.topScrim`, 520 px, eased to transparent) sits behind the wordmark + headline so they stay readable on white-sky photos.

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees` (`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select}`, `@/lib/utils`.

No artwork files — the photo is the background.
