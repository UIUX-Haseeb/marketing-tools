# events — Events

The CRM's **Events** screens with the event artwork made from the event's own fields, instead of three uploaded images. Mocked from the Figma sandbox (ProvToys-Templates › !Sandbox): Stage Page – Main, Stage Page – Popout, Add Event (Details, Schedule, Location, Links & media, Registration, Contact).

- **Stage page** — stat cards (they double as filters), search, event-type filter, Cards / List, sort by event date. Cards show the generated thumbnail.
- **Event details** (pop-out) — generated banner, header, About / Links / Schedule / Location / Registration / Dates, At a glance / Contact / Record, and **Flyer 9:16** download.
- **Add / Edit event** — six tabs. **Add event opens pre-filled** with a test sample (*Next sample* / *Start blank*). Links & media replaces the cover / banner / thumbnail uploads with the artwork controls: design (A · Navy panel, B · Full photo, C · Paper), photo (library strip with the linked project's photos first, or an upload; Size + drag), developer logo, which optional lines show, and PNG downloads for banner, thumbnail and flyer.
- **Demo data** — 15 events covering all seven types (Open House, Project Launch, Roadshow, Briefing, Webinar, Exhibition, Sales Event), in `data.ts`. Added / edited events are kept in this browser's localStorage (`store.ts`); **Reset demo** restores the seed.
- Downloads are recorded with `logGeneratedPost` (`@/lib/store`) — `tool` `events`, `templateId` `events-banner|thumb|flyer-a|b|c`.

## The artwork

| | Size | Shows |
| --- | --- | --- |
| **Banner** — inside page | 1143 × 420 (saved at 2×: 2286 × 840) | event type chips (max 2, then "+1"), title (2 lines, shrinks to fit), subtitle (optional), the date block, time (optional), venue · city (optional), Provident wordmark |
| **Thumbnail** — grid card | 443 × 243 (saved at 2×: 886 × 486) | one type chip, title, short date — the card prints title, date, status and place underneath, so the picture doesn't repeat them |

Never on either: description, registration, audience, contact, links, status.

**Flyer 9:16** (1080 × 1920, saved at 1×) — a story flyer in the event's design (A / B / C), with more on it than the banner: type chips, title, subtitle, the **short description**, the date block, time, venue with the **full address**, the **contact** (name · phone), and a footer with the **registration link** (or "Join online" + livestream for online events, "No registration needed" when it isn't). Anything left empty is left off, and the copy stacks up from the bottom so a sparse event gives the room to the photo. Download it from Links & media (*Flyer 9:16 PNG*, with its own preview, Size and drag) or from the Event details header (*Flyer 9:16*). Never on it: the full description, audience, status.

**Developer logo** — on Project Launch, Webinar, Briefing, Exhibition and Open House only (`LOGO_TYPES`). On the banner it pairs with the Provident wordmark as a lockup (developer logo | provident.); on the thumbnail it sits alone in the corner. The Links & media tab offers the linked developer's logo from the library (Location → Developer), an upload (SVG or PNG, printed white on navy / navy on paper) or none. The demo library — Emaar, Beyond, Imtiaz, Meeras — is in `public/tools/events/developers/` as white and navy copies of the brand files; library logos are sized to the same area, so a wide wordmark and a compact one carry the same weight.

Everything comes from fields the person already filled in — **Details** (title, subtitle, event type), **Schedule** (date, time, weekdays, timezone) and **Location** (venue, city, online). The Links & media tab only adds: **Design** (A · Navy panel, B · Full photo, C · Paper), **Photo** (a library strip with the linked project's photos first, or an upload; **Size** 1–3 and drag in either preview), and **Show on the banner** (subtitle / time / location). A checklist at the top says which source fields are set and jumps to the tab to fix one.

Date block rules (`format.ts › artDate`): one day → `14` + `OCT 2026` + `Wednesday`; a run in one month → `23–24` + `OCT 2026` + `Fri & Sat`; across months → `17 OCT – 1 NOV`; with weekdays picked → `Every Sat & Sun`; an end at 00:00 the next day counts as the same day ("9 AM – Midnight"); outside Dubai the time gets the city ("11 AM – 6 PM London time"); online events read "Online".

## Files

| File | What it does |
| --- | --- |
| `index.tsx` | Tool entry (the stage page) |
| `types.ts` | `EventRecord` (the form's fields + `artwork`), event types, sizes, designs, `LOGO_TYPES` |
| `data.ts` | Demo events, blank event, the Add event test samples |
| `photos.ts` | Demo photo library, developer-logo library, linked-record lists |
| `store.ts` | localStorage list (seed + added / edited) |
| `format.ts` | Dates, times, the artwork's date block and place line |
| `artwork.tsx` + `artwork.module.css` | Banner, thumbnail and flyer, three designs each; `<ScaledArt>` fits one to a box |
| `links-media.tsx` | Links & media tab: artwork controls, then the link fields |
| `event-form.tsx` | Add / Edit dialog, six tabs, validation, test samples |
| `stage-page.tsx`, `event-detail.tsx`, `ui.tsx` | Stage page, pop-out, small UI pieces |
| `exporter.ts` | Artwork → PNG (html-to-image); uploads → JPEG data URLs |
| `fit.tsx`, `uploads.tsx` | Copied from the Project Booklet |
| `sheet.tsx` (route `/sheet/events`) | Template sheet for review and Figma capture |

Assets: `public/tools/events/` — demo photos (copies of the booklet's project pictures), developer logos (white + navy), the Provident wordmarks used on the artwork, and the Google Sans Flex files the sheet registers for Figma.

The artwork accent is gold **#b0905b** (its own `--gold` token in `artwork.module.css`), not the Prov Toys orange.

## Figma

The main templates are in [ProvToys-Templates › Event Tools](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates?node-id=53-216) as editable layers: three frames side by side — *Event templates · A Navy panel*, *B Full photo* and *C Paper* — each with a section per event type. Each section holds that type's **Banner** (1143 × 420), **Thumbnail** (443 × 243) and **Flyer** (9:16, 1080 × 1920), filled with the type's demo event; on the five logo types the developer's logo is the layer *Developer logo (drop)*, inside *Logo lockup* on the banner. Edits made there are the reference for the next code change.

They were captured from `/sheet/events` (`sheet.tsx`; `?design=b` or `c` for the other designs, `&kind=flyer` for the flyers only — those were moved into each type's row) with Figma's html-to-design capture. The sheet registers the font files as **"Google Sans Flex"** so Figma maps them, and it captures `main` so the sheet lands as one frame. The capture script in `src/app/sheet/events/page.tsx` only acts on a URL with `#figmacapture=…`.

## Moving it into the CRM later

The CRM keeps its three image fields. On Save it would draw the banner and thumbnail (`artworkBlob`) and upload them as the banner / thumbnail images, and store `artwork` (design, photo, framing, toggles) with the event so **Edit** can redraw them when the title or dates change. Photos must be drawable by the browser (same origin, or served with CORS). The cover image ("used where the event is shown large") is left out of this test.
