/**
 * LISTING POSTS — "Just Sold" / "Just Listed".
 * Geometry measured from Figma: Images-Vol.02 › "Instagram Story – 22 2" (node 685:60), 1080 × 1440.
 * The property photo is the whole background; everything else is drawn in code so the
 * frosted card really blurs whatever photo sits behind it.
 */
import { POST_FONT_STACK } from "./font";
import type { Drawable, PhotoTransform } from "./render";
import { drawableSize } from "./render";

export type ListingVariant = "just-sold" | "just-listed";

export const LISTING = {
  width: 1080,
  height: 1440,
  wordmark: { text: "provident.", cx: 540, cy: 114, size: 41, weight: 300 },
  headline: { cy: 259, size: 140, weight: 400, tracking: -7, maxWidth: 960 },
  card: { x: 59.5, y: 1004.5, w: 960, h: 377, radius: 24, fill: "rgba(26,41,66,0.5)", border: "rgba(255,255,255,0.33)", blur: 6.55 },
  // Left column starts at card.x + 50 padding.
  col: { x: 109.5, w: 536 },
  listing: { top: 1054, size: 27, weight: 300, lineHeight: 34 },
  price: { top: 1095, size: 55, weight: 400, lineHeight: 69 },
  divider: { y: 1205, w: 536, color: "rgba(255,255,255,0.33)" },
  agentName: { top: 1246, size: 35, weight: 400, lineHeight: 44, maxWidth: 536 },
  agentTitle: { top: 1303, size: 24, weight: 500, lineHeight: 30, tracking: 0.5, maxWidth: 536 },
  headshot: { cx: 840, cy: 1193.5, r: 148, border: "rgba(255,255,255,0.9)" },
  qr: { x: 879, y: 1240, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

export const HEADLINES: Record<ListingVariant, string> = { "just-sold": "Just Sold", "just-listed": "Just Listed" };

export const LISTING_LIMITS = { listing: 50, price: 20, agentName: 32, agentTitle: 28 } as const;

export type ListingInput = {
  variant: ListingVariant;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  listing: string;
  price: string;
  agentName: string;
  agentTitle: string;
  headshot: Drawable | null;
  headshotTransform: PhotoTransform;
  /** The agent's DLD QR permit image (mandatory for export; preview shows an empty tile until uploaded). */
  qr: Drawable | null;
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

export const PHOTO_BOX = { cx: LISTING.width / 2, cy: LISTING.height / 2, w: LISTING.width, h: LISTING.height };
export const HEADSHOT_BOX = { cx: LISTING.headshot.cx, cy: LISTING.headshot.cy, w: LISTING.headshot.r * 2, h: LISTING.headshot.r * 2 };

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

/** Draw one line, shrinking the font until it fits `maxWidth` (never below 60% of the size). */
function fitLine(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, tracking = 0) {
  let fs = size;
  for (;;) {
    ctx.font = font(weight, fs);
    const w = ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
    if (w <= maxWidth || fs <= size * 0.6) return { fontSize: fs, width: Math.min(w, maxWidth) };
    fs = Math.max(size * 0.6, Math.floor(fs * (maxWidth / w)));
  }
}

function drawTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "center") {
  if (!tracking) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }
  const total = ctx.measureText(text).width + tracking * (text.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, LISTING.height);
  g.addColorStop(0, "#2F4960");
  g.addColorStop(1, "#1A2942");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LISTING.width, LISTING.height);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = font(300, 28);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Property photo", LISTING.width / 2, 640);
}

