import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable } from "@/tools/_shared/render";
import { MARRIAGE } from "./template";

export type MarriageInput = { artwork: Drawable; name: string; title: string; message: string };

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;

function fitted(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width;
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.min(fs - 1, Math.floor(fs * (maxWidth / w))));
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

/** Centred text with manual letter-spacing (canvas letterSpacing is locked to 0 for font fidelity). */
function drawTracked(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, tracking: number) {
  const chars = [...text];
  const total = chars.reduce((s, ch) => s + ctx.measureText(ch).width, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of chars) {
    ctx.fillText(ch, x, cy);
    x += ctx.measureText(ch).width + tracking;
  }
  ctx.textAlign = align;
}

export function renderMarriage(ctx: CanvasRenderingContext2D, input: MarriageInput, scale = 1) {
  const T = MARRIAGE;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";
  ctx.drawImage(input.artwork, 0, 0, T.width, T.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const name = input.name.trim();
  if (name) {
    ctx.fillStyle = T.name.color;
    ctx.font = font(T.name.weight, fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth));
    ctx.fillText(name, T.width / 2, T.name.cy);
  }

  const title = input.title.trim().toUpperCase();
  if (title) {
    ctx.fillStyle = T.title.color;
    let fs: number = T.title.size;
    for (;;) {
      ctx.font = font(T.title.weight, fs);
      const w = [...title].reduce((s, ch) => s + ctx.measureText(ch).width, 0) + T.title.tracking * (title.length - 1);
      if (w <= T.title.maxWidth || fs <= T.title.minSize) break;
      fs = Math.max(T.title.minSize, fs - 1);
    }
    drawTracked(ctx, title, T.width / 2, T.title.cy, T.title.tracking * (fs / T.title.size));
  }

  // Message: wrap at the design size; if it needs more than maxLines, step the size down.
  ctx.fillStyle = T.message.color;
  let fs: number = T.message.size;
  let lines: string[] = [];
  for (;;) {
    ctx.font = font(T.message.weight, fs);
    lines = wrap(ctx, input.message, T.message.maxWidth);
    if (lines.length <= T.message.maxLines || fs <= T.message.minSize) break;
    fs -= 1;
  }
  lines.forEach((line, i) => ctx.fillText(line, T.width / 2, T.message.cy + i * T.message.lineHeight));
  ctx.restore();
}
