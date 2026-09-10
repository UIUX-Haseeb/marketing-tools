/**
 * Promotion ("Congratulations … On Your Promotion to …") post — geometry measured from Figma:
 * Birthday-template › Frame 1618872990 (node 174:133498), drawn at 1152 × 1440 but exported at
 * 1080 × 1440: the layout is centred, so every x is the Figma value minus 36.
 *
 * Layers, bottom to top: background artwork (navy gradient, circle pattern, both gradients) → the "provident." wordmark and the gold script "Congratulations" (both SVG layers drawn by code) → the
 * colleague's photo (cutout, cover-fit in the frame box, clipped so it never runs past the frame's
 * bottom edge but may rise above its top) → the thin gold frame outline → name + promotion line + fixed closing paragraph.
 */
export const PROMOTION = {
  id: "provident-promotion",
  label: "Promotion",
  fileStem: "Promotion",
  ctaLabel: "Generate Promotion Post",
  width: 1080,
  height: 1440,
  assets: {
    /** Flattened export of the static artwork only — bg, gradients, circle pattern (1080×1440). No text, no logo, no frame. */
    background: "/tools/promotion/background.png",
    /** Transparent PNG of the "profile frame" outline only (1080×1440), drawn above the photo. */
    frame: "/tools/promotion/frame.png",
    /** White "provident." wordmark (Figma "prov logo", 184×36.4). */
    wordmark: "/tools/_shared/provident-wordmark-white.svg",
    /** Gold script "Congratulations" (Figma vector export, 626×131.4). */
    script: "/tools/promotion/congratulations.svg",
  },
  wordmark: { x: 447.8, y: 92.5, w: 183.9, h: 36.4 },
  script: { x: 226.8, y: 198.7, w: 626, h: 131.4 },
  /** The profile frame's inner box — the photo is cover-fitted here. */
  photo: { x: 286, y: 496.4, w: 508.7, h: 713.1, radius: 40 },
  name: { cy: 389.6, size: 51.7, weight: 400, color: "#F4F1EC", maxWidth: 820, minSize: 32, maxChars: 40 },
  /** Fixed closing paragraph (Light 23, white), three centred lines. */
  closing: {
    lines: ["A well-deserved milestone that reflects your", "leadership, dedication and continued contribution to", "Provident’s growth."],
    cy: [1268, 1300, 1332],
    size: 23,
    weight: 300,
    color: "#FFFFFF",
  },
  promo: { prefix: "On Your Promotion to ", cy: 437.2, size: 23, weight: 300, color: "#FFFFFF", maxWidth: 820, minSize: 17, maxChars: 50 },
} as const;
