# listing — Just Sold / Just Listed / Just Rented

Entries: `just-sold.tsx`, `just-listed.tsx`, `just-rented.tsx` (same `ListingEditor`, different
`variant`). Renderer + locked geometry: `listing.ts` — originally measured from Figma
"Images-Vol.02" node 685:60, refined since against "Birthday-template" nodes 228:113
(Just Sold classic), 228:129 (Just Listed classic), 222:113 (Just Rented classic), 229:128
(Just Sold minimal), 229:159 (Just Listed minimal), 229:200 (Just Rented minimal),
1080×1440. Editor: `listing-editor.tsx`.

**Two DESIGNS, picked in the form, not the URL.** `state.design` is `"classic"` (the
original frosted-card layout, everything centred) or `"minimal"` (no card, no blur — the
wordmark and the agent/headshot block sit left-aligned, while the headline/tagline/chips/
listing line/price sit right-aligned in a column on the right; a smaller headshot floats free
near the foot). `renderListing()` dispatches to `renderClassic` / `renderMinimal`; each reads
one of four geometry constants (`LISTING`, `LISTING_CHIPS`, `LISTING_MINIMAL`,
`LISTING_CHIPS_MINIMAL` — see below). `MINIMAL_LEFT` / `MINIMAL_RIGHT` are the two column
edges every minimal element anchors to.

**Fields are shared across all three variants, but not all of them draw the same way:**

- **bedrooms, property type, location** — every variant composes these into one primary
  line: `"{bedrooms}-Bed {propertyType} in {location}"`.
- **bathrooms, sqft** — **Just Listed only.** There, bedrooms moves out of the line and
  into its own chip alongside bathrooms and sqft — three bordered pills, `"2 BED"` /
  `"7 BATHROOM"` / `"20,298 SQFT"` — and the line underneath drops to
  `"{propertyType} in {location}"`. `usesChips(variant)` is the one test; the Bathrooms/Sq ft
  inputs only render in the form when it's true.
- **listingLine — Just Listed only.** An optional free-text tagline (e.g. `"Largest Layout
  Corner 2BR | Spacious | Pool View"`) drawn directly under the headline, above the chip row.
  Same `usesChips(variant)` gate as bathrooms/sqft; the input only shows in the form for Just
  Listed, and the geometry constants only have a `tagline` key on `LISTING_CHIPS` /
  `LISTING_CHIPS_MINIMAL` (`"tagline" in L` is the render-time test, same pattern as `"chips"
  in L`).
- **price** — free text on every variant; Just Rented appends `" /year"` in the renderer
  (never typed by the user).

The chip row is its own small layout: auto-sized pills (`CHIP_STYLE` — 20px horizontal
padding, 10px radius, 0.5px border, 14px gap, Medium 17px tracked caps), left-aligned at the
card's column in classic Just Sold/Rented, and right-aligned to `MINIMAL_RIGHT` in minimal
Just Listed (`drawChipRow`'s `align: "left" | "center" | "right"`).

The frosted card (classic only) is drawn live so it blurs whatever photo is behind it; its
top edge moves to fit the chip row while its bottom edge (divider, agent block, QR) stays
put. In minimal, the headline and price also shrink for Just Listed (97px / 38px vs. 117px /
55px on Just Sold/Rented) to leave room for the tagline + chip row without pushing into the
agent block.

**Scrims.** Every scrim on both designs is the same shape — flat at `flatAlpha` opacity
through the first quarter (`flatTo`), then a straight linear fade to transparent by `h` —
drawn by the one `scrimGradient()` helper. This is measured directly off the scrim
rectangles in Figma (not an eased approximation), and differs by design because classic's
lower text sits on the frosted card while minimal's doesn't:

- **Classic** — one scrim behind the wordmark + headline (+ tagline on Just Listed);
  everything below that sits on the card, so nothing else is needed. `TOP_SCRIM` (419px) for
  Just Sold/Rented, the taller `TOP_SCRIM_CHIPS` (663px) for Just Listed since its tagline
  extends further down.
- **Minimal** — no card, so both ends of the text stack need their own contrast: `MINIMAL_SCRIM`
  (628px from the top, same for all three variants — Just Listed's headline/price run smaller
  to compensate for its denser stack) behind the headline→price column, plus
  `MINIMAL_BOTTOM_SCRIM` (357px, starting at y=1083, weaker at 60% flat opacity) behind the
  headshot/agent block near the foot. Its `flatTo` (0.8) runs past what's actually in Figma
  (0.24, which fades out by y≈1168 — above the agent name/title) so the flat run keeps the
  whole block, agent name and title included, protected on an evenly bright photo instead of
  just the top of the headshot.

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees` (`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select}`, `@/lib/utils`.

No artwork files — the photo is the background.
