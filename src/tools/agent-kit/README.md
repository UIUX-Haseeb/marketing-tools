# agent-kit — Agent Kit

Entry: `index.tsx`, two tabs (`tabs.tsx`): **Downloads** — company documents and ready-made social
banners, all listed in `kit.ts` (edit that list to add or swap an item) — and **Business card**.

- **Documents** (Company Profile, Investment Guide) stay on Google Drive. Each card shows a
  brochure mockup (`public/tools/agent-kit/company-profile.jpg`, `investment-guide.jpg`) that
  opens the PDF in Drive, plus a Download button (`drive.google.com/uc?export=download&id=…`) and
  an Open in Drive button. The files are shared with the providentestate.com domain only, so
  agents must be signed in to their Provident Google account.
- **Banners** are static files in `public/tools/agent-kit/` — LinkedIn 1584 × 396, Facebook
  1702 × 630 — downloaded as-is with the `download` attribute. Replace the PNG to update one
  (keep the size in `kit.ts` in step).

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
