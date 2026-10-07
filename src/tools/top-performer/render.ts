import { POST_FONT_STACK } from "@/tools/_shared/font";
import { drawableSize, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { PERFORMER, type StatsLayout } from "./template";

export type PerformerInput = {
  layout: StatsLayout;
  wordmark: Drawable | null;
  background: Drawable | null;
  backgroundTransform: PhotoTransform;
  person: Drawable | null;
  personTransform: PhotoTransform;
  qr: Drawable | null;
  name: string;
  designation: string;
  rank: string;
  period: string;
  amount: string;
  transactions: string;
  primary: string;
  secondary: string;
  showPlaceholders?: boolean;
};

type Box = { x: number; y: number; w: number; h: number };

const font = (weight: number, size: number) => `${weight} ${size}px ${POST_FONT_STACK}`;
const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

export const BACKGROUND_BOX: Box = { x: 0, y: 0, w: PERFORMER.width, h: PERFORMER.height };
export const PERSON_BOX: Box = PERFORMER.person;

/** Cover-fit into `b`, then zoom/offset (offset clamped so the box stays covered). */
export function coverRect(img: Drawable, b: Box, t: PhotoTransform) {
  const { w: iw, h: ih } = drawableSize(img);
  const s = Math.max(b.w / iw, b.h / ih) * clamp(t.zoom, 1, 3);
  const w = iw * s;
  const h = ih * s;
  const ox = clamp(t.offsetX, -(w - b.w) / 2, (w - b.w) / 2);
  const oy = clamp(t.offsetY, -(h - b.h) / 2, (h - b.h) / 2);
  return { x: b.x + b.w / 2 + ox - w / 2, y: b.y + b.h / 2 + oy - h / 2, w, h, clamped: { zoom: clamp(t.zoom, 1, 3), offsetX: ox, offsetY: oy } };
}

/** Width of `text` letter-spaced by `tracking` (no trailing space after the last letter). */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  return ctx.measureText(text).width + tracking * Math.max(0, [...text].length - 1);
}

/** Shrink until `text` (with tracking scaled alongside) fits `maxWidth`. */
function fitted(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number, tracking = 0) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = trackedWidth(ctx, text, tracking * (fs / size));
    if (w <= maxWidth || fs <= minSize) return fs;
    fs = Math.max(minSize, Math.min(fs - 1, Math.floor(fs * (maxWidth / w))));
  }
}

/** Centred on `cx`, letter-spaced by `tracking` px. */
function drawCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking = 0) {
  ctx.textAlign = "left";
  let x = cx - trackedWidth(ctx, text, tracking) / 2;
  if (!tracking) return ctx.fillText(text, x, y);
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
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

function placeholder(ctx: CanvasRenderingContext2D, b: Box, label: string) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = font(300, 26);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
  ctx.restore();
}

