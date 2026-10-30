# Provident Business Card Studio

A self-contained, offline business-card design tool for Provident staff (85 × 55 mm, front + back).
Staff type their details, hide lines they don't need, optionally upload two background PNG/JPGs, and download
print PDF / digital PDF / SVG / PNG / JPEG.

## Files

| Path | What it is |
|---|---|
| `index.html` | **The deliverable.** One file, ~0.8 MB, no external requests (fonts, logo, icons and libraries are inlined). |
| `source/` | Editable source (JS modules, HTML shell, fonts, data) and `build.py` to regenerate `index.html`. |
| `tests/` | Optional Playwright smoke test (undo limit + reset-on-reload). |

## Adding it to the company portal

1. **Link / new tab (simplest):** host `index.html` as a static file and link to it.
2. **iframe:** works as-is, e.g.
   `<iframe src="/tools/business-card/index.html" style="width:100%;height:100vh;border:0" allow="clipboard-write"></iframe>`
   Downloads use `<a download>` + Blob URLs; if your portal's iframe uses the `sandbox` attribute, include `allow-downloads allow-modals allow-same-origin allow-scripts`.
3. No server, build step, API, database or login is required. Nothing is sent anywhere — all rendering and export happens in the browser.

Needs a modern browser (Chrome / Edge / Safari / Firefox, current versions). PDF compression uses `CompressionStream`, available in all current browsers.

## Modes

| URL | Who | Behaviour |
|---|---|---|
| `index.html` | **Staff (kiosk)** | Design is locked: logo, fonts, positions and colours cannot be moved or changed. Staff can edit text, hide lines (incl. the gold line, BRN, ORN), upload/scale/move the 2 background images, undo (last 10 changes), and export. Nothing is saved — closing or reloading the page resets to the blank template. |
| `index.html#admin` | **Designers** | Full editor (layers, fonts, colours, free positioning, guides) with autosave to the browser's localStorage and Save/Open of `.bcard.json` files. Don't link this from the portal. |

Templates: **Provident (Agents)** (BRN + ORN shown, Provident logo) and **Sub-companies** (same layout; staff pick a company logo from a built-in library for the front (coloured) and back (white), or upload their own).

### Company logo library
The 7 logos (Provident Property Solutions ×2, Property Boutique ×2, PVH – Vacation Homes ×2, Prism) live in `source/logos.js` as inline SVG, each with a `color` and a `white` version (cropped tight, backgrounds removed). To add or change a logo, edit that array (fields: `id, company, variant, w, h, color, white`) and run `build.py`. Originals came from the `companies logo` folder. ORN defaults to the company number `1933` and is editable/hideable.

## Behaviour worth knowing

- Long names/designations wrap to the next line at full size; the designation, gold line, BRN and ORN reflow downward automatically.
- All text is converted to outlines on export, so printed PDFs/SVGs need no fonts.
- Print PDF mirrors the existing Provident print files (crop marks, registration targets, colour bars, optional bleed). Digital PDF is exactly 85 × 55 mm.
- Uploaded images/logos stay in memory only (never uploaded to a server).
- localStorage keys used by admin mode only: `provident-bcard-studio-v2-admin`. Kiosk mode clears its key on load.

## Rebuilding from source

```
cd source
python3 build.py        # writes ../index.html
```
Edit the template/defaults in `source/b_model.js` (`baseElements()`, `MODES`), the UI in `d_ui.js` / `e_panels.js` / `shell.html`, export code in `c_export.js`. Third-party code: opentype.js 1.3.4 (MIT), inlined in `source/ot.js`. Typeface: Google Sans Flex (weights 300/400/500) embedded in `source/fonts.js`.

## Tests (optional)

```
npm i playwright && node tests/smoke-undo-reset.js
```
Expected output: `undos 10 …` and `Full Name []` (no console errors).
