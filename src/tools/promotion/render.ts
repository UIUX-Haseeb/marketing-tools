import { POST_FONT_STACK } from "@/tools/_shared/font";
import { drawableSize, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { PROMOTION, PROMOTION_EXECUTIVE, type PromotionDesign } from "./template";

export type PromotionInput = {
  design: PromotionDesign;
  background: Drawable;
  /** "standard" only — the gold frame outline. Ignored by "executive". */
  frame: Drawable | null;
  wordmark: Drawable | null;
  script: Drawable | null;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  name: string;
  title: string;
  /** "executive" only — ignored by "standard". */
  department: string;
  showPlaceholders?: boolean;
};

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;
const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** Cover-fit into `box`, then zoom/offset (offset clamped so the box stays covered). */
export function photoRect(img: Drawable, box: { x: number; y: number; w: number; h: number }, t: PhotoTransform) {
  const { w: iw, h: ih } = drawableSize(img);
  const s = Math.max(box.w / iw, box.h / ih) * clamp(t.zoom, 1, 3);
  const w = iw * s;
  const h = ih * s;
  const maxX = (w - box.w) / 2;
  const maxY = (h - box.h) / 2;
  const ox = clamp(t.offsetX, -maxX, maxX);
  const oy = clamp(t.offsetY, -maxY, maxY);
  return { x: box.x + box.w / 2 + ox - w / 2, y: box.y + box.h / 2 + oy - h / 2, w, h, clamped: { zoom: clamp(t.zoom, 1, 3), offsetX: ox, offsetY: oy } };
}

/** Shrink `text` until it (plus tracking, measured at each trial size) fits `maxWidth`. */
function fitted(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number, tracking = 0) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.min(fs - 1, Math.floor(fs * (maxWidth / w))));
  }
}

/** Draw `text` letter-spaced by `tracking` px, anchored at `x` on the given side. */
function drawTracked(ctx: CanvasRenderingContext2D, text: string, x: number, cy: number, tracking: number, align: "left" | "right") {
  if (!tracking) {
    ctx.textAlign = align;
    ctx.fillText(text, x, cy);
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + tracking * Math.max(0, text.length - 1);
  let cx = align === "right" ? x - total : x;
  ctx.textAlign = "left";
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx, cy);
    cx += widths[i] + tracking;
  }
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

export function renderPromotion(ctx: CanvasRenderingContext2D, input: PromotionInput, scale = 1) {
  if (input.design === "executive") return renderExecutive(ctx, input, scale);
  return renderStandard(ctx, input, scale);
}

function renderStandard(ctx: CanvasRenderingContext2D, input: PromotionInput, scale = 1) {
  const T = PROMOTION;
  const b = T.photo;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";

  // 1. Background artwork
  ctx.drawImage(input.background, 0, 0, T.width, T.height);

  // 2. Photo — clipped to the frame's width and bottom edge (rounded corners at the bottom), but
  //    open upwards so a head or shoulders can rise above the frame like a cutout.
  if (input.photo) {
    const r = photoRect(input.photo, b, input.photoTransform);
    ctx.save();
    roundedRect(ctx, b.x, b.y - b.h, b.w, b.h * 2, b.radius);
    ctx.clip();
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
    ctx.restore();
  } else if (input.showPlaceholders) {
    ctx.save();
    roundedRect(ctx, b.x, b.y, b.w, b.h, b.radius);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = font(300, 26);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Photo", b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  }

  // 3. Frame outline above the photo, then the wordmark and the script headline
  if (input.frame) ctx.drawImage(input.frame, 0, 0, T.width, T.height);
  if (input.wordmark) ctx.drawImage(input.wordmark, T.wordmark.x, T.wordmark.y, T.wordmark.w, T.wordmark.h);
  if (input.script) ctx.drawImage(input.script, T.script.x, T.script.y, T.script.w, T.script.h);

  // 4. Text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const name = input.name.trim();
  if (name) {
    ctx.fillStyle = T.name.color;
    ctx.font = font(T.name.weight, fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth));
    ctx.fillText(name, T.width / 2, T.name.cy);
  }
  const title = input.title.trim();
  if (title) {
    const line = T.promo.prefix + title;
    ctx.fillStyle = T.promo.color;
    ctx.font = font(T.promo.weight, fitted(ctx, line, T.promo.weight, T.promo.size, T.promo.minSize, T.promo.maxWidth));
    ctx.fillText(line, T.width / 2, T.promo.cy);
  }
  ctx.fillStyle = T.closing.color;
  ctx.font = font(T.closing.weight, T.closing.size);
  T.closing.lines.forEach((line, i) => ctx.fillText(line, T.width / 2, T.closing.cy[i]));
  ctx.restore();
}

function renderExecutive(ctx: CanvasRenderingContext2D, input: PromotionInput, scale = 1) {
  const T = PROMOTION_EXECUTIVE;
  const b = T.photo;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";

  // 1. Background artwork
  ctx.drawImage(input.background, 0, 0, T.width, T.height);

  // 2. Photo — plain rectangle, clipped to its own box (no frame, no rounding). Drawn under the
  //    text, matching Figma's z-order — the text sits on its own opaque colour so the overlap
  //    with the photo's top-left corner is never a legibility problem.
  if (input.photo) {
    const r = photoRect(input.photo, b, input.photoTransform);
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    ctx.clip();
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
    ctx.restore();
  } else if (input.showPlaceholders) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = font(300, 26);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Photo", b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  }

  // 3. Wordmark and the script headline (no frame outline in this design)
  if (input.wordmark) ctx.drawImage(input.wordmark, T.wordmark.x, T.wordmark.y, T.wordmark.w, T.wordmark.h);
  if (input.script) ctx.drawImage(input.script, T.script.x, T.script.y, T.script.w, T.script.h);

  // 4. Text — all left-aligned to T.<field>.x, except the fixed tag which is right-aligned.
  ctx.textBaseline = "middle";
  const name = input.name.trim();
  if (name) {
    ctx.fillStyle = T.name.color;
    ctx.textAlign = "left";
    ctx.font = font(T.name.weight, fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth));
    ctx.fillText(name, T.name.x, T.name.cy);
  }

  ctx.fillStyle = T.subtitle.color;
  ctx.textAlign = "left";
  ctx.font = font(T.subtitle.weight, T.subtitle.size);
  ctx.fillText(T.subtitle.text, T.subtitle.x, T.subtitle.cy);

  const title = input.title.trim();
  if (title) {
    const line = title + T.role.suffix;
    ctx.fillStyle = T.role.color;
    ctx.font = font(T.role.weight, fitted(ctx, line, T.role.weight, T.role.size, T.role.minSize, T.role.maxWidth));
    ctx.fillText(line, T.role.x, T.role.cy);
  }

  ctx.strokeStyle = T.divider.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(T.divider.x, T.divider.y);
  ctx.lineTo(T.divider.x + T.divider.w, T.divider.y);
  ctx.stroke();

  const department = input.department.trim().toUpperCase();
  if (department) {
    ctx.fillStyle = T.department.color;
    const df = fitted(ctx, department, T.department.weight, T.department.size, T.department.minSize, T.department.maxWidth, T.department.tracking);
    ctx.font = font(T.department.weight, df);
    drawTracked(ctx, department, T.department.x, T.department.cy, T.department.tracking * (df / T.department.size), "left");
  }

  ctx.fillStyle = T.tag.color;
  ctx.font = font(T.tag.weight, T.tag.size);
  drawTracked(ctx, T.tag.text, T.tag.rightX, T.tag.cy, T.tag.tracking, "right");

  ctx.restore();
}
