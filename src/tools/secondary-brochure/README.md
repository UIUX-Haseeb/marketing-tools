# secondary-brochure — Secondary Brochure

The portal's **Company Listings** (portal.prov.ae › Listings › Company Listings) with a brochure made from the listings' own fields — the redesign of the portal's 2-page A4 listing flyer, at **4:5 (1080 × 1350)** like the Project Booklet.

- **Stage page** — laid out like the portal's: stat cards that filter (Approved, Sales / Rental, Rental, Exclusive), search by title or reference, List / Cards, and the **Listing details** pop-out (photos, title, price, place, beds / baths / size, description, amenities, agent, details, and the brochure's first page).
- **Brochure for one listing** — the pop-out's *Brochure* button.
- **Brochure for several listings** — tick them in the list (or *Select* for all shown) and press **Brochure (n)**: one PDF, one page per property, in the order you set.
- **The Brochure dialog** — design (A · Navy / B · White), the properties (reorder, remove; per property: the five pictures and its permit QR), the agent (demo employee list; mobile, email and BRN are placeholders until the CRM provides them), live preview, **Download PDF** (pages drawn at 2×). Downloads are logged with `logGeneratedPost` — `tool` `secondary-brochure`, `templateId` `secondary-brochure-a|b`.

## The pages

Kept to the old flyer's structure on purpose — short, and what agents know:

| Page | What's on it |
| --- | --- |
| **Property** (one per listing) | header: wordmark + "The place to begin your search for property in Dubai." and the agent (name, title, mobile, email, headshot) · five photos (two large, three small; property type + For Rent / For Sale on the first) · place line + the title (its `\|` / ` I ` separators turned into ` · `) · spec table: Reference, Bedrooms (beds · baths), Offering, Location, Property Type, Size (+ plot) · the first sentences of the description (≈330 characters, whole sentences) · the permit QR when uploaded · **Offered at** price (+ per year · cheques on rentals) · footer: trademark / copyright / ORN 1933 + page number |
| **Ask Us About** (once, last) | the upsell from the old flyer — Second Citizenship, Conveyancing, Currency, with its three photos (`public/tools/secondary-brochure/services/`, cropped from the old flyer) — then a *Contact our agent* card |

One listing → 2 pages, like the old flyer. N listings → N + 1 pages.

The description is free text the agents type; `real/index.ts` splits it into intro paragraphs, short feature lines and a location section, and drops "Company Name", "RERA ORN" and price lines (the brochure prints those itself). The property page uses the intro only; with no paragraph it writes one line from the fields.

## Data

`real/portal-listings.json` — **13 company listings** copied from the portal on 16 Oct 2026, picked for spread: rent and sale; studio to 5-bed; apartment, villa, townhouse; AED 70K to AED 25M; one with a floor plan (PS-1610268). Their pictures (the watermarked copies, up to 14 each, ≤1600 px) are in `public/tools/secondary-brochure/real/<reference>/`. Left out on purpose: the assigned agent, owners, unit numbers and permit records.

## Files

| File | What it does |
| --- | --- |
| `index.tsx` | Tool entry (the stage page) |
| `types.ts` | `Listing`, `Agent`, `Item` (listing + its five picture picks + QR), designs |
| `real/` | The portal listings and their mapping (`index.ts`: description split, title tags) |
| `format.ts` | Price, sizes, headline, place lines, spec rows |
| `pages.tsx` + `brochure.module.css` | The two pages, both designs, + `buildBrochure()` |
| `brochure-studio.tsx` | The Brochure dialog and `<Scaled>` (a page fitted to a box) |
| `stage-page.tsx`, `listing-detail.tsx`, `ui.tsx` | Stage page with selection, the pop-out, small UI pieces (copied from Events) |
| `exporter.ts`, `fit.tsx`, `wordmark.tsx`, `agent.ts` | Copied from the Project Booklet |
| `sheet.tsx` (route `/sheet/secondary`) | Template sheet for review and Figma capture: `?listing=<ref>` or `<ref>,<ref>,…` or `all`, `?design=a\|b` |

## Figma

[ProvToys-Templates › Secondary Brochures](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates?node-id=95-2) — both designs (property page + Ask Us About) for PR-09102610, captured from `/sheet/secondary` with Figma's html-to-design capture (the route loads the capture script; it only acts on a URL with `#figmacapture=…`). Edits made there are the reference for the next code change.
