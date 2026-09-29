# project-booklet — Project Booklet

Pick a **Source** — *Dubai Offplan* (offplan-dubai.com) or *Abu Dhabi Offplan* (abudhabipropertyhub.com) — and one of its saved projects (the **Project** dropdown; pages stored with the build, see [Saved projects](#saved-projects)) → every project field fills in → make one of:

| Make | What | Download |
| --- | --- | --- |
| **PDF brochure** | 4:5 pages (1080 × 1350), design **A · Paper & navy** or **B · White** | one PDF, pages drawn at 2× |
| **Social media post → Single post** | **Feed 4:5** (1080 × 1350) or **Story 9:16** (1080 × 1920), design **A · Stacked** or **B · Split** — as refined in Figma | one JPG |
| **Social media post → Carousel** | 4:5 slides (cover with SWIPE › … agent contact), design **A · Navy** (Organic Post Studio) or **B · White** | a ZIP of JPGs |

Project fields are locked by default; **Adjust fields** unlocks all of them, and picking another project replaces edits and locks them again. Only the fields the chosen output uses are listed — the feed post shows *Name & key figures* and *Project details*, the story adds *Amenities*, the carousel shows the eight sections its slides read, the brochure all of them. The **Agent** and permit QR sections are the Prov Toys listing tools' own (same demo employee list, name/designation counters, headshot upload + Size, QR upload) and are always editable; the QR section reads **DLD QR code** on a Dubai project and **Permit QR code** on an Abu Dhabi one. Downloads wait for the agent's name, headshot and the permit QR. The location line on every layout is the page's location plus the source's city — "Al Jaddaf · Dubai", "Yas Island · Abu Dhabi".

**Photo** (social posts): the listing tools' photo controls — a strip of every picture in the project (hero, gallery, developer, area, thumbnail), an upload for your own (it joins the strip, marked *Yours*), **Size** 1–3 and **drag in the preview** to move it. The single post has one photo, shared by feed and story; on a carousel the panel follows the slide on screen, the gallery slide has four pictures to set one by one, and a slide without a photo says so and links the ones that have one.

| File | What it does |
| --- | --- |
| `projects/` | The saved projects: one JSON per page (`data` is its `ProjectData`, `sources` maps each saved picture to the site's original) + `index.ts`, the two sources and each one's list (the Source choice and the dropdown's order). Made by `npm run snapshot`; don't hand-edit. |
| `scrape.ts` | The two sites (`SITES`: host → name, city), link check, fetch, HTML → `ProjectData`. Used by `scripts/snapshot-projects.mjs` in plain Node — the tool itself never reads the sites. |
| `types.ts` | `ProjectData`, `Agent`, outputs, image slots and their default picks. |
| `pages.tsx` + `booklet.module.css` | The brochure, both designs, + `buildBooklet()`. |
| `social.tsx` + `social.module.css` | Single post (feed / story) + carousel, both designs each, `buildSingle()` / `buildCarousel()`. Every photo sits in a `data-frame` element the picker and the drag work on; each built page lists its frames. |
| `exporter.ts` | Page → canvas (html-to-image), PDF writer, ZIP (`zip.ts`, copied from Prov Toys), download. |
| `uploads.tsx` | PhotoDropzone / Counter / SizeRow — copied from Prov Toys. |
| `fit.tsx` | Shrinks long copy to fit its box and flags it for the notes list. |
| `icons.ts` | Amenity / detail label → line icon, by keyword. |
| `booklet-tool.tsx` | Editor: pickers, project dropdown, photo panel + preview drag, locked fields (filtered per output), agent, DLD QR, download, preview, notes. Each download is recorded with `logGeneratedPost` (`@/lib/store`) like the post tools — `templateId` `project-booklet-brochure-a/b`, `-feed-a/b`, `-story-a/b` or `-carousel-a/b`. |
| `sheet.tsx` (route `/sheet`) | Template sheet: every social design at full size for one saved project — single post A / B (feed + story), carousel A and B slide by slide — for review and for capturing into Figma. `?project=<id>`, `?row=single\|carousel-a\|carousel-b`. |
| `agent.ts` | The agent from the demo employee list (shared by the editor and the sheet). |

## Field mapping (site → booklet)

Every project page on both sites is the same WordPress template, so each field is one selector:

| Field | Selector | Notes |
| --- | --- | --- |
| Name, developer | `.pdp-hero__title`, `.pdp-hero__developer a` | |
| City | the page's site | "Dubai" (offplan-dubai.com) or "Abu Dhabi" (abudhabipropertyhub.com) — follows the location on every layout |
| Cover figures | `.pdp-hero__stat` (label / value) | up to 3 |
| Hero banner | `.pdp-hero__media img` | 1905×503 banner on offplan-dubai.com, 1920×700 on abudhabipropertyhub.com — too short to fill a portrait page sharply |
| Overview | "Project Overview" section `.section-content > p` | `<strong>` kept as `**bold**` |
| Highlights | `.pdp-highlights-list li` (`<strong>` title – text) | some pages use one comma-separated `<p>` or "Title – text" lines instead, and some put the dash inside the bold title; all are handled |
| Details | `.pdp-detail` (label / value) | "Location" also feeds the cover |
| Gallery | `.pdp-gallery-section [data-full]` | resized `-1024x512` suffix stripped → original (1382×691 on Eleve) |
| Amenities | `.pdp-section__subtitle`, `.amenity-name` | names longer than 60 characters or ending in a full stop are dropped (a few pages put sentences there) |
| Payment plan | `.pdp-payment-step` title + "70% of total price (AED …)", `.pdp-payment-note` | |
| Location | section `.section-content > p` + `li` | distances read as "12 minutes – Place" or "Place – 5 Minutes" |
| Map | `.location-map-image` | offplan-dubai.com shows the same generic Dubai map on most projects, abudhabipropertyhub.com one per project; rounded corners are cropped |
| Investment | `.pdp-investment` subtitle, `.pdp-stat`, `.pdp-investment__list li` | |
| Financing | `.pdp-financing__grid li` | |
| Developer | `.pdp-developer__logo / __desc / __media img` | missing on some pages; cut-off "…" text ends on the last full sentence |
| Unit types | `.floorplan-accordion-item` title + "Area" / "Starting Price" meta | saved, not in the layouts yet; area / price only where the page gives them (the plan drawings themselves are behind the site's enquiry form) |
| Area card | `.pdp-area__title / __desc / __bg` | saved, not in the layouts yet; only some pages have one |
| FAQ | `.pdp-faq-item` question / answer | saved, not in the layouts yet |
| Thumbnail | `meta[property="og:image"]` | the page's 538 × 323 listing picture |

Images use `data-lazy-src` first (the site lazy-loads). Not saved: the "Similar Projects" cards (other projects) and the site's own icons.

## Saved projects

`npm run snapshot` re-saves every project in `projects/` from its site; `npm run snapshot -- <link> …` saves new links from either site (then list them under their source in `projects/index.ts`). Each run replaces that project's JSON and its picture folder, `public/tools/project-booklet/projects/<id>/` — `hero`, `gallery-01…`, `map`, `developer-logo`, `developer`, `area`, `thumbnail`, originals at full size. A picture the gallery lists twice is kept once. SVG logos with scripts or event handlers are refused, since the pictures are served from the app's own origin.

**Dubai Offplan** (offplan-dubai.com)

| Project | Saved | Pictures | Notes |
| --- | --- | --- | --- |
| Binghatti Spectre · Binghatti | 25 Sep 2026 | 14 (8 in the gallery) | the only one with an area card (About Al Jaddaf) |
| The Archive · Imtiaz Developments | 25 Sep 2026 | 13 (8) | its own map; no exterior in the gallery; unit types without sizes |
| Samana Business Hub · Samana Developers | 25 Sep 2026 | 12 (7) | the site gallery repeats one office picture; a commercial project (offices and retail) |

**Abu Dhabi Offplan** (abudhabipropertyhub.com)

| Project | Saved | Pictures | Notes |
| --- | --- | --- | --- |
| Wadeem Gardens · Modon Properties | 29 Sep 2026 | 11 (6 in the gallery) | the smallest gallery, so a few brochure slots repeat a picture until you pick others; no area card |
| Yas Riva Reserve · Aldar Properties | 29 Sep 2026 | 14 (8) | area card (About Yas Island); the page lists no distances, so its location pages have the paragraph and map without a distance list |
| Talay Marsa · Aldar Properties | 29 Sep 2026 | 14 (8) | area card (About Saadiyat Island); 16 amenities; its unit types give sizes per collection rather than prices |

On all six pages "Size Range" reads 850 – 3,200 sq.ft, which looks like the sites' default rather than the project's — the unit types carry the real sizes where the page has them.

## Layout rules

- **Radius:** the brand book sets none for layout (only "a small rounded square" for the QR), so one radius, `--r: 16px`, on everything inside the margins; edge-to-edge bands stay square. The studios use 14–28 at 1080 wide.
- **Brochure cover:** both designs open on the same picture (the site's hero); changing the cover under Pictures changes both.
- **Single post** — the Figma refinement (frames *Single · Feed 4:5 / Story 9:16 · A Stacked / B Split*), numbers taken from its layers. Both formats show location, name (85), developer, starting price, property type and payment plan, and the agent; the story adds up to four amenity chips (shortest first, rows 847 wide). Both designs close on the same **agent card** (white 12%, radius 20, padding 30): the headshot (134 on the feed, 170 on the story), the name with "BRN: …" at the right, the designation, then phone and email. Line heights are rounded up to the pixel as Figma draws its text boxes, and spaced caps drop the spacing CSS adds after their last letter, so every block lands where the frames have it.
  - **A · Stacked**: the photo across the top (755 of the feed, 968 of the story); at its foot one group on a navy gradient sized to the group (clear at its top edge, solid a quarter of the way down on the feed, a fifth on the story) — a glass card (navy 50%, blur 20, white 30% hairline, radius 30, padding 40) with the location in brass caps, the name (59 on the feed, 71 on the story), the developer — at the right end of the name's line on the feed (dropping under the name when both don't fit, so a long name keeps to one line), under it on the story — and the figures (feed: price · plan · type at 42, its first and third columns at least the frame's 277 / 324 wide; story: price · type · plan, then the chips), the agent card under it (the feed's designation in brass), then the wordmark bottom left and the QR bottom right.
  - **B · Split**: the photo across the top (610 of the feed, 926 of the story); at its foot one centred group on a navy gradient that closes in quickly (solid 15% of the way down on the feed, 13% on the story; padding 100) — the cream location tag, the name at 71, the developer in brass, the figures (price · type · plan; the feed's values at 41) and on the story the chips, then the agent card, then the wordmark bottom left and the QR bottom right.
  - The story's wordmark / QR row and agent sit where the design put them, inside the bands Reels overlays with its own UI (the studio's safe area was 260 top / 460 bottom).
- **Shade behind copy on the carousel** (cover, amenities slide): sized to the copy — it starts 250px above the copy block and follows it (Organic's rule), so a two-line name or a longer list lifts the shade with it. The top shade behind the wordmark stays fixed.
- **Carousel** (Organic Post Studio `CS`): 105 / 94 insets, top blocks 158 down, bottom blocks 219 up, SWIPE › on every slide but the last, brass eyebrow on inside pages, stats grid on the canvas axis, bullets column 472, the closing card (28 radius, brass rule) holds the agent and the QR. Slides whose section is missing are left out.
- **Carousel B · White**: the same slides and grid on white in Campaign's light inks (`PAL.light`: navy, slate, grey, navy hairlines, brass eyebrows) and no washes — the cover's photo takes whatever the copy leaves (brochure B's cover), the overview puts a rounded photo under its text, amenities a portrait photo beside the list, property type a photo band, details / payment / location / investment / developer are white pages (the developer logo in its own colours), the agent card turns white over its photo.
- **Pictures:** each output has its own slots — the brochure's in the Pictures section (after unlocking), the social posts' in the Photo panel. Defaults are fixed gallery positions; a missing position takes the next unused picture. A social photo's zoom and position are stored as `{ zoom, x, y }` (the point shown, 0–1 each way), so one setting suits the feed and the story; picking or uploading a picture resets them.
- **Long copy** shrinks to fit (down to ~62%); if it still doesn't fit it's cut and the layout notes say so.
- The agent comes from the demo employee list; mobile, email and BRN are placeholders until the CRM provides them.

## Figma

The social designs live as editable layers in Figma — [ProvToys-Templates](https://www.figma.com/design/HCABfiwAEynJOq69sx3arO/ProvToys-Templates), Page 1: sections *Single post*, *Carousel A · Navy* and *Carousel B · White* (Binghatti Spectre, with a sample QR), one 1080-wide frame per design, named as on the sheet. Refinements made there are the reference for the next code change — the single posts already follow the refined frames.

They were captured from `/sheet?row=…` with Figma's html-to-design capture (the Figma MCP's `generate_figma_design`). Two things make a capture faithful: register the page's font files under the name **"Google Sans Flex"** first (next/font serves them as `googleSansFlex`, which Figma can't map), and capture `main` so each row lands as one frame. The captures were then moved into the sections and their layers renamed (Photo, Shade, Group · …, Box · …, Fit · … = copy that shrinks to fit).

