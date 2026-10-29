# agent-kit — Agent Kit

Entry: `index.tsx`. A download page, not a generator: company documents and ready-made social
banners for agents. Everything on the page comes from `kit.ts` — edit that list to add or swap
an item.

- **Documents** (Company Profile, Investment Guide) stay on Google Drive. Each card embeds the
  PDF with Drive's own viewer (`/file/d/<id>/preview` in an iframe), plus a Download button
  (`drive.google.com/uc?export=download&id=…`) and an Open in Drive button. The files are shared
  with the providentestate.com domain, so the preview and download work for anyone signed in to a
  Provident Google account in that browser; everyone else sees Drive's sign-in page. Share them
  as "Anyone with the link" to drop that.
- The Drive iframe is cross-origin, so `next.config.ts` leaves `/tools/agent-kit` out of the
  cross-origin-isolation headers (COEP would block it). The kit doesn't use background removal.
- **Banners** are static files in `public/tools/agent-kit/` — LinkedIn 1584 × 396, Facebook
  1702 × 630 — downloaded as-is with the `download` attribute. Replace the PNG to update one
  (keep the size in `kit.ts` in step).

No `_shared/`, no canvas, no state. Copy this folder plus `public/tools/agent-kit/`.
