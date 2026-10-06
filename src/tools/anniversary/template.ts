/**
 * Work Anniversary post ("Congratulations · {n} Years Of Work Anniversary") — geometry measured
 * off the approved artwork (supplied as a 1500 × 2000 image, no Figma frame), scaled to
 * 1080 × 1440. Everything is left-aligned to the same x as the script and the wordmark.
 *
 * Layers, bottom to top: background artwork (flat #16263F navy with fine grain + the gold
 * confetti) → the big anniversary numeral (drawn in code so it follows the year: Google Sans Flex,
 * hollow outline, glossy brass) → the colleague's photo (cutout, cover-fit in the photo box, soft
 * shadow) → script "Congratulations" → header, name, designation, divider, message → wordmark.
 */
export const ANNIVERSARY = {
  id: "provident-work-anniversary",
  label: "Work Anniversary",
  fileStem: "Work-Anniversary",
  ctaLabel: "Generate Anniversary Post",
  width: 1080,
  height: 1440,
  assets: {
    /** Navy + grain + confetti only (1080×1440). No text, no numeral, no person. */
    background: "/tools/anniversary/background.webp",
    wordmark: "/tools/_shared/provident-wordmark-white.svg",
    /** Gold script "Congratulations" (same artwork the Promotion post uses). */
    script: "/tools/anniversary/congratulations.svg",
  },
  /** Every text block's visible ink starts on this edge (see render.ts `inkX`). */
  left: 111,
  script: { x: 114.7, y: 119.3, w: 474.5, h: 100 },
  /** "{n} Years Of" / "Work Anniversary" — two lines, Regular, warm white. Baselines. */
  header: { size: 47.6, weight: 400, color: "#F8F7F6", baselines: [307, 363.8] },
  /**
   * The numeral's glyph box in the reference (a "3"): 664 tall, bottom at 880, centred on 788.8.
   * Google Sans Flex's digits are narrower than the reference's, so one digit keeps the full
   * height. A wider number stays right of the header (`maxWidth` = 1047.6 − 488, the header's
   * right edge): it grows left until it reaches that edge, then shrinks — so "12" never runs
   * behind "Work Anniversary".
   */
  numeral: { cx: 788.8, bottom: 879.8, height: 663.8, maxWidth: 560, right: 1047.6, weight: 400, stroke: 6 },
  /** Cover-fit box for the photo; clipped on the left at `x` only (free above, flush right/bottom). */
  photo: { x: 330, y: 260, w: 750, h: 1180 },
  name: { size: 47.8, weight: 400, color: "#FFFFFF", baseline: 934.3, maxWidth: 560, minSize: 32, maxChars: 30 },
  /** Tracked caps — the reference spaces these wider than the other templates' 14% (3.7px at 17px ≈ 22%). */
  designation: { size: 17, weight: 500, tracking: 3.7, color: "#C0C4C9", baseline: 968.4, maxWidth: 560, minSize: 12, maxChars: 40 },
  divider: { x: 109.4, y: 1017, w: 87.8, width: 1.6, color: "#B5A68F" },
  /** Message: first line + wrapped middle + two fixed closing lines, Light, slate. Baseline of line 1, then `lineHeight`. */
  message: { size: 20.5, weight: 300, color: "#6B7A8F", baseline: 1082.5, lineHeight: 33.1, maxWidth: 300, closing: ["Here's to many more", "milestones ahead!"] },
  wordmark: { x: 111, y: 1260, w: 198, h: 38.9 },
  years: { min: 1, max: 60 },
} as const;

export const ANNIVERSARY_COPY = {
  header: (n: number) => `${n} ${n === 1 ? "Year" : "Years"} Of`,
  headerLine2: "Work Anniversary",
  messageFirst: (n: number) => `Celebrating ${n} incredible`,
  messageMiddle: (n: number, firstName: string) => `${n === 1 ? "year" : "years"} with ${firstName} at Provident.`,
};
