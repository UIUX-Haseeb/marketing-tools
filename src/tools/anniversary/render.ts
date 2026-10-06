import { POST_FONT_STACK } from "@/tools/_shared/font";
import { drawableSize, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { ANNIVERSARY, ANNIVERSARY_COPY } from "./template";

export type AnniversaryInput = {
  background: Drawable;
  wordmark: Drawable | null;
  script: Drawable | null;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  years: number;
  name: string;
  designation: string;
  showPlaceholders?: boolean;
};

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;
const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** Cover-fit into the photo box, then zoom/offset (offset clamped so the box stays covered). */
export function photoRect(img: Drawable, t: PhotoTransform) {
  const b = ANNIVERSARY.photo;
  const { w: iw, h: ih } = drawableSize(img);
  const s = Math.max(b.w / iw, b.h / ih) * clamp(t.zoom, 1, 3);
  const w = iw * s;
  const h = ih * s;
  const maxX = (w - b.w) / 2;
  const maxY = (h - b.h) / 2;
  const ox = clamp(t.offsetX, -maxX, maxX);
  const oy = clamp(t.offsetY, -maxY, maxY);
  return { x: b.x + b.w / 2 + ox - w / 2, y: b.y + b.h / 2 + oy - h / 2, w, h, clamped: { zoom: clamp(t.zoom, 1, 3), offsetX: ox, offsetY: oy } };
}

/** Shrink `text` (plus its tracking) until it fits `maxWidth`. */
function fitted(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number, tracking = 0) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width + tracking * (fs / size) * Math.max(0, text.length - 1);
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.min(fs - 1, Math.floor(fs * (maxWidth / w))));
  }
}

/**
 * The x to draw `text` at so its visible ink — not its origin — starts at `left`. The artwork
 * lines every text block up by ink, so a name starting with "O" and one starting with "M" both
 * sit on the same edge despite their different side bearings.
 */
function inkX(ctx: CanvasRenderingContext2D, text: string, left: number) {
  return left + ctx.measureText(text).actualBoundingBoxLeft;
}

/** Left-aligned text, letter-spaced by `tracking` px, its first glyph's ink starting at `left`. */
function drawTracked(ctx: CanvasRenderingContext2D, text: string, left: number, y: number, tracking: number) {
  ctx.textAlign = "left";
  let x = inkX(ctx, text.charAt(0), left);
  if (!tracking) return ctx.fillText(text, x, y);
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
  }
}

/** Greedy word wrap at the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const probe = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(probe).width <= maxWidth) line = probe;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The anniversary year, behind the photo: Google Sans Flex drawn as a hollow outline (the
 * reference's treatment), finished as glossy brass — a soft drop shadow for depth, a metallic
 * gradient with a bright band across the middle, and a thin glint along the upper edges.
 * Sized from the glyph's own measured bounds so any number fills the reference box.
 */
function drawNumeral(ctx: CanvasRenderingContext2D, text: string) {
  const N = ANNIVERSARY.numeral;
  ctx.font = font(N.weight, 1000);
  const m = ctx.measureText(text);
  const w1000 = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h1000 = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const size = 1000 * Math.min(N.height / h1000, N.maxWidth / w1000);
  const k = size / 1000;
  const w = w1000 * k;
  const h = h1000 * k;
  const left = Math.min(N.cx, N.right - w / 2) - w / 2;
  const top = N.bottom - h;
  const x = left + m.actualBoundingBoxLeft * k;
  const y = N.bottom - m.actualBoundingBoxDescent * k;

  ctx.save();
  ctx.font = font(N.weight, size);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Depth: a dark stroke with a soft shadow beneath, so the metal reads as raised off the navy.
  ctx.save();
  ctx.shadowColor = "rgba(3, 8, 20, 0.6)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.strokeStyle = "#3B2A12";
  ctx.lineWidth = N.stroke;
  ctx.strokeText(text, x, y);
  ctx.restore();

  // 2. Brass: deep bronze → warm brass → a bright gloss band → brass → deep bronze.
  const brass = ctx.createLinearGradient(left, top, left + w * 0.35, top + h);
  brass.addColorStop(0, "#F3DFAE");
  brass.addColorStop(0.12, "#D6B16C");
  brass.addColorStop(0.3, "#9B7637");
  brass.addColorStop(0.46, "#E6C98B");
  brass.addColorStop(0.52, "#FFF2CF");
  brass.addColorStop(0.58, "#CFA963");
  brass.addColorStop(0.78, "#8C6831");
  brass.addColorStop(1, "#5E4321");
  ctx.strokeStyle = brass;
  ctx.lineWidth = N.stroke;
  ctx.strokeText(text, x, y);

  // 3. Gloss: a thin specular glint riding the upper-left side of the stroke.
  const glint = ctx.createLinearGradient(left, top, left + w, top + h);
  glint.addColorStop(0, "rgba(255, 249, 230, 0.95)");
  glint.addColorStop(0.32, "rgba(255, 244, 214, 0.15)");
  glint.addColorStop(0.5, "rgba(255, 244, 214, 0.7)");
  glint.addColorStop(0.62, "rgba(255, 244, 214, 0)");
  glint.addColorStop(1, "rgba(255, 244, 214, 0)");
  ctx.strokeStyle = glint;
  ctx.lineWidth = N.stroke * 0.32;
  ctx.strokeText(text, x - N.stroke * 0.18, y - N.stroke * 0.18);
  ctx.restore();
}

