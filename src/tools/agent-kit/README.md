# agent-kit — Agent Kit

Entry: `index.tsx`. A download page, not a generator: company documents and ready-made social
banners for agents. Everything on the page comes from `kit.ts` — edit that list to add or swap
an item.

- **Documents** (Company Profile, Investment Guide) stay on Google Drive. Each card shows a
  brochure mockup (`public/tools/agent-kit/company-profile.jpg`, `investment-guide.jpg`) that
  opens the PDF in Drive, plus a Download button (`drive.google.com/uc?export=download&id=…`) and
  an Open in Drive button. The files are shared with the providentestate.com domain only, so
  agents must be signed in to their Provident Google account.
- **Banners** are static files in `public/tools/agent-kit/` — LinkedIn 1584 × 396, Facebook
  1702 × 630 — downloaded as-is with the `download` attribute. Replace the PNG to update one
  (keep the size in `kit.ts` in step).

No `_shared/`, no canvas, no state. Copy this folder plus `public/tools/agent-kit/`.
