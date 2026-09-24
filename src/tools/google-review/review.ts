/**
 * GOOGLE REVIEW — two FORMATS (canvas size), picked in the form like listing's Post/Story
 * toggle (`listing/listing.ts`). "post" (1080×1440) geometry measured from Figma:
 * "Birthday-template" file, node 215:116 (frame "Frame" inside "Templates and reference").
 * "story" (1080×1920) measured from node 265:463. `canvasSize(format)` gives the pixel
 * dimensions; `reviewGeometryFor(format)` picks `REVIEW` (post) or `REVIEW_STORY`.
 *
 * Background: the dotted navy texture is baked into `public/tools/google-review/background.webp`
 * (post) / `background-story.webp` (story) — exported straight off the Figma layer, a static
 * image fill, not a generated pattern, so each format needs its own asset rather than a shared
 * one stretched to fit. Everything else is drawn in code: the star row, the review quote, the
 * reviewer's name, a bordered card outline, the agent's circular headshot and the agent's name
 * + tracked-caps designation — the same split "Just Sold / Just Listed" uses.
 *
 * The card outline carries no fill in the design — the texture shows straight through it, it's
 * a hairline only (post: 1px `rgba(255,255,255,0.33)`; story: 0.5px `#ECE7DF`, measured
 * separately — Kelvin's story revision uses a different stroke). The headshot overlaps the
 * card's bottom edge by design on both formats: draw the card before the headshot so the
 * photo's own ring covers the border where the two overlap, exactly as the reference shows.
 * Story's headshot ring is also its own measured value (`rgba(255,255,255,0.3)`, vs. post's
 * `0.9`) — not a copy-paste, a genuine difference between the two frames.
 *
 * Story's text runs larger across the board than post's (wordmark 49 vs. 41, reviewer/
 * agentName 42 vs. 35, agentTitle 29 vs. 24) with its own tracked-caps value measured directly
 * off the frame (0.5px at size 29 — not scaled from post's 3.36 at size 24, a different,
 * measured constant) — the same "each size is its own value, not a derived scale" pattern
 * `LISTING_MINIMAL_STORY` documents. Card width (910) and headshot radius (148) are identical
 * between formats — only the taller canvas and repositioned block change.
 */
import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable, PhotoTransform } from "@/tools/_shared/render";
import { drawableSize } from "@/tools/_shared/render";

export type ReviewFormat = "post" | "story";

export const REVIEW_FORMATS: { id: ReviewFormat; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "story", label: "Story" },
];

export function canvasSize(format: ReviewFormat): { width: number; height: number } {
  return format === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1440 };
}

export const REVIEW = {
  id: "provident-google-review",
  label: "Google Review",
  fileStem: "Google-Review",
  ctaLabel: "Generate Review Post",
  src: "/tools/google-review/background.webp",
  width: 1080,
  height: 1440,
  color: "#FFFFFF",
  wordmark: { text: "provident.", cx: 540, cy: 131.5, size: 41, weight: 300 },
  card: { x: 85, y: 237.57, w: 910, h: 818.92, radius: 24, border: "rgba(255,255,255,0.33)" },
  /** 5 gold stars, evenly spaced, centred on the canvas axis. Measured as one 181.39-wide group. */
  stars: { cx: 540, cy: 322, size: 29.92, gap: 7.9, color: "#B0905C", max: 5 },
  /** The quote: up to two paragraphs (a blank line between them, as the reference shows), centred. */
  quote: { top: 383, size: 29, weight: 300, lineHeight: 39, paraGap: 20, maxWidth: 744, minSize: 20, maxLines: 8, color: "#FFFFFF" },
  reviewer: { cy: 759, size: 35, weight: 400, color: "#FFFFFF", maxWidth: 700, minSize: 24 },
  headshot: { cx: 540, cy: 1047, r: 148, border: "rgba(255,255,255,0.9)" },
  agentName: { cy: 1274.46, size: 35, weight: 400, color: "#FFFFFF", maxWidth: 700, minSize: 24 },
  agentTitle: { cy: 1324.46, size: 24, weight: 500, tracking: 3.36, color: "#FFFFFF", maxWidth: 700, minSize: 16 },
} as const;