/** "Secured #1 for Q3, closing on a high note" — rank and period optional. */
export function headlineLine1(rank: string, period: string) {
  const r = rank.trim().replace(/^#/, "");
  const p = period.trim();
  return ["Secured", r && `#${r}`, p && `for ${p},`, "closing on a high note"].filter(Boolean).join(" ").replace(/ ,/g, ",");
}

export function renderPerformer(ctx: CanvasRenderingContext2D, input: PerformerInput, scale = 1) {
  const T = PERFORMER;
  const card = { ...T.card[input.layout], y: T.card.y, h: T.card.h };
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, T.width, T.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "ltr";

  // 1. Background photo (or navy), then the top wash so the header always reads.
  ctx.fillStyle = `rgb(${T.navy})`;
  ctx.fillRect(0, 0, T.width, T.height);
  if (input.background) {
    const r = coverRect(input.background, BACKGROUND_BOX, input.backgroundTransform);
    ctx.drawImage(input.background, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    placeholder(ctx, { x: 0, y: 560, w: T.width, h: 420 }, "Background photo");
  }
  const wash = ctx.createLinearGradient(0, 0, 0, T.height);
  wash.addColorStop(0, `rgba(${T.navy},1)`);
  wash.addColorStop(T.wash.solidTo, `rgba(${T.navy},0.96)`);
  wash.addColorStop(T.wash.clearAt, `rgba(${T.navy},0)`);
  wash.addColorStop(1, `rgba(${T.navy},0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, T.width, T.height);

  // 2. The agent, then the header copy over everything above the card.
  if (input.person) {
    const r = coverRect(input.person, PERSON_BOX, input.personTransform);
    ctx.drawImage(input.person, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    placeholder(ctx, { x: PERSON_BOX.x + 120, y: PERSON_BOX.y + 40, w: PERSON_BOX.w - 240, h: 600 }, "Agent photo");
  }

  if (input.wordmark) ctx.drawImage(input.wordmark, T.wordmark.x, T.wordmark.y, T.wordmark.w, T.wordmark.h);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = T.name.color;
  const name = input.name.trim();
  if (name) {
    const fs = fitted(ctx, name, T.name.weight, T.name.size, T.name.minSize, T.name.maxWidth, T.name.tracking);
    ctx.font = font(T.name.weight, fs);
    drawCentered(ctx, name, T.width / 2, T.name.baseline, T.name.tracking * (fs / T.name.size));
  }
  const designation = input.designation.trim().toUpperCase();
  if (designation) {
    const D = T.designation;
    const fs = fitted(ctx, designation, D.weight, D.size, D.minSize, D.maxWidth, D.tracking);
    ctx.fillStyle = D.color;
    ctx.font = font(D.weight, fs);
    drawCentered(ctx, designation, T.width / 2, D.baseline, D.tracking * (fs / D.size));
  }

  // 3. Glass card: a blurred copy of what is under it, a dark tint, a hairline.
  const C = T.card;
  ctx.save();
  roundedRect(ctx, card.x, card.y, card.w, card.h, C.radius);
  ctx.clip();
  if ("filter" in ctx) {
    const snap = document.createElement("canvas");
    snap.width = ctx.canvas.width;
    snap.height = ctx.canvas.height;
    snap.getContext("2d")?.drawImage(ctx.canvas, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${C.blur * scale}px)`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = "none";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  ctx.fillStyle = C.tint;
  ctx.fillRect(card.x, card.y, card.w, card.h);
  ctx.restore();
  roundedRect(ctx, card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1, C.radius - 0.5);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Headline: line 1 white, line 2 "with {amount} in sales" with the amount in gold.
  const H = T.headline;
  const line1 = headlineLine1(input.rank, input.period);
  const amount = input.amount.trim();
  const fs1 = fitted(ctx, line1, H.weight, H.size, H.minSize, H.maxWidth);
  ctx.fillStyle = H.color;
  ctx.font = font(H.weight, fs1);
  drawCentered(ctx, line1, T.width / 2, H.baselines[0]);
  if (amount) {
    const parts = ["with ", amount, " in sales"];
    const fs2 = fitted(ctx, parts.join(""), H.weight, H.size, H.minSize, H.maxWidth);
    ctx.font = font(H.weight, fs2);
    let x = T.width / 2 - ctx.measureText(parts.join("")).width / 2;
    ctx.textAlign = "left";
    parts.forEach((p, i) => {
      ctx.fillStyle = i === 1 ? H.gold : H.color;
      ctx.fillText(p, x, H.baselines[1]);
      x += ctx.measureText(p).width;
    });
  }

  // 5. Divider + stats row
  const D = T.divider;
  ctx.fillStyle = D.color;
  ctx.fillRect(D.x, D.y - 0.5, D.w, 1);
  const S = T.stats;
  const cols =
    input.layout === "split"
      ? [
          ["Total sale value", amount],
          ["Primary", input.primary.trim() && `${input.primary.trim()} Trx`],
          ["Secondary", input.secondary.trim() && `${input.secondary.trim()} Trx`],
        ]
      : [
          ["Total sale value", amount],
          ["Transactions", input.transactions.trim()],
        ];
  const layout = S[input.layout];
  ctx.fillStyle = S.rule.color;
  layout.rules.forEach((x) => ctx.fillRect(x - 0.5, S.rule.top, 1, S.rule.bottom - S.rule.top));
  cols.forEach(([label, value], i) => {
    const cx = layout.centers[i];
    ctx.fillStyle = S.label.color;
    ctx.font = font(S.label.weight, S.label.size);
    drawCentered(ctx, label.toUpperCase(), cx, S.label.baseline, S.label.tracking);
    if (value) {
      ctx.fillStyle = S.value.color;
      ctx.font = font(S.value.weight, fitted(ctx, value, S.value.weight, S.value.size, S.value.minSize, S.value.maxWidth));
      drawCentered(ctx, value, cx, S.value.baseline);
    }
  });

  // 6. Permit QR on a white plate, over the card's corner
  const Q = T.qr;
  if (input.qr || input.showPlaceholders) {
    ctx.save();
    roundedRect(ctx, Q.x, Q.y, Q.size, Q.size, Q.radius);
    ctx.fillStyle = input.qr ? "#FFFFFF" : "rgba(255,255,255,0.18)";
    ctx.fill();
    if (input.qr) ctx.drawImage(input.qr, Q.x + Q.pad, Q.y + Q.pad, Q.size - Q.pad * 2, Q.size - Q.pad * 2);
    ctx.restore();
  }
  ctx.restore();
}
