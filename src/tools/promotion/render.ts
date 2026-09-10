import { POST_FONT_STACK } from "@/tools/_shared/font";
import { drawableSize, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { PROMOTION } from "./template";

export type PromotionInput = {
  background: Drawable;
  frame: Drawable | null;
  wordmark: Drawable | null;
  script: Drawable | null;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  name: string;
  title: string;
  showPlaceholders?: boolean;
};

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;
const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** Cover-fit into the frame box, then zoom/offset (offset clamped so the box stays covered). */
export function photoRect(img: Drawable, t: PhotoTransform) {
  const b = PROMOTION.photo;
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

function fitted(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width;
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.min(fs - 1, Math.floor(fs * (maxWidth / w))));
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
    const r = photoRect(input.photo, input.photoTransform);
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
