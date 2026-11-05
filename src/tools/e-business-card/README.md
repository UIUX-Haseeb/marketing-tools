# e-business-card — E-business Card (HR)

An HR tool (`teams: ["HR"]` in `src/lib/tools.ts`): HR makes a colleague's digital business card.
It used to be a tab in the Agent Download Kit. Entry: `index.tsx` → `ECardTool` in `e-card.tsx`.


A 1080 × 1920 PNG for WhatsApp, a story or a phone screen — the portal's "Scan me" card redrawn in
the ProvToys look (HTML/CSS artwork like the Events flyer, `e-card.module.css`, drawn with
html-to-image in `export.ts`): Provident wordmark, round headshot, name, job title, BRN, a QR code with
the Provident mark in its middle, "Scan me". Two looks: **with cover photo** (the Dubai canal-bridge
skyline `public/tools/e-business-card/cover.jpg` fading into the navy; HR can upload another) or **no cover** (all navy).

- Pick the colleague with the same picker as the Agent Download Kit's Business card
  (`_shared/person-picker.tsx`); name, title, BRN, mobile and email fill from `_shared/card-record.ts`
  and stay editable. Nothing is saved.
- The headshot works as on Just Sold (`listing/listing-editor.tsx`): picking the person brings in
  their profile photo (`Employee.photoUrl`); the shared `PhotoDropzone` ("Add / Replace headshot")
  swaps in an upload; the Size slider (1–3×, Reset) and dragging inside the circle frame it.
  `shotRect()` in `artwork.tsx` is the cover-and-clamp maths, like Just Sold's `coverRect`.
- The QR (`qr.tsx`, `uqr`, error correction H, at least version 5) holds the colleague’s **contact page**
  address — or a link HR types. Checked to decode with the mark in place, from the bare
  `/card/emp-1` (37 × 37) up to a link carrying every edited field.
- **Contact page** — what a client sees after scanning, like the portal's: `/card/<employee id>`
  (`src/app/card/[id]/page.tsx`, public, outside the app shell; `contact-page.tsx`). Navy hero with the
  skyline, brass-ringed photo, name, title, BRN; Call / WhatsApp / Email / Directions; mobile, email,
  company, office (Business Park 4, Dubai Hills Estate) with Show on map, website; Provident's social
  channels (as linked from providentestate.com, `contact.ts`; glyphs from `simple-icons`, LinkedIn
  drawn as "in"); and **Save to phone** — a vCard 3.0 with every field and the photo embedded as JPEG
  (`vcard.ts`), which iPhone opens as the "new contact" sheet and Android hands to Contacts.
- The page reads the person from the employee record; fields HR edited on the card ride along
  in the URL (`n` name, `t` title, `b` BRN, `m` mobile, `e` email — only what differs from the record,
  so the QR stays coarse). A photo can't fit in a URL, so the page shows the record's profile photo; in
  the CRM `recordContact()` would read the real profile.
- The look follows the agent "Rented" posts: deep navy, brass (#b0905b) as the hero colour (headshot
  ring, "Scan me", the BRN text and the dot of the QR's Provident mark), white name, stone caps title, the BRN in
  a white pill (left off when empty — most non-agents have none).

Needs `_shared/card-record.ts`, `_shared/person-picker.tsx` and the shared `PhotoDropzone` /
`toDrawable` from `_shared/`. Copy this folder, `public/tools/e-business-card/` and the
`/card/[id]` route (`src/app/card/`). Figma: ProvToys-Templates › E-business card.
