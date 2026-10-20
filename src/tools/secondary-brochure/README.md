# secondary-brochure — Secondary Brochure

The portal's **Company Listings** (portal.prov.ae › Listings › Company Listings) with a brochure made from the listings' own fields — the redesign of the portal's 2-page A4 listing flyer, at **4:5 (1080 × 1350)** like the Project Booklet.

- **Stage page** — laid out like the portal's: stat cards that filter (Approved, Sales / Rental, Rental, Exclusive), search by title or reference, List / Cards, and the **Listing details** pop-out (photos, title, price, place, beds / baths / size, description, amenities, agent, details, and the brochure's first page).
- **Brochure for one listing** — the pop-out's *Brochure* button.
- **Brochure for several listings** — tick them in the list (or *Select* for all shown) and press **Brochure (n)**: one PDF, one page per property, in the order you set.
- **The Brochure dialog** — design (A · Navy / B · White), the properties (reorder, remove; per property: the five pictures and its permit QR), the agent (demo employee list; mobile, email and BRN are placeholders until the CRM provides them), live preview, **Download PDF** (pages drawn at 2×). Downloads are logged with `logGeneratedPost` — `tool` `secondary-brochure`, `templateId` `secondary-brochure-a|b`.

## The pages

In the Project Booklet's look ([Figma › Brochure A · Paper & navy](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates?node-id=51-113)) — 80 px margins, gold kicker + rule, light Google Sans Flex, 16 px radius, tracked-caps footer — but kept short like the old flyer:

| Page | What's on it |
| --- | --- |
| **Property** (one per listing) | a full-width photo mosaic across the top — one large photo (two-thirds wide) and two stacked beside it, edge to edge — with the wordmark; then a quiet filled *For Sale* / *For Rent* chip (translucent on navy, paper on white) and the location in a pill (outlined like the story chips, Material *location_on* icon in gold), the title's tags as the headline ("Fully Furnished · Ready To Move · Mid Floor", up to two lines), the property in gold ("1-Bedroom Apartment"), the key figures (see below), the permit QR beside the headline when one is uploaded, and the footer with the **property ID** (*Property ID · PR-09102610*) |
| **Ask Us About** (once, last) | the booklet's closing page (bridge photo): the upsell — Second Citizenship, Conveyancing, Currency, with the old flyer's three photos (`public/tools/secondary-brochure/services/`) — then the agent (name, title, mobile, email, BRN, headshot) and the company line |

**A · Navy** is the booklet's navy cover; **B · White** puts the same page on white (the booklet's B).

**The portal's watermark.** Every listing picture has "provident." stamped into its lower left (the originals too), which doubled up with the brochure's own wordmark. The large photo defaults to the framing picked in review — zoom 1.15, anchored bottom right (`HIDE_LOGO` in `types.ts`) — and the two small ones are shown whole. (Removing the stamp outright was tried — reversing the blend, inpainting — and left visible ghosts, so it was dropped.) For a picture where the stamp sits elsewhere, the Brochure dialog's **Large** picture has *Hide portal logo* / *Whole photo* and **Zoom / Across / Down** sliders.

One listing → 2 pages, like the old flyer. N listings → N + 1 pages.

The description is free text the agents type; `real/index.ts` splits it into intro paragraphs, short feature lines and a location section, and drops "Company Name", "RERA ORN" and price lines (the brochure prints those itself). The property page uses the intro only; with no paragraph it writes one line from the fields.

## Residential and commercial

Each listing carries `segment` (Residential / Commercial, from the portal's offering type) and the brochure page reads its own listing, so **one brochure can mix property types** — a 1-bed apartment, a co-working space and a business centre each get the same page layout with their own figures:

| | Residential | Commercial |
| --- | --- | --- |
| Headline | "1-Bedroom Apartment", "Studio Apartment" | the space type: "Co-working Space", "Business Centre" |
| Key figures (`keyFigures` in `format.ts`) | price · bedrooms · bathrooms · built-up (· plot) | price, then up to three of size · fit-out · plot · payment — whichever the listing has |
| Bedrooms / bathrooms | as the portal has them | ignored — the portal's co-working entries carry junk there ("10+", "20") |

The pop-out and the list follow the same rule (no bed / bath boxes on commercial, the portal's offering wording, Draft / Rejected status pills). The Brochure dialog notes when a brochure mixes types.

## Data

`real/portal-listings.json` — **13 company listings** copied from the portal: ten residential (16 Oct 2026 — rent and sale; studio to 5-bed; apartment, villa, townhouse; AED 70K to AED 25M; one with a floor plan, PS-1610268) and three commercial (19 Oct 2026, the portal filtered to commercial property types — two co-working spaces and a business centre, Draft / Rejected, one with no description). Their pictures (the watermarked copies, up to 14 each, ≤1600 px) are in `public/tools/secondary-brochure/real/<reference>/`. Left out on purpose: the assigned agent, owners, unit numbers and permit records.

## Files

| File | What it does |
| --- | --- |
| `index.tsx` | Tool entry (the stage page) |
| `types.ts` | `Listing`, `Agent`, `Item` (listing + its five picture picks + QR), designs |
| `real/` | The portal listings and their mapping (`index.ts`: description split, title tags) |
| `format.ts` | Price, sizes, headline, place lines, spec rows |
| `pages.tsx` + `brochure.module.css` | The property page and the closing page, both designs, + `buildBrochure()` |
| `brochure-studio.tsx` | The Brochure dialog and `<Scaled>` (a page fitted to a box) |
| `stage-page.tsx`, `listing-detail.tsx`, `ui.tsx` | Stage page with selection, the pop-out, small UI pieces (copied from Events) |
| `exporter.ts`, `fit.tsx`, `wordmark.tsx`, `agent.ts` | Copied from the Project Booklet |
| `sheet.tsx` (route `/sheet/secondary`) | Template sheet for review and Figma capture: `?listing=<ref>` or `<ref>,<ref>,…` or `all`, `?design=a\|b` |

## Figma

[ProvToys-Templates › Secondary Brochures](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates?node-id=95-2) — both designs (property page + Ask Us About) for PR-09102610 in the booklet style, captured from `/sheet/secondary` with Figma's html-to-design capture (the route loads the capture script; it only acts on a URL with `#figmacapture=…`). Edits made there are the reference for the next code change.
