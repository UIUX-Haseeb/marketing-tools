/**
 * GOOGLE REVIEW POST — geometry measured from Figma: "Birthday-template" file, node 215:116
 * (frame "Frame" inside "Templates and reference"), 1080 × 1440.
 *
 * Background: the dotted navy texture is baked into `public/tools/google-review/background.webp`
 * (exported straight off the Figma layer — it is a static image fill, not a generated pattern).
 * Everything else is drawn in code: the star row, the review quote, the reviewer's name, a
 * bordered card outline, the agent's circular headshot and the agent's name + tracked-caps
 * designation — the same split "Just Sold / Just Listed" uses (`listing/listing.ts`).
 *
 * The card outline carries no fill in the design — the texture shows straight through it,
 * it is a 1px hairline only. The headshot is centred ON the card's bottom edge by design:
 * cy 1047 sits inside a card that ends at y 1056.49, so roughly the lower half of the photo
 * hangs below the card border. Draw the card before the headshot so the photo's own ring
 * covers the border where the two overlap, exactly as the reference shows.
 */
import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable, PhotoTransform } from "@/tools/_shared/render";
import { drawableSize } from "@/tools/_shared/render";

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

export const REVIEW_LIMITS = { quote: 600, reviewerName: 40, agentName: 32, agentTitle: 28 } as const;

export type ReviewInput = {
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

export const HEADSHOT_BOX = { cx: REVIEW.headshot.cx, cy: REVIEW.headshot.cy, w: REVIEW.headshot.r * 2, h: REVIEW.headshot.r * 2 };

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

function drawStars(ctx: CanvasRenderingContext2D, count: number) {
  const S = REVIEW.stars;
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

function drawHeadshotPlaceholder(ctx: CanvasRenderingContext2D) {
  const h = REVIEW.headshot;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(h.cx - h.r, h.cy - h.r, h.r * 2, h.r * 2);
}

export function renderReview(ctx: CanvasRenderingContext2D, input: ReviewInput, scale = 1) {
  const T = REVIEW;
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
  drawStars(ctx, input.stars);

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
    const r = coverRect(input.headshot, HEADSHOT_BOX, input.headshotTransform);
    ctx.drawImage(input.headshot, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    drawHeadshotPlaceholder(ctx);
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
