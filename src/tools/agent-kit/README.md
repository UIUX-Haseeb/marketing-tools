# agent-kit — Agent Download Kit

Entry: `index.tsx`, four tabs (`tabs.tsx`): **Documents & banners** and **Logos** — everything listed
in `kit.ts` (edit that list to add or swap an item) — **Business card** and **E-business card**. The slug stays
`agent-kit` so existing links keep working.

- **Documents** (Company Profile, Investment Guide) stay on Google Drive. Each card shows a
  brochure mockup (`public/tools/agent-kit/company-profile.jpg`, `investment-guide.jpg`) that
  opens the PDF in Drive, plus a Download button (`drive.google.com/uc?export=download&id=…`) and
  an Open in Drive button. The files are shared with the providentestate.com domain only, so
  agents must be signed in to their Provident Google account.
- **Banners** are static files in `public/tools/agent-kit/` — LinkedIn 1584 × 396, Facebook
  1702 × 630 — downloaded as-is with the `download` attribute. Replace the PNG to update one
  (keep the size in `kit.ts` in step).

## Logos (`logos.tsx`)

The Provident logo from the brand folder on Drive (`LOGO_FOLDER` in `kit.ts`), copied into
`public/tools/agent-kit/logos/` so the previews and downloads work without a Google sign-in:
wordmark and logo mark ("p."), each navy and white, as PNG (transparent), JPG (logo on an
800 × 800 white or navy square) and PDF (the same square, in vector — printed
from the Drive SVG with headless Chrome). Each tile previews the PNG on the background it's meant for. The
mark's files were re-rendered from the Drive SVG with its stray dashed outline removed. To change a
logo, replace the files — names are `<stem>.<png|jpg|pdf>` — and keep `KIT_LOGOS` in step.

## Business card (`business-card/`)

The portal's Business Card page (portal.prov.ae/en/marketing/tools/business-card) rebuilt here: a
"Card for" person picker (`business-card.tsx`) above the designer's **Business Card Studio** in a
same-origin iframe. The tab runs wider than the page column — the studio switches to a stacked
layout under 1000 px.

- `studio/` — the designer's source, **verbatim** from `provident-business-card-studio.zip`
  (their README is in there). Don't edit it; drop a new delivery in over it.
- `embed.js` — the one script added on top, same contract as the portal's: the host posts
  `{ type: 'provident-bcard:card', card: { fullName, position, brn, phone, email } }` after the
  studio posts `provident-bcard:ready`. Name / mobile / e-mail are prefilled and editable; job title
  and BRN are locked to the record (a null hides the line); background images are off.
- `build.py` — `python3 src/tools/agent-kit/business-card/build.py` writes
  `public/tools/agent-kit/business-card/index.html` (studio + `embed.js`). Re-run it after touching
  either; the page serves that file, not the source.
- `record.ts` — the card record for a person. Demo: derived from the employee list (the shared
  `Employee` type has no phone / e-mail / BRN). In the CRM, swap `cardRecord()` for the real lookup.
- Empty picker = a blank card; clearing a person reloads the studio so their locks don't linger.
  Nothing is saved; all rendering and downloads (print/digital PDF, SVG, PNG, JPEG) happen in the
  browser.

No `_shared/`. Copy this folder plus `public/tools/agent-kit/`.

## E-business card (`e-card/`)

A 1080 × 1920 PNG for WhatsApp, a story or a phone screen — the portal's "Scan me" card redrawn in
the ProvToys look (HTML/CSS artwork like the Events flyer, `e-card.module.css`, drawn with
html-to-image in `export.ts`): Provident wordmark, round headshot, name, job title, BRN, a QR code with
the Provident mark in its middle, "Scan me". Two looks: **with cover photo** (the Dubai canal-bridge
skyline `public/tools/agent-kit/e-card/cover.jpg` fading into the navy; the agent can upload their
own) or **no cover** (all navy).

- Pick the person with the same picker as Business card (`person-picker.tsx`); name, title, mobile
  and email fill from `business-card/record.ts` and stay editable. Nothing is saved.
- The headshot works as on Just Sold (`listing/listing-editor.tsx`): picking the person brings in
  their profile photo (`Employee.photoUrl`); the shared `PhotoDropzone` ("Add / Replace headshot")
  swaps in an upload; the Size slider (1–3×, Reset) and dragging inside the circle frame it.
  `shotRect()` in `artwork.tsx` is the cover-and-clamp maths, like Just Sold's `coverRect`.
- The QR (`qr.tsx`, `uqr`, error correction H, at least version 5) holds the agent's **contact page**
  address — or a link the agent types. Checked to decode with the wordmark in place, from the bare
  `/card/emp-1` (37 × 37) up to a link carrying every edited field.
- **Contact page** — what a client sees after scanning, like the portal's: `/card/<employee id>`
  (`src/app/card/[id]/page.tsx`, public, outside the app shell; `contact-page.tsx`). Navy hero with the
  skyline, brass-ringed photo, name, title, BRN; Call / WhatsApp / Email / Directions; mobile, email,
  company, office (Business Park 4, Dubai Hills Estate) with Show on map, website; Provident's social
  channels (as linked from providentestate.com, `contact.ts`; glyphs from `simple-icons`, LinkedIn
  drawn as "in"); and **Save to phone** — a vCard 3.0 with every field and the photo embedded as JPEG
  (`vcard.ts`), which iPhone opens as the "new contact" sheet and Android hands to Contacts.
- The page reads the person from the employee record; fields the agent edited on the card ride along
  in the URL (`n` name, `t` title, `b` BRN, `m` mobile, `e` email — only what differs from the record,
  so the QR stays coarse). A photo can't fit in a URL, so the page shows the record's profile photo; in
  the CRM `recordContact()` would read the agent's real profile.
- The look follows the agent "Rented" posts: deep navy, brass (#b0905b) as the hero colour (headshot
  ring, "Scan me", the BRN text and the dot of the QR's Provident mark), white name, stone caps title, the BRN in
  a white pill (left off when empty — most non-agents have none).
