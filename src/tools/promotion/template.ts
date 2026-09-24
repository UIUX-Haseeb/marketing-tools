/**
 * Promotion post — two DESIGNS, picked in the form (like `listing/`'s Design/Format pickers).
 * `PROMOTION` ("standard") is the original centred layout. `PROMOTION_EXECUTIVE` ("executive")
 * is a distinct asymmetric layout for VIP/leadership promotions, measured from Figma
 * "Birthday-template" node 265:596 ("Congratulations VIP", 1080×1440) — a left-aligned text
 * column over a portrait-oriented photo on the right, with a department line and a fixed
 * "LEADERSHIP ANNOUNCEMENT" tag. It shares the wordmark and script assets with "standard" but
 * has its own background (no gold frame outline — the photo just sits under the text, no
 * separate frame layer exists in the reference) and no fixed closing paragraph.
 *
 * "standard" — geometry measured from Figma: Birthday-template › Frame 1618872990
 * (node 174:133498), drawn at 1152 × 1440 but exported at 1080 × 1440: the layout is centred,
 * so every x is the Figma value minus 36.
 *
 * Layers, bottom to top: background artwork (navy gradient, circle pattern, both gradients) → the "provident." wordmark and the gold script "Congratulations" (both SVG layers drawn by code) → the
 * colleague's photo (cutout, cover-fit in the frame box, clipped so it never runs past the frame's
 * bottom edge but may rise above its top) → the thin gold frame outline → name + promotion line + fixed closing paragraph.
 */
export type PromotionDesign = "standard" | "executive";

export const PROMOTION_DESIGNS: { id: PromotionDesign; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "executive", label: "Executive" },
];

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

/**
 * "executive" — geometry measured from Figma node 265:596 ("Congratulations VIP"). Unlike
 * "standard" everything is LEFT-aligned to x=101 (the same left margin the wordmark and script
 * already sit at) instead of centred, and the photo is a plain tall rectangle on the right
 * (658×1170, flush with the canvas's right and bottom edges) instead of a framed portrait —
 * there's no separate frame outline layer in the reference, so none is drawn here. Text is
 * drawn on top of the photo (matches the Figma z-order), which is fine since the photo box
 * only starts at x=421 while the text sits on its own opaque colour — the two overlap in the
 * upper-left of the photo box without any legibility issue in the reference.
 *
 * `role` (e.g. "Executive Director") and `subtitle` are two separate text layers in Figma, not
 * one composed line like "standard"'s `promo` — `subtitle` is fixed copy, `role` is the typed
 * designation with a code-appended "!" (the same pattern as Just Rented's " /year"). `tag` is
 * fixed copy too ("LEADERSHIP ANNOUNCEMENT" doesn't vary in the reference), right-aligned to
 * the mirror of the left margin (983 = 1080 − 97, matching the wordmark's own left inset).
 * `department`'s tracking (24×0.14) and `tag`'s (17×0.14) both land on the exact same 14%
 * ratio `CHIP_STYLE` in `listing.ts` uses for its tracked-caps pills — not a coincidence, the
 * same type style reused across templates.
 */
export const PROMOTION_EXECUTIVE = {
  id: "provident-promotion-executive",
  label: "Promotion",
  fileStem: "Promotion-Executive",
  ctaLabel: "Generate Promotion Post",
  width: 1080,
  height: 1440,
  assets: {
    /** Flattened export of node 265:597 — bg gradient, diagonal shapes, gold accent line, circle pattern (1080×1440). No text, no logo, no script, no photo. */
    background: "/tools/promotion/background-executive.png",
    /** Same wordmark asset "standard" uses, just drawn at a different box. */
    wordmark: "/tools/_shared/provident-wordmark-white.svg",
    /** Same script asset "standard" uses. */
    script: "/tools/promotion/congratulations.svg",
  },
  wordmark: { x: 101, y: 1286, w: 190.4, h: 37.51 },
  script: { x: 101, y: 100, w: 576.26, h: 123.84 },
  /** Plain rectangle — the photo is cover-fitted here, no rounding, no frame. */
  photo: { x: 421, y: 276, w: 658, h: 1170 },
  name: { x: 101, cy: 295.5, size: 55, weight: 400, color: "#FFFFFF", maxWidth: 900, minSize: 32, maxChars: 40 },
  subtitle: { text: "On your well-deserved position to", x: 101, cy: 365, size: 27, weight: 300, color: "#6B7280" },
  role: { suffix: "!", x: 101, cy: 419, size: 38, weight: 400, color: "#B0905B", maxWidth: 900, minSize: 24, maxChars: 50 },
  divider: { x: 101, y: 489, w: 110, color: "#6B7280" },
  department: { x: 101, cy: 548, size: 24, weight: 500, tracking: 24 * 0.14, color: "#FFFFFF", maxWidth: 900, minSize: 16, maxChars: 40 },
  /** Fixed — doesn't vary in the reference. */
  tag: { text: "LEADERSHIP ANNOUNCEMENT", rightX: 983, cy: 1313.5, size: 17, weight: 500, tracking: 17 * 0.14, color: "#FFFFFF" },
} as const;
