# listing — Just Sold / Just Listed / Just Rented

Entries: `just-sold.tsx`, `just-listed.tsx`, `just-rented.tsx` (same `ListingEditor`, different
`variant`). Renderer + locked geometry: `listing.ts` — originally measured from Figma
"Images-Vol.02" node 685:60, refined since against "Birthday-template" nodes 228:113
(Just Sold classic), 228:129 (Just Listed classic), 222:113 (Just Rented classic), 229:128
(Just Sold minimal), 229:159 (Just Listed minimal), 229:200 (Just Rented minimal),
1080×1440. Editor: `listing-editor.tsx`.

**Two DESIGNS, picked in the form, not the URL.** `state.design` is `"classic"` (the
original frosted-card layout) or `"minimal"` (no card, no blur — content centred under the
headline, a smaller headshot floats free near the foot). `renderListing()` dispatches to
`renderClassic` / `renderMinimal`; each reads one of four geometry constants
(`LISTING`, `LISTING_CHIPS`, `LISTING_MINIMAL`, `LISTING_CHIPS_MINIMAL` — see below).

**Fields are shared across all three variants, but not all of them draw the same way:**

- **bedrooms, property type, location** — every variant composes these into one primary
  line: `"{bedrooms}-Bed {propertyType} in {location}"`.
- **bathrooms, sqft** — **Just Listed only.** There, bedrooms moves out of the line and
  into its own chip alongside bathrooms and sqft — three bordered pills, `"2 BED"` /
  `"7 BATHROOM"` / `"20,298 SQFT"` — and the line underneath drops to
  `"{propertyType} in {location}"`. `usesChips(variant)` is the one test; the Bathrooms/Sq ft
  inputs only render in the form when it's true.
- **price** — free text on every variant; Just Rented appends `" /year"` in the renderer
  (never typed by the user).

The chip row is its own small layout: auto-sized pills (`CHIP_STYLE` — 20px horizontal
padding, 10px radius, 0.5px border, 14px gap, Medium 17px tracked caps), left-aligned at the
card's column in `classic`, centred on the canvas in `minimal`.

The frosted card (classic only) is drawn live so it blurs whatever photo is behind it; its
top edge moves to fit the chip row while its bottom edge (divider, agent block, QR) stays
put. A navy scrim (`topScrim`, 520 px, eased to transparent) sits behind the wordmark +
headline on every design so they stay readable on white-sky photos.

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees` (`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select}`, `@/lib/utils`.

No artwork files — the photo is the background.
