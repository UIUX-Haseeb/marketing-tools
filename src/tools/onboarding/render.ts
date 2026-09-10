import { POST_FONT_STACK } from "@/tools/_shared/font";
import { drawableSize, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { ONBOARDING } from "./template";

export type OnboardingInput = {
  background: Drawable;
  bottomFade: Drawable | null;
  wordmark: Drawable | null;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  name: string;
  title: string;
  showPlaceholders?: boolean;
};

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;
const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** Cover-fit into the photo box, then zoom/offset (offset clamped so the box stays covered). */
export function photoRect(img: Drawable, t: PhotoTransform) {
  const b = ONBOARDING.photo;
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

export function renderOnboarding(ctx: CanvasRenderingContext2D, input: OnboardingInput, scale = 1) {
  const T = ONBOARDING;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";

  // 1. Background artwork
  ctx.drawImage(input.background, 0, 0, T.width, T.height);

  // 2. Photo (clipped to its box so a tall photo never spills over the headline)
  if (input.photo) {
    const r = photoRect(input.photo, input.photoTransform);
    ctx.save();
    ctx.beginPath();
    ctx.rect(T.photo.x, T.photo.y, T.photo.w, T.photo.h);
    ctx.clip();
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
    ctx.restore();
  } else if (input.showPlaceholders) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(T.photo.x, T.photo.y, T.photo.w, T.photo.h);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = font(300, 26);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Photo (transparent PNG works best)", T.width / 2, T.photo.y + T.photo.h / 2);
    ctx.restore();
  }

  // 3. Bottom fade over the photo
  if (input.bottomFade) ctx.drawImage(input.bottomFade, 0, T.height - T.fade.h, T.width, T.fade.h);

  // 3b. Wordmark
  if (input.wordmark) ctx.drawImage(input.wordmark, T.wordmark.x, T.wordmark.y, T.wordmark.w, T.wordmark.h);

  // 4. Text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = T.headline.color;
  ctx.font = font(T.headline.weight, fitted(ctx, T.headline.text, T.headline.weight, T.headline.size, T.headline.size * 0.7, T.headline.maxWidth));
  ctx.fillText(T.headline.text, T.width / 2, T.headline.cy);

  ctx.fillStyle = T.sub.color;
  ctx.font = font(T.sub.weight, T.sub.size);
  T.sub.lines.forEach((line, i) => ctx.fillText(line, T.width / 2, T.sub.cy[i]));

  const name = input.name.trim();
  if (name) {
    ctx.fillStyle = T.name.color;
    ctx.font = font(T.name.weight, fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth));
    ctx.fillText(name, T.width / 2, T.name.cy);
  }
  const title = input.title.trim().toUpperCase();
  if (title) {
    ctx.fillStyle = T.title.color;
    ctx.font = font(T.title.weight, fitted(ctx, title, T.title.weight, T.title.size, T.title.minSize, T.title.maxWidth));
    ctx.fillText(title, T.width / 2, T.title.cy);
  }
  ctx.restore();
}
