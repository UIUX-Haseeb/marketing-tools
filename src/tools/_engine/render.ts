/**
 * Canvas renderer — ported 1:1 from the original General Post Generator (src/lib/render.ts).
 */
import { POST_FONT_STACK } from "./font";
import type { PostTemplate, TextSlot } from "./templates";

export type Drawable = HTMLImageElement | HTMLCanvasElement | ImageBitmap;
export type PhotoTransform = { zoom: number; offsetX: number; offsetY: number };

export const IDENTITY_TRANSFORM: PhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export type RenderInput = {
  template: PostTemplate;
  templateImage: Drawable;
  photo?: Drawable | null;
  transform: PhotoTransform;
  name: string;
  jobTitle: string;
  showPlaceholder?: boolean;
};

function clamp(v: number, lo: number, hi: number) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, v));
}

export function drawableSize(d: Drawable) {
  const anyD = d as HTMLImageElement;
  const w = "naturalWidth" in d ? anyD.naturalWidth || d.width : d.width;
  const h = "naturalHeight" in d ? anyD.naturalHeight || d.height : d.height;
  return { w, h };
}

function coverScale(template: PostTemplate, photo: Drawable) {
  const area = template.photoArea;
  if (!area) return 1;
  const { w, h } = drawableSize(photo);
  return (area.r * 2) / Math.min(w, h);
}

export function clampTransform(template: PostTemplate, photo: Drawable, transform: PhotoTransform): PhotoTransform {
  const zoom = clamp(transform.zoom, MIN_ZOOM, MAX_ZOOM);
  const area = template.photoArea;
  if (!area) return { zoom, offsetX: 0, offsetY: 0 };
  const { w, h } = drawableSize(photo);
  const s = coverScale(template, photo) * zoom;
  const maxOffsetX = (w * s) / 2 - area.r;
  const maxOffsetY = (h * s) / 2 - area.r;
  return {
    zoom,
    offsetX: clamp(transform.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(transform.offsetY, -maxOffsetY, maxOffsetY),
  };
}

function photoRect(template: PostTemplate, photo: Drawable, transform: PhotoTransform) {
  const area = template.photoArea;
  if (!area) return { x: 0, y: 0, w: 0, h: 0 };
  const t = clampTransform(template, photo, transform);
  const { w: iw, h: ih } = drawableSize(photo);
  const s = coverScale(template, photo) * t.zoom;
  const w = iw * s;
  const h = ih * s;
  return { x: area.cx + t.offsetX - w / 2, y: area.cy + t.offsetY - h / 2, w, h };
}

const slotFont = (slot: TextSlot, size: number) => `${slot.fontWeight} ${size}px ${POST_FONT_STACK}`;

function lockTextRendering(ctx: CanvasRenderingContext2D) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing: string; wordSpacing: string; fontStretch: string; fontVariantCaps: string };
  ctx.direction = "ltr";
  c.letterSpacing = "0px";
  c.wordSpacing = "0px";
  c.fontKerning = "normal";
  c.fontStretch = "normal";
  c.fontVariantCaps = "normal";
}

function measureTracked(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const base = ctx.measureText(text).width;
  if (!tracking || text.length < 2) return base;
  return base + tracking * (text.length - 1);
}

export function fitText(ctx: CanvasRenderingContext2D, slot: TextSlot, raw: string) {
  const text = (slot.uppercase ? raw.toUpperCase() : raw).trim();
  if (!text) return { text: "", fontSize: slot.maxFontSize, squeeze: 1, width: 0 };
  lockTextRendering(ctx);
  let fontSize = slot.maxFontSize;
  let width = 0;
  for (;;) {
    ctx.font = slotFont(slot, fontSize);
    width = measureTracked(ctx, text, slot.letterSpacing * fontSize);
    if (width <= slot.maxWidth || fontSize <= slot.minFontSize) break;
    const guess = Math.floor(fontSize * (slot.maxWidth / width));
    fontSize = Math.max(slot.minFontSize, Math.min(fontSize - 1, guess));
  }
  const squeeze = width > slot.maxWidth ? slot.maxWidth / width : 1;
  return { text, fontSize, squeeze, width: Math.min(width, slot.maxWidth) };
}

function drawSlot(ctx: CanvasRenderingContext2D, slot: TextSlot, raw: string) {
  const fitted = fitText(ctx, slot, raw);
  if (!fitted.text) return;
  const tracking = slot.letterSpacing * fitted.fontSize;
  ctx.save();
  lockTextRendering(ctx);
  ctx.fillStyle = slot.color;
  ctx.textBaseline = "middle";
  ctx.translate(slot.cx, slot.cy);
  if (fitted.squeeze !== 1) ctx.scale(fitted.squeeze, 1);
  ctx.font = slotFont(slot, fitted.fontSize);
  if (!tracking) {
    ctx.textAlign = "center";
    ctx.fillText(fitted.text, 0, 0);
  } else {
    ctx.textAlign = "left";
    const total = measureTracked(ctx, fitted.text, tracking);
    let x = -total / 2;
    for (const ch of fitted.text) {
      ctx.fillText(ch, x, 0);
      x += ctx.measureText(ch).width + tracking;
    }
  }
  ctx.restore();
}

function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D, area: NonNullable<PostTemplate["photoArea"]>) {
  const { cx, cy, r } = area;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(26, 41, 66, 0.045)";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(26, 41, 66, 0.085)";
  ctx.lineWidth = r * 0.032;
  const step = r * 0.17;
  ctx.beginPath();
  for (let i = -r * 2; i <= r * 2; i += step) {
    ctx.moveTo(cx + i, cy - r);
    ctx.lineTo(cx + i + r * 2, cy + r);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(26, 41, 66, 0.3)";
  ctx.lineWidth = r * 0.016;
  ctx.setLineDash([r * 0.08, r * 0.055]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  const s = r * 0.4;
  ctx.strokeStyle = "rgba(26, 41, 66, 0.44)";
  ctx.lineWidth = r * 0.045;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.28);
  ctx.lineTo(cx, cy - s * 0.62);
  ctx.moveTo(cx - s * 0.44, cy - s * 0.16);
  ctx.lineTo(cx, cy - s * 0.66);
  ctx.lineTo(cx + s * 0.44, cy - s * 0.16);
  ctx.moveTo(cx - s * 0.66, cy + s * 0.28);
  ctx.lineTo(cx - s * 0.66, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.66, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.66, cy + s * 0.28);
  ctx.stroke();
  ctx.restore();
}

/** Draw the full post at template resolution × `scale` into `ctx`. */
export function renderPost(ctx: CanvasRenderingContext2D, input: RenderInput, scale = 1) {
  const { template, templateImage, photo, transform, name, jobTitle } = input;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, template.width, template.height);
  lockTextRendering(ctx);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(templateImage, 0, 0, template.width, template.height);
  if (photo && template.photoArea) {
    const { cx, cy, r, bleed } = template.photoArea;
    const rect = photoRect(template, photo, transform);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + bleed, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(photo, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  } else if (!photo && template.photoArea && input.showPlaceholder) {
    drawPhotoPlaceholder(ctx, template.photoArea);
  }
  drawSlot(ctx, template.slots.name, name);
  if (template.slots.jobTitle) drawSlot(ctx, template.slots.jobTitle, jobTitle);
  ctx.restore();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}
