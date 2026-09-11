# marriage — Marriage / engagement congratulations post

Entry: `index.tsx` → `marriage-tool.tsx`. Geometry: `template.ts` (Figma "Birthday-template" node 201:133, 1080×1440). Wording: `compose.ts`. Renderer: `render.ts`.

Artwork: `public/tools/marriage/provident-marriage.webp` — flat export from Figma (wordmark, gold script *Congratulations*, rings, "A BEAUTIFUL NEW CHAPTER BEGINS" are all in the image). Drawn on top: name (Regular 55 #F4F1EC), designation (Regular 18 #6A727F, caps, 4.5 px tracking) and the message (Light 25 #D3CFC3, wrapped to ≤ 3 centred lines, 40 px leading).

Fields: pick from the employee list (prefills name + designation) or type; Occasion chips (Wedding / Engagement / Marriage) and He / She chips fill the wording: "on {his|her} {occasion}. May this journey ahead be filled with joy, love, and endless blessings. Best Wishes".

Depends on: `_shared/` (font, export, `Counter`), `@/lib/demo/employees`, `@/lib/store`, `@/components/ui/{button,input,label,select}`, `@/lib/utils`.