/** "story" — measured off Figma node 265:463. See the file-level comment for what differs from "post" and why. */
export const REVIEW_STORY = {
  id: "provident-google-review",
  label: "Google Review",
  fileStem: "Google-Review",
  ctaLabel: "Generate Review Post",
  src: "/tools/google-review/background-story.webp",
  width: 1080,
  height: 1920,
  color: "#FFFFFF",
  wordmark: { text: "provident.", cx: 540, cy: 221.5, size: 49, weight: 300 },
  card: { x: 85, y: 373, w: 910, h: 1167, radius: 30, border: "#ECE7DF" },
  stars: { cx: 540.42, cy: 517.02, size: 38.03, gap: 11, color: "#B0905C", max: 5 },
  quote: { top: 596, size: 35, weight: 300, lineHeight: 47, paraGap: 24, maxWidth: 714, minSize: 24, maxLines: 8, color: "#FFFFFF" },
  reviewer: { cy: 1232.5, size: 42, weight: 400, color: "#FFFFFF", maxWidth: 700, minSize: 24 },
  headshot: { cx: 540, cy: 1513, r: 148, border: "rgba(255,255,255,0.3)" },
  agentName: { cy: 1745.5, size: 42, weight: 400, color: "#FFFFFF", maxWidth: 700, minSize: 24 },
  agentTitle: { cy: 1807, size: 29, weight: 500, tracking: 0.5, color: "#FFFFFF", maxWidth: 700, minSize: 16 },
} as const;

export function reviewGeometryFor(format: ReviewFormat) {
  return format === "story" ? REVIEW_STORY : REVIEW;
}

export const REVIEW_LIMITS = { quote: 600, reviewerName: 40, agentName: 32, agentTitle: 28 } as const;

export type ReviewInput = {
  format: ReviewFormat;
  artwork: Drawable;
  stars: number; // 1–5
  quote: string;
  reviewerName: string;
  agentName: string;
  agentTitle: string;
  headshot: Drawable | null;
  headshotTransform: PhotoTransform;
  showPlaceholders?: boolean;
};

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;

function clamp(v: number, lo: number, hi: number) {
  return hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

/** Cover-fit `img` into a w×h box centred at (cx, cy), then apply zoom/offset. Returns the draw rect. */
export function coverRect(img: Drawable, box: { cx: number; cy: number; w: number; h: number }, t: PhotoTransform) {
  const { w: iw, h: ih } = drawableSize(img);
  const s = Math.max(box.w / iw, box.h / ih) * clamp(t.zoom, 1, 3);
  const w = iw * s;
  const h = ih * s;
  const maxX = (w - box.w) / 2;
  const maxY = (h - box.h) / 2;
  const ox = clamp(t.offsetX, -maxX, maxX);
  const oy = clamp(t.offsetY, -maxY, maxY);
  return { x: box.cx + ox - w / 2, y: box.cy + oy - h / 2, w, h, clamped: { zoom: clamp(t.zoom, 1, 3), offsetX: ox, offsetY: oy } };
}

const HEADSHOT_BOX_POST = { cx: REVIEW.headshot.cx, cy: REVIEW.headshot.cy, w: REVIEW.headshot.r * 2, h: REVIEW.headshot.r * 2 };
const HEADSHOT_BOX_STORY = { cx: REVIEW_STORY.headshot.cx, cy: REVIEW_STORY.headshot.cy, w: REVIEW_STORY.headshot.r * 2, h: REVIEW_STORY.headshot.r * 2 };

export function headshotBoxFor(format: ReviewFormat) {
  return format === "story" ? HEADSHOT_BOX_STORY : HEADSHOT_BOX_POST;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lockText(ctx: CanvasRenderingContext2D) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing: string; fontKerning: string };
  ctx.direction = "ltr";
  c.letterSpacing = "0px";
  c.fontKerning = "normal";
}

/** Draw one line, shrinking the font until it fits `maxWidth` (never below `size * floor`). */
function fitLine(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number, tracking = 0) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.floor(fs * (maxWidth / w)));
  }
}

function drawTracked(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, tracking: number) {
  if (!tracking) {
    ctx.textAlign = "center";
    ctx.fillText(text, cx, cy);
    return;
  }
  const total = [...text].reduce((s, ch) => s + ctx.measureText(ch).width, 0) + tracking * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, x, cy);
    x += ctx.measureText(ch).width + tracking;
  }
}

/** Greedy word wrap at the current ctx.font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width <= maxWidth || !line) line = probe;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** One "line" of the laid-out quote: either a wrapped text line, or a gap before the next paragraph. */
type QuoteRow = { text: string } | { gap: true };

/** Wrap the quote's paragraphs (blank-line separated) at the current size; returns rows + total lines used. */
function layoutQuote(ctx: CanvasRenderingContext2D, quote: string, maxWidth: number) {
  const paragraphs = quote.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows: QuoteRow[] = [];
  let lines = 0;
  paragraphs.forEach((p, i) => {
    if (i > 0) rows.push({ gap: true });
    for (const line of wrap(ctx, p, maxWidth)) {
      rows.push({ text: line });
      lines++;
    }
  });
  return { rows, lines };
}

