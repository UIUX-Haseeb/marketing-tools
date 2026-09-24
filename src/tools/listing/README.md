# listing — Just Sold / Just Listed / Just Rented

Entries: `just-sold.tsx`, `just-listed.tsx`, `just-rented.tsx` (same `ListingEditor`, different
`variant`). Renderer + locked geometry: `listing.ts` — originally measured from Figma
"Images-Vol.02" node 685:60, refined since against "Birthday-template" nodes 228:113
(Just Sold classic post), 228:129 (Just Listed classic post), 222:113 (Just Rented classic
post), 229:128 (Just Sold minimal post), 229:159 (Just Listed minimal post), 229:200 (Just
Rented minimal post), 265:311 (Just Sold classic story), 265:239 (Just Listed classic story),
265:283 (Just Rented classic story), 265:373 (Just Sold minimal story), 265:210 (Just Listed
minimal story), 265:344 (Just Rented minimal story). Editor: `listing-editor.tsx`.

**Two DESIGNS × two FORMATS, both picked in the form, not the URL.** `state.design` is
`"classic"` (the original frosted-card layout, everything centred) or `"minimal"` (no card,
no blur — the wordmark and the agent/headshot block sit at one edge, the headline/tagline/
chips/listing line/price sit in a column anchored to the other). `state.format` is `"post"`
(1080×1440) or `"story"` (1080×1920, more headroom above the card/text block, and — minimal
only — the text column moves to share the wordmark's edge instead of sitting opposite it).
`renderListing()` dispatches to `renderClassic` / `renderMinimal`; each picks one of four
geometry constants via `classicGeometryFor()` / `minimalGeometryFor()` — `LISTING` /
`LISTING_CHIPS` (classic post), `LISTING_STORY` / `LISTING_CHIPS_STORY` (classic story),
`LISTING_MINIMAL` / `LISTING_CHIPS_MINIMAL` (minimal post), `LISTING_MINIMAL_STORY` /
`LISTING_CHIPS_MINIMAL_STORY` (minimal story) — eight in total. `canvasSize(format)` gives
the pixel dimensions; every render/export/preview call site reads that instead of a hardcoded
`LISTING.width`/`height`. `MINIMAL_LEFT` / `MINIMAL_RIGHT` are the two column edges minimal's
elements anchor to; each minimal geometry constant's `col: { x, align }` says which edge and
which direction that particular variant/format uses.

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
  Listed, and the geometry constants only have a `tagline` key on the four Just-Listed
  constants (`"tagline" in L` is the render-time test, same pattern as `"chips" in L`).
- **price** — free text on every variant; Just Rented appends `" /year"` in the renderer
  (never typed by the user).

The chip row is its own small layout: auto-sized pills (`CHIP_STYLE` — 20px horizontal
padding, 10px radius, 0.5px border, 14px gap, Medium 17px tracked caps), anchored to
`L.col.x` and using `L.col.align` — left in classic and minimal-story, right in minimal-post
(`drawChipRow`'s `align: "left" | "center" | "right"`).

The frosted card (classic only) is drawn live so it blurs whatever photo is behind it; its
top edge moves to fit the chip row while its bottom edge (divider, agent block) stays put —
except the QR tile, which on "story" detaches from the card entirely and sits as its own
centred tile below it (same x/y regardless of variant, since the card's height differs but
the tile doesn't need to track it). In minimal post, the headline and price also shrink for
Just Listed (97px / 38px vs. 117px / 55px on Just Sold/Rented) to leave room for the tagline +
chip row without pushing into the agent block — and on "story" specifically, the whole minimal
text column sits well below the wordmark (y=233 vs. y=91 on "post") because "post" could
place the headline right next to the wordmark only by keeping them in separate left/right
columns; "story" puts both on the same left edge, so they need the vertical gap instead.

Minimal story's own text also runs larger across the board than post's — wordmark, headline,
primary and price all got individually re-sized in Figma (not a single scale factor: price
went from 55/38px to a shared 66px on both variants, primary from 27px to a shared 38px,
while headline and wordmark moved by a more modest ~1.2×), so every size in
`LISTING_MINIMAL_STORY` / `LISTING_CHIPS_MINIMAL_STORY` is its own measured value. Just
Listed's agent/headshot/QR block also moved independently of Just Sold/Rented's this time —
about 27px higher, with a taller scrim to match (`MINIMAL_BOTTOM_SCRIM_CHIPS_STORY`,
`HEADSHOT_BOX_MINIMAL_CHIPS_STORY`) — where every other minimal variant/format shares one
block position across chips/non-chips.

**Scrims.** Every scrim on both designs is the same shape — flat at `flatAlpha` opacity
through the first quarter (`flatTo`), then a straight linear fade to transparent by `h` —
drawn by the one `scrimGradient()` helper. This is measured directly off the scrim
rectangles in Figma (not an eased approximation), and differs by design because classic's
lower text sits on the frosted card while minimal's doesn't. Heights differ by format too —
taller canvas, more empty space, taller scrim — and don't always scale predictably, so each
is its own measured constant rather than a formula:

- **Classic** — one scrim behind the wordmark + headline (+ tagline on Just Listed);
  everything below that sits on the card, so nothing else is needed. `TOP_SCRIM` (419px) for
  Just Sold/Rented post *and* story (identical in Figma — the card block moves but this
  doesn't); `TOP_SCRIM_CHIPS` (663px) for Just Listed post, `TOP_SCRIM_CHIPS_STORY` (884px)
  for Just Listed story.
- **Minimal** — no card, so both ends of the text stack need their own contrast:
  `MINIMAL_SCRIM` (628px, post, both variants) / `MINIMAL_SCRIM_STORY` (762px, story Just
  Sold/Rented) / `MINIMAL_SCRIM_CHIPS_STORY` (1040px, story Just Listed) behind the
  headline→price column, plus `MINIMAL_BOTTOM_SCRIM` / `MINIMAL_BOTTOM_SCRIM_STORY` (357px,
  weaker at 60% flat opacity, y=1083 post / y=1565 story) behind the headshot/agent block near
  the foot, grounded against the bottom edge (`scrimGradient`'s `anchor: "bottom"` — solid at
  `y + h`, fading out going up into the photo, the mirror of every other scrim here which is
  solid at the top and fades going down). Its `flatTo` (0.8) runs past what's actually in
  Figma (0.24, which fades out well above the agent name/title) so the flat run keeps the
  whole block, agent name and title included, protected on an evenly bright photo instead of
  just the top of the headshot.

Depends on: `_shared/` (font, render helpers, export, `PhotoDropzone`, `Counter`), `@/lib/demo/employees` (`EMPLOYEES` — replace with the CRM), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label,select}`, `@/lib/utils`.

No artwork files — the photo is the background.