export function renderListing(ctx: CanvasRenderingContext2D, input: ListingInput, scale = 1) {
  const L = LISTING;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, L.width, L.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lockText(ctx);

  // 1. Photo (cover)
  if (input.photo) {
    const r = coverRect(input.photo, PHOTO_BOX, input.photoTransform);
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    drawPhotoPlaceholder(ctx);
  }

  // 2. Wordmark + headline
  ctx.fillStyle = L.color;
  ctx.textBaseline = "middle";
  ctx.font = font(L.wordmark.weight, L.wordmark.size);
  ctx.textAlign = "center";
  ctx.fillText(L.wordmark.text, L.wordmark.cx, L.wordmark.cy);

  const headline = HEADLINES[input.variant];
  const hf = fitLine(ctx, headline, L.headline.weight, L.headline.size, L.headline.maxWidth, L.headline.tracking);
  ctx.font = font(L.headline.weight, hf.fontSize);
  drawTracked(ctx, headline, L.width / 2, L.headline.cy, L.headline.tracking * (hf.fontSize / L.headline.size), "center");

  // 3. Frosted card: blurred copy of the photo clipped to the card, then tint + border
  const c = L.card;
  ctx.save();
  roundedRect(ctx, c.x, c.y, c.w, c.h, c.radius);
  ctx.clip();
  if (input.photo && "filter" in ctx) {
    const r = coverRect(input.photo, PHOTO_BOX, input.photoTransform);
    ctx.filter = `blur(${c.blur}px)`;
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
    ctx.filter = "none";
  }
  ctx.fillStyle = c.fill;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.restore();
  ctx.save();
  roundedRect(ctx, c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1, c.radius - 0.5);
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Card text (left column)
  ctx.fillStyle = L.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const listing = input.listing.trim();
  if (listing) {
    const f = fitLine(ctx, listing, L.listing.weight, L.listing.size, L.col.w);
    ctx.font = font(L.listing.weight, f.fontSize);
    ctx.fillText(listing, L.col.x, L.listing.top + L.listing.lineHeight / 2);
  }
  const price = input.price.trim();
  if (price) {
    const f = fitLine(ctx, price, L.price.weight, L.price.size, L.col.w);
    ctx.font = font(L.price.weight, f.fontSize);
    ctx.fillText(price, L.col.x, L.price.top + L.price.lineHeight / 2);
  }

  ctx.fillStyle = L.divider.color;
  ctx.fillRect(L.col.x, L.divider.y - 0.5, L.divider.w, 1);

  ctx.fillStyle = L.color;
  const name = input.agentName.trim();
  if (name) {
    const f = fitLine(ctx, name, L.agentName.weight, L.agentName.size, L.agentName.maxWidth);
    ctx.font = font(L.agentName.weight, f.fontSize);
    ctx.fillText(name, L.col.x, L.agentName.top + L.agentName.lineHeight / 2);
  }
  const title = input.agentTitle.trim().toUpperCase();
  if (title) {
    const f = fitLine(ctx, title, L.agentTitle.weight, L.agentTitle.size, L.agentTitle.maxWidth, L.agentTitle.tracking);
    ctx.font = font(L.agentTitle.weight, f.fontSize);
    drawTracked(ctx, title, L.col.x, L.agentTitle.top + L.agentTitle.lineHeight / 2, L.agentTitle.tracking, "left");
  }

  // 5. Headshot circle
  const h = L.headshot;
  ctx.save();
  ctx.beginPath();
  ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2);
  ctx.clip();
  if (input.headshot) {
    const r = coverRect(input.headshot, HEADSHOT_BOX, input.headshotTransform);
    ctx.drawImage(input.headshot, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(h.cx - h.r, h.cy - h.r, h.r * 2, h.r * 2);
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

  // 6. QR tile (white rounded square with the DLD permit code inside)
  if (input.qr || input.showPlaceholders) {
    const q = L.qr;
    ctx.save();
    roundedRect(ctx, q.x, q.y, q.size, q.size, q.radius);
    ctx.fillStyle = input.qr ? "#FFFFFF" : "rgba(255,255,255,0.35)";
    ctx.fill();
    ctx.restore();
  }
  if (input.qr) {
    const q = L.qr;
    // Fit the uploaded QR image inside the tile (keeps its aspect; most permit QRs are square).
    const { w: iw, h: ih } = drawableSize(input.qr);
    const inner = q.size - q.pad * 2;
    const s = Math.min(inner / iw, inner / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx.drawImage(input.qr, q.x + (q.size - dw) / 2, q.y + (q.size - dh) / 2, dw, dh);
  }

  ctx.restore();
}
