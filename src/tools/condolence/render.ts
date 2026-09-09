/**
 * Canvas renderer for the condolence post — ported from the original (drawRuns / drawParagraph / withThinnedInk).
 */
import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable } from "@/tools/_shared/render";
import { CONDOLENCE } from "./template";

export type CondolenceInput = { artwork: Drawable; lead: string; name: string; message: string };

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;

function lockText(ctx: CanvasRenderingContext2D) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing: string; wordSpacing: string; fontKerning: string };
  ctx.direction = "ltr";
  c.letterSpacing = "0px";
  c.wordSpacing = "0px";
  c.fontKerning = "normal";
}

/** Draw via `paint` on a scratch layer, thin the ink (alpha ^ gamma) inside `bounds`, composite back. */
function withThinnedInk(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; w: number; h: number }, paint: (t: CanvasRenderingContext2D) => void) {
  const gamma = CONDOLENCE.inkGamma;
  const layer = document.createElement("canvas");
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const lctx = layer.getContext("2d");
  if (!lctx) return paint(ctx);
  const m = ctx.getTransform();
  lctx.setTransform(m);
  lockText(lctx);
  paint(lctx);
  const x = Math.max(0, Math.floor(bounds.x * m.a + m.e) - 2);
  const y = Math.max(0, Math.floor(bounds.y * m.d + m.f) - 2);
  const w = Math.min(layer.width - x, Math.ceil(bounds.w * m.a) + 4);
  const h = Math.min(layer.height - y, Math.ceil(bounds.h * m.d) + 4);
  if (w > 0 && h > 0) {
    const image = lctx.getImageData(x, y, w, h);
    const data = image.data;
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * (i / 255) ** gamma);
    for (let i = 3; i < data.length; i += 4) data[i] = lut[data[i]];
    lctx.putImageData(image, x, y);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

/** Shrink until `text` fits maxWidth (never below minFontSize); squeeze horizontally if still too wide. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, maxFontSize: number, minFontSize: number, maxWidth: number) {
  let fontSize = maxFontSize;
  let width = 0;
  for (;;) {
    ctx.font = font(weight, fontSize);
    width = ctx.measureText(text).width;
    if (width <= maxWidth || fontSize <= minFontSize) break;
    fontSize = Math.max(minFontSize, Math.min(fontSize - 1, Math.floor(fontSize * (maxWidth / width))));
  }
  return { fontSize, squeeze: width > maxWidth ? maxWidth / width : 1 };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, weight: number, fontSize: number, maxWidth: number) {
  ctx.font = font(weight, fontSize);
  const lines: string[] = [];
  let current = "";
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

export function renderCondolence(ctx: CanvasRenderingContext2D, input: CondolenceInput, scale = 1) {
  const T = CONDOLENCE;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lockText(ctx);
  ctx.drawImage(input.artwork, 0, 0, T.width, T.height);

  // Line 1: "<relation> of our colleague" in gold + " <Name>." in white — fitted as one string.
  const lead = input.lead.trim();
  const name = input.name.trim();
  if (lead || name) {
    const L = T.lead;
    const joined = [lead, name].filter(Boolean).join(" ");
    const f = fit(ctx, joined, L.weight, L.maxFontSize, L.minFontSize, L.maxWidth);
    withThinnedInk(ctx, { x: L.x - 4, y: L.cy - f.fontSize * 0.9, w: L.maxWidth + 8, h: f.fontSize * 1.6 }, (t) => {
      t.save();
      lockText(t);
      t.textBaseline = "middle";
      t.textAlign = "left";
      t.translate(L.x, L.cy);
      if (f.squeeze !== 1) t.scale(f.squeeze, 1);
      t.font = font(L.weight, f.fontSize);
      let x = 0;
      if (lead) {
        const piece = name ? `${lead} ` : lead;
        t.fillStyle = T.colors.lead;
        t.fillText(piece, x, 0);
        x += t.measureText(piece).width;
      }
      if (name) {
        t.fillStyle = T.colors.name;
        t.fillText(name, x, 0);
      }
      t.restore();
    });
  }

  // Closing paragraph: wrap, shrink until ≤ maxLines, thin ink.
  const message = input.message.trim();
  if (message) {
    const M = T.message;
    let fontSize: number = M.maxFontSize;
    let lines = wrap(ctx, message, M.weight, fontSize, M.maxWidth);
    while (lines.length > M.maxLines && fontSize > M.minFontSize) {
      fontSize = Math.max(M.minFontSize, fontSize - 1);
      lines = wrap(ctx, message, M.weight, fontSize, M.maxWidth);
    }
    const leading = M.lineHeight * (fontSize / M.maxFontSize);
    const height = fontSize * 1.6 + (lines.length - 1) * leading;
    withThinnedInk(ctx, { x: M.x - 4, y: M.cy - fontSize * 0.9, w: M.maxWidth + 8, h: height }, (t) => {
      t.save();
      lockText(t);
      t.fillStyle = T.colors.message;
      t.textBaseline = "middle";
      t.textAlign = "left";
      t.font = font(M.weight, fontSize);
      lines.forEach((line, i) => t.fillText(line, M.x, M.cy + i * leading));
      t.restore();
    });
  }
  ctx.restore();
}