export function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function renderAnniversary(ctx: CanvasRenderingContext2D, input: AnniversaryInput, scale = 1) {
  const T = ANNIVERSARY;
  const b = T.photo;
  const n = Math.round(input.years);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";

  // 1. Background artwork
  ctx.drawImage(input.background, 0, 0, T.width, T.height);

  // 2. The numeral, behind the photo
  if (n >= T.years.min) drawNumeral(ctx, String(n));

  // 3. Photo — clipped on the left so it never runs into the text column; free above, flush right/bottom.
  if (input.photo) {
    const r = photoRect(input.photo, input.photoTransform);
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, 0, T.width - b.x, T.height);
    ctx.clip();
    ctx.shadowColor = "rgba(3, 8, 20, 0.45)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = -8;
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
    ctx.restore();
  } else if (input.showPlaceholders) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(b.x + 80, b.y + 120, b.w - 160, b.h - 120);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = font(300, 26);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Photo", b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  }

  // 4. Script, then the text column (all left-aligned), then the wordmark
  if (input.script) ctx.drawImage(input.script, T.script.x, T.script.y, T.script.w, T.script.h);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  if (n >= T.years.min) {
    ctx.fillStyle = T.header.color;
    ctx.font = font(T.header.weight, T.header.size);
    const lines = [ANNIVERSARY_COPY.header(n), ANNIVERSARY_COPY.headerLine2];
    lines.forEach((line, i) => ctx.fillText(line, inkX(ctx, line, T.left), T.header.baselines[i]));
  }

  const name = input.name.trim();
  if (name) {
    ctx.fillStyle = T.name.color;
    ctx.font = font(T.name.weight, fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth));
    ctx.fillText(name, inkX(ctx, name, T.left), T.name.baseline);
  }

  const designation = input.designation.trim().toUpperCase();
  if (designation) {
    const D = T.designation;
    const fs = fitted(ctx, designation, D.weight, D.size, D.minSize, D.maxWidth, D.tracking);
    ctx.fillStyle = D.color;
    ctx.font = font(D.weight, fs);
    drawTracked(ctx, designation, T.left, D.baseline, D.tracking * (fs / D.size));
  }

  ctx.fillStyle = T.divider.color;
  ctx.fillRect(T.divider.x, T.divider.y - T.divider.width / 2, T.divider.w, T.divider.width);

  if (n >= T.years.min) {
    const M = T.message;
    ctx.fillStyle = M.color;
    ctx.font = font(M.weight, M.size);
    const first = firstNameOf(name);
    const lines = [ANNIVERSARY_COPY.messageFirst(n), ...wrap(ctx, ANNIVERSARY_COPY.messageMiddle(n, first || "you"), M.maxWidth), ...M.closing];
    lines.forEach((line, i) => ctx.fillText(line, inkX(ctx, line, T.left), M.baseline + i * M.lineHeight));
  }

  if (input.wordmark) ctx.drawImage(input.wordmark, T.wordmark.x, T.wordmark.y, T.wordmark.w, T.wordmark.h);
  ctx.restore();
}
