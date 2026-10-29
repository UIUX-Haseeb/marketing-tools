# agent-kit — Agent Kit

Entry: `index.tsx`. A download page, not a generator: company documents and ready-made social
banners for agents. Everything on the page comes from `kit.ts` — edit that list to add or swap
an item.

- **Documents** (Company Profile, Investment Guide) stay on Google Drive. Each has a Download
  button (`drive.google.com/uc?export=download&id=…`) and an Open in Drive button. The Drive file
  must be shared as "Anyone with the link" or agents get a sign-in page.
- **Banners** are static files in `public/tools/agent-kit/` — LinkedIn 1584 × 396, Facebook
  1702 × 630 — downloaded as-is with the `download` attribute. Replace the PNG to update one
  (keep the size in `kit.ts` in step).

No `_shared/`, no canvas, no state. Copy this folder plus `public/tools/agent-kit/`.
