# events — Events

The CRM's **Events** screens with the event artwork made from the event's own fields, instead of three uploaded images. Mocked from the Figma sandbox (ProvToys-Templates › !Sandbox): Stage Page – Main, Stage Page – Popout, Add Event (Details, Schedule, Location, Links & media, Registration, Contact).

- **Stage page** — laid out like the portal's (portal.prov.ae › Marketing › Events, Oct 2026): header with Select / Cards·List / Add event, stat cards that double as filters, a pill search with Filters / Clear all / Event date, cards with Staff only / Featured badges, the date, pills, place, registration and contact lines, and a list view with Event, Status, Type, Next date, Runs, Repeats and Venue columns. Cards show the generated thumbnail.
- **Event details** (pop-out) — generated banner, header, About / Links / Schedule / Location / Registration / Dates, At a glance / Contact / Record, and **Flyer 9:16** download.
- **Add / Edit event** — six tabs. **Add event opens pre-filled** with a test sample (*Next sample* / *Start blank*). Links & media replaces the cover / banner / thumbnail uploads with the artwork controls: design (A · Navy panel, B · Full photo, C · Paper), photo (library strip with the linked project's photos first, or an upload; Size + drag), developer logo, which optional lines show, and PNG downloads for banner, thumbnail and flyer.
- **Event Flyers** (`flyers.tsx`, its own tool: `/tools/event-flyers`, for agents) — the agents' side. Pick an event from the Events list (search; upcoming first, *Include past events*), choose **Story 9:16** or **Post 4:5** and a design, add your contact card, download. Everything on it comes from the event record, so nothing is retyped and marketing stays in charge of the event itself. Staff-only events get a lock and a "share privately" note. Logged as `tool` `event-flyers`, `templateId` `events-flyer|post-a|b|c`.
- **Real data** — the stage page's events are the **44 events from the portal** as they were on 16 Oct 2026 (`real/portal-events.json`, mapped in `real/index.ts`), with the pictures uploaded to them (`public/tools/events/real/`). Nothing is tidied: ALL CAPS titles, "TBA" venues, placeholder times, posters with their own text — that's what the artwork has to cope with. Added / edited events are kept in this browser's localStorage (`store.ts`, key `provtoys-events:v2`); **Reset** restores the seed.
- **Demo data** — the 15 made-up events covering all seven types (`DEMO_EVENTS` in `data.ts`) now only feed the Figma template sheet.
- Downloads are recorded with `logGeneratedPost` (`@/lib/store`) — `tool` `events`, `templateId` `events-banner|thumb|flyer-a|b|c`.

## The artwork

| | Size | Shows |
| --- | --- | --- |
| **Banner** — inside page | 1143 × 420 (saved at 2×: 2286 × 840) | event type chips (max 2, then "+1"), title (2 lines, shrinks to fit), subtitle (optional), the date block, time (optional), venue · city (optional), Provident wordmark |
| **Thumbnail** — grid card | 443 × 243 (saved at 2×: 886 × 486) | one type chip, title, short date — the card prints title, date, status and place underneath, so the picture doesn't repeat them |

Never on either: description, registration, audience, contact, links, status.

**Flyer 9:16** (1080 × 1920, saved at 1×) — a story flyer in the event's design (A / B / C), with more on it than the banner: type chips, title, subtitle, the **short description**, the date block, time, venue with the **full address**, the **contact** (name · phone), and a footer with the **registration link** (or "Join online" + livestream for online events, "No registration needed" when it isn't). Anything left empty is left off, and the copy stacks up from the bottom so a sparse event gives the room to the photo. Download it from Links & media (*Flyer 9:16 PNG*, with its own preview, Size and drag) or from the Event details header (*Flyer 9:16*). Never on it: the full description, audience, status.

**Post 4:5** (1080 × 1350, Event Flyers only) — the flyer's layout, shorter: type chips, title, subtitle, the date block, time, venue and address, then the contact card. No short description and no registration footer (the post's caption carries those). The photo always fills the post's width (no "whole picture" with blurred sides — a tall poster is cropped top and bottom instead); it takes the flyer's photo position but not its Size. All 44 real events fit in all three designs, with and without the card (`/sheet/events?kind=post`, or `?set=real` which now shows the post too).

**Personalised flyer** — *Add my contact card* (Links & media, under the flyer preview) puts the downloader's own card at the foot of the flyer, in place of the event contact. It's the **Project Booklet's agent card** (`project-booklet/social.tsx`, story size): round headshot, the name with the BRN at the right, the designation in tracked caps, then phone and email — a translucent panel on A and B, navy on C's paper. It belongs to the person, not the event: it's kept in this browser (`my-card.ts`, key `provtoys-events:my-card`) and used by every flyer download. It starts **on**, filled from the signed-in person. The Event details header's *Flyer 9:16* button opens a choice — *With my contact card* or *Without — event contact* — and remembers the last one. It's filled from the signed-in person — a demo employee picker here, with the booklet's placeholder phone, email and BRN; in the CRM, the user's profile. Every field can be overwritten and the photo replaced. The copy above the card tightens to make room; all 44 real events fit in all three designs. Downloads are logged with the `employeeId`.

**Developer logo** — on Project Launch, Webinar, Briefing, Exhibition and Open House only (`LOGO_TYPES`). On the banner it pairs with the Provident wordmark as a lockup (developer logo | provident.); on the thumbnail it sits alone in the corner. The Links & media tab offers the linked developer's logo from the library (Location → Developer), an upload (SVG or PNG, printed white on navy / navy on paper) or none. The demo library — Emaar, Beyond, Imtiaz, Meeras — is in `public/tools/events/developers/` as white and navy copies of the brand files; library logos are sized to the same area, so a wide wordmark and a compact one carry the same weight.

