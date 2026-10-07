/**
 * Sales Achievement post — an agent's sales achievement: "Secured #{rank} for {period}, closing on a
 * high note / with {amount} in sales" on a glass card, with a stats row underneath. Geometry
 * measured off the approved artwork (two 1500 × 2000 images, no Figma frame), scaled to 1080.
 *
 * Two STATS layouts, picked in the form: "total" (Total sale value · Transactions) and "split"
 * (Total sale value · Primary · Secondary — the card widens to fit a third column).
 *
 * Layers, bottom to top: the background photo the agent uploads (cover-fit, size + drag) → a navy
 * wash at the top so the wordmark/name/designation always read → the agent's cutout photo → the
 * glass card (a blurred copy of everything under it, dark tint, hairline) and its copy → the
 * permit QR, overlapping the card's bottom-right corner.
 */
export type StatsLayout = "total" | "split";

export const STATS_LAYOUTS: { id: StatsLayout; label: string }[] = [
  { id: "total", label: "Total transactions" },
  { id: "split", label: "Primary & Secondary" },
];

export const ACHIEVEMENT = {
  id: "provident-sales-achievement",
  label: "Sales Achievement",
  fileStem: "Sales-Achievement",
  ctaLabel: "Generate Sales Achievement Post",
  width: 1080,
  height: 1440,
  navy: "16,30,52",
  assets: { wordmark: "/tools/_shared/provident-wordmark-white.svg" },
  wordmark: { x: 444.2, y: 100.8, w: 192.2, h: 37.4 },
  name: { baseline: 272.2, size: 85.5, weight: 400, tracking: -5.6, color: "#FFFFFF", maxWidth: 900, minSize: 50, maxChars: 32 },
  designation: { baseline: 338.4, size: 25.1, weight: 500, tracking: 1.73, color: "#FFFFFF", maxWidth: 860, minSize: 16, maxChars: 40 },
  /** Top wash: solid navy through `solidTo`, clear by `clearAt` (fractions of the height). */
  wash: { solidTo: 0.16, clearAt: 0.5 },
  /** The agent cutout's cover-fit box; it may rise above the box but never past the canvas. */
  person: { x: 190, y: 380, w: 700, h: 1060 },
  card: {
    total: { x: 124.6, w: 830.8 },
    split: { x: 104.4, w: 871.2 },
    y: 1038.2,
    h: 326.2,
    radius: 29,
    blur: 22,
    tint: "rgba(6, 12, 24, 0.55)",
    border: "rgba(255, 255, 255, 0.16)",
  },
  headline: { size: 37.6, weight: 400, color: "#FFFFFF", gold: "#C3A169", baselines: [1124.7, 1173.6], maxWidth: 760, minSize: 30 },
  divider: { x: 180, y: 1214, w: 721.4, color: "rgba(255, 255, 255, 0.28)" },
  stats: {
    label: { baseline: 1262.2, size: 19.1, weight: 500, tracking: 2.97, color: "#FFFFFF" },
    value: { baseline: 1306.1, size: 34, weight: 400, color: "#FFFFFF", maxWidth: 260, minSize: 22 },
    rule: { top: 1246, bottom: 1314, color: "rgba(255, 255, 255, 0.28)" },
    total: { centers: [352.8, 763.2], rules: [576] },
    split: { centers: [281.5, 594.7, 852.5], rules: [475.2, 714.2] },
  },
  qr: { x: 938.9, y: 1292.4, size: 118, pad: 4, radius: 9 },
  limits: { rank: 3, period: 12, amount: 24, count: 5 },
} as const;
