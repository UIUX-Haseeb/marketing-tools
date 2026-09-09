# _shared — post engine

Required by `birthday/`, `baby/` and `listing/`. Ported 1:1 from the original General Post Generator.

- `font.ts` — loads the locked brand font (Google Sans Flex) via FontFace, verifies it with a glyph-width fingerprint, exposes `ensurePostFont()` / `isPostFontReady()` / `unsupportedCharacters()`.
- `templates.ts` — `PostTemplate` / `TextSlot` types, brand colours, character limits. Actual templates live in each tool folder.
- `render.ts` — `renderPost()` for slot-based templates (artwork + circular photo + fitted text), photo transform helpers.
- `export.ts` — `exportPost()` and `encodeCanvas()`: PNG if ≤ 1.4 MB, else JPEG down a quality ladder using the bundled encoder; `downloadBlob`, `safeFileName`, `validatePhotoFile`.
- `jpeg.ts` — baseline JPEG encoder (verbatim port; browser-independent output).
- `zip.ts` — store-only ZIP writer for "Export all".
- `use-post.ts` — React hooks: `usePostAssets`, `usePostCanvas`, `toDrawable`.
- `post-editor.tsx` — generic single-post editor used by Birthday (manual/adjust) and Baby.
- `ui.tsx` — `PostPreview`, `PhotoDropzone`, `PhotoControls`, `Counter`, `Modal`.

Assets: `public/tools/_shared/fonts/GoogleSansFlex-{300,400-subset,500}.woff2`.
