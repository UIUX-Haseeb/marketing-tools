# condolence — Condolence post

Entry: `index.tsx` → `condolence-tool.tsx`. Locked geometry + colours: `template.ts`. Wording: `compose.ts`. Renderer: `render.ts` (two-tone lead line, wrapped paragraph, gamma-thinned ink to match the artwork's own text). Artwork: `public/tools/condolence/provident-condolence.webp` (1101×1468).

Flow: choose who has passed away (8 relations) and whether the colleague is he/she → type the colleague's name → live preview → **Check the wording** (dialog shows the exact sentences and facts) → download is enabled only after confirming. Confirmation resets if anything changes.

Depends on: `_shared/` (font, export, `Modal`, `Counter`), `@/lib/store` (`logGeneratedPost`), `@/components/ui/{button,input,label}`, `@/lib/utils`.
