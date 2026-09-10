/**
 * Promotion ("Congratulations … On Your Promotion to …") post — geometry measured from Figma:
 * Birthday-template › Frame 1618872990 (node 174:133498), 1152 × 1440 (4:5).
 *
 * Layers, bottom to top: background artwork (navy gradient, circle pattern, both gradients, the
 * "provident." wordmark, the gold script "Congratulations" and the fixed closing paragraph) → the
 * colleague's photo (cutout, cover-fit in the frame box, clipped so it never runs past the frame's
 * bottom edge but may rise above its top) → the thin gold frame outline → name + promotion line.
 */
export const PROMOTION = {
  id: "provident-promotion",
  label: "Promotion",
  fileStem: "Promotion",
  ctaLabel: "Generate Promotion Post",
  width: 1152,
  height: 1440,
  assets: {
    /** Flattened export of everything static except the frame outline (1152×1440). */
    background: "/tools/promotion/background.png",
    /** Transparent PNG of the "profile frame" outline only (1152×1440), drawn above the photo. */
    frame: "/tools/promotion/frame.png",
  },
  /** The profile frame's inner box — the photo is cover-fitted here. */
  photo: { x: 322, y: 496.4, w: 508.7, h: 713.1, radius: 40 },
  name: { cy: 389.6, size: 51.7, weight: 400, color: "#F4F1EC", maxWidth: 860, minSize: 32, maxChars: 40 },
  promo: { prefix: "On Your Promotion to ", cy: 437.2, size: 23, weight: 300, color: "#FFFFFF", maxWidth: 860, minSize: 17, maxChars: 50 },
} as const;