Everything comes from fields the person already filled in — **Details** (title, subtitle, event type), **Schedule** (date, time, weekdays, timezone) and **Location** (venue, city, online). The Links & media tab only adds: **Design** (A · Navy panel, B · Full photo, C · Paper), **Photo** (a library strip with the linked project's photos first, or an upload; **Size** 1–3 and drag in either preview), and **Show on the banner** (subtitle / time / location). A checklist at the top says which source fields are set and jumps to the tab to fix one.

### What the real data taught it

- **Photo fit** (Links & media › *Photo fit*: Auto / Fill the frame / Whole picture). Uploaded pictures are any shape — square posters, tall flyers, panoramas. On *Auto*, a photo that would lose more than a third to the crop is shown whole on a blurred, darkened copy of itself instead of being cut. The tab warns when the photo is narrower than the banner (it will look soft).
- **Tidy ALL CAPS title** (on by default) — a title typed mostly in capitals is set in Title Case on the artwork (acronyms, numbers and mixed-case words are kept); the record isn't changed. "(TENTATIVE DATE)" is taken out of the title and the date reads "Date to be confirmed".
- **Placeholder times** — a start before 6 AM is treated as "no time given" and left off; an end at midnight reads "From 7 PM"; a dates-only run (00:00 → 00:00) keeps its last day.
- **Junk venues** — TBA / TBC read "Venue to be announced", anything with "online" reads "Online"; long links on the flyer are cut to the host name.
- **Developer logo** — when no developer is linked (the portal never links one), a library developer named in the title (Emaar, Beyond, Imtiaz, Meeras) is used.
- `/sheet/events?set=real&design=a|b|c` draws every real event's banner, thumbnail and flyer on one page for checking; add `&agent=1` for the flyers with a demo contact card.

Date block rules (`format.ts › artDate`): one day → `14` + `OCT 2026` + `Wednesday`; a run in one month → `23–24` + `OCT 2026` + `Fri & Sat`; across months → `17 OCT – 1 NOV`; with weekdays picked → `Every Sat & Sun`; an end at 00:00 the next day counts as the same day ("9 AM – Midnight"); outside Dubai the time gets the city ("11 AM – 6 PM London time"); online events read "Online".

## Files

| File | What it does |
| --- | --- |
| `index.tsx` | Tool entry (the stage page) |
| `types.ts` | `EventRecord` (the form's fields + `artwork`), event types, sizes, designs, `LOGO_TYPES` |
| `real/` | The portal's events (`portal-events.json`) and their mapping to `EventRecord` (`index.ts`) |
| `data.ts` | Demo events (sheet only), blank event, the Add event test samples |
| `photos.ts` | Demo photo library, developer-logo library, linked-record lists |
| `store.ts` | localStorage list (seed + added / edited) |
| `format.ts` | Dates, times, the artwork's date block and place line |
| `artwork.tsx` + `artwork.module.css` | Banner, thumbnail and flyer, three designs each; `<ScaledArt>` fits one to a box |
| `links-media.tsx` | Links & media tab: artwork controls, then the link fields |
| `my-card.ts`, `my-card-panel.tsx` | The downloader's contact card for the flyer, and its controls |
| `flyers.tsx` | Event Flyers — the agents' page (registered as its own tool, `event-flyers`) |
| `event-form.tsx` | Add / Edit dialog, six tabs, validation, test samples |
| `stage-page.tsx`, `event-detail.tsx`, `ui.tsx` | Stage page, pop-out, small UI pieces |
| `exporter.ts` | Artwork → PNG (html-to-image); uploads → JPEG data URLs |
| `fit.tsx`, `uploads.tsx` | Copied from the Project Booklet |
| `sheet.tsx` (route `/sheet/events`) | Template sheet for review and Figma capture |

Assets: `public/tools/events/` — the real events' pictures (`real/`), demo photos (copies of the booklet's project pictures), developer logos (white + navy), the Provident wordmarks used on the artwork, and the Google Sans Flex files the sheet registers for Figma.

The artwork accent is gold **#b0905b** (its own `--gold` token in `artwork.module.css`), not the Prov Toys orange.

## Figma

The main templates are in [ProvToys-Templates › Event Tools](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates?node-id=53-216) as editable layers: three frames side by side — *Event templates · A Navy panel*, *B Full photo* and *C Paper* — each with a section per event type. Each section holds that type's **Banner** (1143 × 420), **Thumbnail** (443 × 243) and **Flyer** (9:16, 1080 × 1920), filled with the type's demo event; on the five logo types the developer's logo is the layer *Developer logo (drop)*, inside *Logo lockup* on the banner. Edits made there are the reference for the next code change.

They were captured from `/sheet/events` (`sheet.tsx`; `?design=b` or `c` for the other designs, `&kind=flyer` for the flyers only — those were moved into each type's row) with Figma's html-to-design capture. The sheet registers the font files as **"Google Sans Flex"** so Figma maps them, and it captures `main` so the sheet lands as one frame. The capture script in `src/app/sheet/events/page.tsx` only acts on a URL with `#figmacapture=…`.

## Moving it into the CRM later

The CRM keeps its three image fields. On Save it would draw the banner and thumbnail (`artworkBlob`) and upload them as the banner / thumbnail images, and store `artwork` (design, photo, framing, toggles) with the event so **Edit** can redraw them when the title or dates change. Photos must be drawable by the browser (same origin, or served with CORS). The cover image ("used where the event is shown large") is left out of this test.