function drawStars(ctx: CanvasRenderingContext2D, T: ReturnType<typeof reviewGeometryFor>, count: number) {
  const S = T.stars;
  const n = clamp(Math.round(count), 0, S.max);
  if (n <= 0) return;
  const total = n * S.size + (n - 1) * S.gap;
  let x = S.cx - total / 2 + S.size / 2;
  ctx.save();
  ctx.fillStyle = S.color;
  for (let i = 0; i < n; i++) {
    drawStar(ctx, x, S.cy, S.size / 2);
    x += S.size + S.gap;
  }
  ctx.restore();
}

/** A single 5-point star, centred at (cx, cy), outer radius r. */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const inner = r * 0.382;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeadshotPlaceholder(ctx: CanvasRenderingContext2D, h: { cx: number; cy: number; r: number }) {
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(h.cx - h.r, h.cy - h.r, h.r * 2, h.r * 2);
}

export function renderReview(ctx: CanvasRenderingContext2D, input: ReviewInput, scale = 1) {
  const T = reviewGeometryFor(input.format);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lockText(ctx);

  // 0. Background (the dotted navy texture, baked in Figma)
  ctx.drawImage(input.artwork, 0, 0, T.width, T.height);

  // 1. Wordmark
  ctx.fillStyle = T.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = font(T.wordmark.weight, T.wordmark.size);
  ctx.fillText(T.wordmark.text, T.wordmark.cx, T.wordmark.cy);

  // 2. Card outline (no fill — the background texture shows through)
  const c = T.card;
  roundedRect(ctx, c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1, c.radius - 0.5);
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Stars
  drawStars(ctx, T, input.stars);

  // 4. Quote — shrink to fit `maxLines`, then draw each row.
  const Q = T.quote;
  ctx.fillStyle = Q.color;
  ctx.textAlign = "center";
  let fs = Q.size;
  let layout: ReturnType<typeof layoutQuote>;
  for (;;) {
    ctx.font = font(Q.weight, fs);
    layout = layoutQuote(ctx, input.quote, Q.maxWidth);
    if (layout.lines <= Q.maxLines || fs <= Q.minSize) break;
    fs -= 1;
  }
  ctx.font = font(Q.weight, fs);
  const lineHeight = (Q.lineHeight / Q.size) * fs;
  let y = Q.top + lineHeight / 2;
  for (const row of layout.rows) {
    if ("gap" in row) {
      y += Q.paraGap;
      continue;
    }
    ctx.fillText(row.text, T.wordmark.cx, y);
    y += lineHeight;
  }

  // 5. Reviewer name
  const reviewer = input.reviewerName.trim();
  if (reviewer) {
    ctx.fillStyle = T.color;
    const rf = fitLine(ctx, reviewer, T.reviewer.weight, T.reviewer.size, T.reviewer.minSize, T.reviewer.maxWidth);
    ctx.font = font(T.reviewer.weight, rf);
    ctx.fillText(reviewer, T.wordmark.cx, T.reviewer.cy);
  }

  // 6. Headshot (drawn AFTER the card so its ring covers the border where they overlap)
  const h = T.headshot;
  ctx.save();
  ctx.beginPath();
  ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2);
  ctx.clip();
  if (input.headshot) {
    const r = coverRect(input.headshot, headshotBoxFor(input.format), input.headshotTransform);
    ctx.drawImage(input.headshot, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    drawHeadshotPlaceholder(ctx, h);
  }
  ctx.restore();
  if (input.headshot || input.showPlaceholders) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.r - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = h.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // 7. Agent name + designation
  ctx.fillStyle = T.color;
  const name = input.agentName.trim();
  if (name) {
    const nf = fitLine(ctx, name, T.agentName.weight, T.agentName.size, T.agentName.minSize, T.agentName.maxWidth);
    ctx.font = font(T.agentName.weight, nf);
    ctx.fillText(name, T.wordmark.cx, T.agentName.cy);
  }
  const title = input.agentTitle.trim().toUpperCase();
  if (title) {
    const tf = fitLine(ctx, title, T.agentTitle.weight, T.agentTitle.size, T.agentTitle.minSize, T.agentTitle.maxWidth, T.agentTitle.tracking);
    ctx.font = font(T.agentTitle.weight, tf);
    drawTracked(ctx, title, T.wordmark.cx, T.agentTitle.cy, T.agentTitle.tracking * (tf / T.agentTitle.size));
  }

  ctx.restore();
}
