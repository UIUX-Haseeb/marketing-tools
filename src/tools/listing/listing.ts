/**
 * LISTING POSTS — "Just Sold" / "Just Listed" / "Just Rented".
 * Three VARIANTS (headline + a couple of composition rules) × two DESIGNS (layout) — the
 * user picks the design, the tool page picks the variant. All share one field set: bedrooms,
 * bathrooms, sqft, property type, location, price, agent, headshot, QR.
 *
 * "classic" — geometry measured from Figma: Images-Vol.02 › "Instagram Story – 22 2"
 * (node 685:60), 1080 × 1440, refined since in "Birthday-template" nodes 228:113 (Just Sold),
 * 228:129 (Just Listed) and 222:113 (Just Rented). A frosted card holds the listing/price/
 * agent block; the property photo is the whole background, drawn in code so the frosted card
 * really blurs whatever photo sits behind it.
 *
 * "minimal" — geometry measured from Figma "Birthday-template" nodes 229:128 (Just Sold v1),
 * 229:159 (Just Listed v1), 229:200 (Just Rented v1). No card, no divider, no blur: the
 * listing line and price sit centred directly under the headline, and a smaller headshot
 * floats free near the bottom next to the QR tile.
 *
 * The PRIMARY LINE is composed from bedrooms + property type + location, never typed as one
 * string:
 *   - Just Sold / Just Rented: "{bedrooms}-Bed {propertyType} in {location}", one line.
 *   - Just Listed: bedrooms moves into its own chip (alongside bathrooms and sqft — three
 *     bordered pills, "2 BED" / "7 BATHROOM" / "20,298 SQFT"), so the line below them is just
 *     "{propertyType} in {location}".
 * Just Rented additionally appends " /year" to the price.
 */
import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable, PhotoTransform } from "@/tools/_shared/render";
import { drawableSize } from "@/tools/_shared/render";

export type ListingVariant = "just-sold" | "just-listed" | "just-rented";
export type ListingDesign = "classic" | "minimal";

export const LISTING_DESIGNS: { id: ListingDesign; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

export const HEADLINES: Record<ListingVariant, string> = {
  "just-sold": "Just Sold",
  "just-listed": "Just Listed",
  "just-rented": "Just Rented",
};

/** Just Rented is the only variant with a period on the price ("AED 120,000 /year"). */
const PRICE_SUFFIX: Record<ListingVariant, string> = { "just-sold": "", "just-listed": "", "just-rented": " /year" };

/** Just Listed pulls bedrooms out into its own chip; the other two fold it into the primary line. */
function usesChips(variant: ListingVariant) {
  return variant === "just-listed";
}

const WORDMARK = { text: "provident.", weight: 300, size: 41 } as const;
const HEADLINE_STYLE = { size: 140, weight: 400, tracking: -7, maxWidth: 960 } as const;
const TOP_SCRIM = { h: 520, color: "26,41,66", alpha: 0.72 } as const;
const CHIP_STYLE = { h: 54, padX: 20, radius: 10, gap: 14, size: 17, weight: 500, tracking: 17 * 0.14, border: "rgba(255,255,255,1)", borderWidth: 0.5 } as const;

/** "classic", Just Sold / Just Rented — measured off Figma nodes 228:113 / 222:113. */
export const LISTING = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, cx: 540, cy: 114 },
  headline: { ...HEADLINE_STYLE, cy: 259 },
  topScrim: TOP_SCRIM,
  card: { x: 59.5, y: 1004.5, w: 960, h: 377, radius: 24, fill: "rgba(26,41,66,0.5)", border: "rgba(255,255,255,0.33)", blur: 6.55 },
  col: { x: 109.5, w: 536 },
  primary: { top: 1054, size: 27, weight: 300, lineHeight: 34 },
  price: { top: 1095, size: 55, weight: 400, lineHeight: 69 },
  divider: { y: 1205, w: 536, color: "rgba(255,255,255,0.33)" },
  agentName: { top: 1246, size: 35, weight: 400, lineHeight: 44, maxWidth: 536 },
  agentTitle: { top: 1303, size: 24, weight: 500, lineHeight: 30, tracking: 0.5, maxWidth: 536 },
  headshot: { cx: 840, cy: 1193.5, r: 148, border: "rgba(255,255,255,0.9)" },
  qr: { x: 879, y: 1240, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

/** "classic", Just Listed — measured off Figma node 228:129. Adds the bed/bath/sqft chip row; the card grows to hold it (bottom edge unchanged, top extends up). */
export const LISTING_CHIPS = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, cx: 540, cy: 114 },
  headline: { ...HEADLINE_STYLE, cy: 259 },
  topScrim: TOP_SCRIM,
  card: { x: 60, y: 949, w: 960, h: 432, radius: 24, fill: "rgba(26,41,66,0.5)", border: "rgba(255,255,255,0.33)", blur: 6.55 },
  col: { x: 109.5, w: 536 },
  chips: { ...CHIP_STYLE, top: 983, align: "left" as const },
  primary: { top: 1060, size: 27, weight: 300, lineHeight: 34 },
  price: { top: 1105, size: 55, weight: 400, lineHeight: 69 },
  divider: { y: 1205, w: 536, color: "rgba(255,255,255,0.33)" },
  agentName: { top: 1233, size: 35, weight: 400, lineHeight: 44, maxWidth: 536 },
  agentTitle: { top: 1294, size: 24, weight: 500, lineHeight: 30, tracking: 0.5, maxWidth: 536 },
  headshot: { cx: 814, cy: 1167, r: 150, border: "rgba(255,255,255,0.9)" },
  qr: { x: 879, y: 1240, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

/** "minimal", Just Sold / Just Rented — measured off Figma nodes 229:128 / 229:200. No card, no divider. */
export const LISTING_MINIMAL = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, cx: 540, cy: 98.5 },
  headline: { ...HEADLINE_STYLE, cy: 206.5 },
  topScrim: TOP_SCRIM,
  primary: { cy: 335, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 399.5, size: 55, weight: 400, maxWidth: 900 },
  agentName: { cy: 1293, size: 35, weight: 400, maxWidth: 700 },
  agentTitle: { cy: 1347, size: 24, weight: 500, tracking: 0.5, maxWidth: 700 },
  headshot: { cx: 540, cy: 1133.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1194, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

/** "minimal", Just Listed — measured off Figma node 229:159. Chip row sits between the headline and the primary line; the agent block below is unchanged from the other minimal designs. */
export const LISTING_CHIPS_MINIMAL = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, cx: 540, cy: 98.5 },
  headline: { ...HEADLINE_STYLE, cy: 206.5 },
  topScrim: TOP_SCRIM,
  chips: { ...CHIP_STYLE, top: 387, align: "center" as const },
  primary: { cy: 492, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 554.5, size: 55, weight: 400, maxWidth: 900 },
  agentName: { cy: 1293, size: 35, weight: 400, maxWidth: 700 },
  agentTitle: { cy: 1347, size: 24, weight: 500, tracking: 0.5, maxWidth: 700 },
  headshot: { cx: 540, cy: 1133.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1194, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

export const LISTING_LIMITS = { bedrooms: 4, bathrooms: 4, sqft: 12, propertyType: 24, location: 32, price: 20, agentName: 32, agentTitle: 28 } as const;

export type ListingInput = {
  variant: ListingVariant;
  design: ListingDesign;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  propertyType: string;
  location: string;
  price: string;
  agentName: string;
  agentTitle: string;
  headshot: Drawable | null;
  headshotTransform: PhotoTransform;
  /** The agent's DLD QR permit image (mandatory for export; preview shows an empty tile until uploaded). */
  qr: Drawable | null;
  showPlaceholders?: boolean;
};

/** "{propertyType} in {location}", with "{bedrooms}-Bed " in front unless the variant shows bedrooms as its own chip. */
function primaryLine(input: ListingInput) {
  const type = input.propertyType.trim();
  const location = input.location.trim();
  const typeLoc = [type, location && `in ${location}`].filter(Boolean).join(" ");
  if (usesChips(input.variant)) return typeLoc;
  const bed = input.bedrooms.trim();
  return bed ? `${bed}-Bed ${typeLoc}`.trim() : typeLoc;
}

function priceLine(input: ListingInput) {
  const price = input.price.trim();
  return price ? `${price}${PRICE_SUFFIX[input.variant]}` : "";
}

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
const HEADSHOT_BOX_CLASSIC = { cx: LISTING.headshot.cx, cy: LISTING.headshot.cy, w: LISTING.headshot.r * 2, h: LISTING.headshot.r * 2 };
const HEADSHOT_BOX_CLASSIC_CHIPS = { cx: LISTING_CHIPS.headshot.cx, cy: LISTING_CHIPS.headshot.cy, w: LISTING_CHIPS.headshot.r * 2, h: LISTING_CHIPS.headshot.r * 2 };
const HEADSHOT_BOX_MINIMAL = { cx: LISTING_MINIMAL.headshot.cx, cy: LISTING_MINIMAL.headshot.cy, w: LISTING_MINIMAL.headshot.r * 2, h: LISTING_MINIMAL.headshot.r * 2 };

/** The headshot's cover-fit box for whichever variant + design is selected — three distinct sizes/positions. */
export function headshotBoxFor(variant: ListingVariant, design: ListingDesign) {
  if (design === "minimal") return HEADSHOT_BOX_MINIMAL;
  return usesChips(variant) ? HEADSHOT_BOX_CLASSIC_CHIPS : HEADSHOT_BOX_CLASSIC;
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

/** Width a tracked run of `text` draws at, ink only (no trailing tracking unit) — used to lay out chips. */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  return ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
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

/** Eased navy → transparent gradient, `h` tall — used by every design's top scrim. */
function topScrimGradient(ctx: CanvasRenderingContext2D, color: string, alpha: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    g.addColorStop(t, `rgba(${color},${(alpha * (1 - t) * (1 - t)).toFixed(3)})`);
  }
  return g;
}

function drawPhoto(ctx: CanvasRenderingContext2D, input: ListingInput) {
  if (input.photo) {
    const r = coverRect(input.photo, PHOTO_BOX, input.photoTransform);
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    drawPhotoPlaceholder(ctx);
  }
}

/** One bordered, unfilled pill: e.g. "2 BED". Returns its drawn width. */
function drawChip(ctx: CanvasRenderingContext2D, text: string, x: number, cy: number, style: typeof CHIP_STYLE) {
  ctx.font = font(style.weight, style.size);
  const textW = trackedWidth(ctx, text, style.tracking);
  const w = textW + style.padX * 2;
  const h = style.h;
  ctx.save();
  roundedRect(ctx, x + style.borderWidth / 2, cy - h / 2 + style.borderWidth / 2, w - style.borderWidth, h - style.borderWidth, style.radius);
  ctx.strokeStyle = style.border;
  ctx.lineWidth = style.borderWidth;
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawTracked(ctx, text, x + style.padX, cy, style.tracking, "left");
  return w;
}

/** The bed / bath / sqft chip row — left-aligned at `startX` (classic) or centred on `cx` (minimal). Empty values are skipped. */
function drawChipRow(ctx: CanvasRenderingContext2D, input: ListingInput, chips: typeof CHIP_STYLE & { top: number; align: "left" | "center" }, anchorX: number) {
  const values: [string, string][] = [
    [input.bedrooms.trim(), "BED"],
    [input.bathrooms.trim(), "BATHROOM"],
    [input.sqft.trim(), "SQFT"],
  ].filter(([v]) => v) as [string, string][];
  if (!values.length) return;
  ctx.fillStyle = "#FFFFFF";
  const cy = chips.top + chips.h / 2;
  if (chips.align === "left") {
    let x = anchorX;
    for (const [value, label] of values) x += drawChip(ctx, `${value} ${label}`, x, cy, chips) + chips.gap;
    return;
  }
  // Centred: measure every chip's width first so the row can be centred as a whole.
  ctx.font = font(chips.weight, chips.size);
  const widths = values.map(([value, label]) => trackedWidth(ctx, `${value} ${label}`, chips.tracking) + chips.padX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + chips.gap * (values.length - 1);
  let x = anchorX - total / 2;
  values.forEach(([value, label], i) => {
    drawChip(ctx, `${value} ${label}`, x, cy, chips);
    x += widths[i] + chips.gap;
  });
}

function drawHeadshot(ctx: CanvasRenderingContext2D, input: ListingInput, h: { cx: number; cy: number; r: number; border: string }, box: { cx: number; cy: number; w: number; h: number }) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2);
  ctx.clip();
  if (input.headshot) {
    const r = coverRect(input.headshot, box, input.headshotTransform);
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
}

function drawQr(ctx: CanvasRenderingContext2D, input: ListingInput, q: { x: number; y: number; size: number; pad: number; radius: number }) {
  if (input.qr || input.showPlaceholders) {
    ctx.save();
    roundedRect(ctx, q.x, q.y, q.size, q.size, q.radius);
    ctx.fillStyle = input.qr ? "#FFFFFF" : "rgba(255,255,255,0.35)";
    ctx.fill();
    ctx.restore();
  }
  if (input.qr) {
    // Fit the uploaded QR image inside the tile (keeps its aspect; most permit QRs are square).
    const { w: iw, h: ih } = drawableSize(input.qr);
    const inner = q.size - q.pad * 2;
    const s = Math.min(inner / iw, inner / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx.drawImage(input.qr, q.x + (q.size - dw) / 2, q.y + (q.size - dh) / 2, dw, dh);
  }
}

function renderClassic(ctx: CanvasRenderingContext2D, input: ListingInput) {
  const L = usesChips(input.variant) ? LISTING_CHIPS : LISTING;
  drawPhoto(ctx, input);

  // Top scrim — eased navy → transparent, so white skies don't wash out the headline
  ctx.fillStyle = topScrimGradient(ctx, L.topScrim.color, L.topScrim.alpha, L.topScrim.h);
  ctx.fillRect(0, 0, L.width, L.topScrim.h);

  // Wordmark + headline
  ctx.fillStyle = L.color;
  ctx.textBaseline = "middle";
  ctx.font = font(L.wordmark.weight, L.wordmark.size);
  ctx.textAlign = "center";
  ctx.fillText(L.wordmark.text, L.wordmark.cx, L.wordmark.cy);

  const headline = HEADLINES[input.variant];
  const hf = fitLine(ctx, headline, L.headline.weight, L.headline.size, L.headline.maxWidth, L.headline.tracking);
  ctx.font = font(L.headline.weight, hf.fontSize);
  drawTracked(ctx, headline, L.width / 2, L.headline.cy, L.headline.tracking * (hf.fontSize / L.headline.size), "center");

  // Frosted card: blurred copy of the photo clipped to the card, then tint + border
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

  // Bed / bath / sqft chips (Just Listed only)
  if ("chips" in L) drawChipRow(ctx, input, L.chips, L.col.x);

  // Card text (left column)
  ctx.fillStyle = L.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const primary = primaryLine(input);
  if (primary) {
    const f = fitLine(ctx, primary, L.primary.weight, L.primary.size, L.col.w);
    ctx.font = font(L.primary.weight, f.fontSize);
    ctx.fillText(primary, L.col.x, L.primary.top + L.primary.lineHeight / 2);
  }
  const price = priceLine(input);
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

  drawHeadshot(ctx, input, L.headshot, headshotBoxFor(input.variant, input.design));
  drawQr(ctx, input, L.qr);
}

function renderMinimal(ctx: CanvasRenderingContext2D, input: ListingInput) {
  const L = usesChips(input.variant) ? LISTING_CHIPS_MINIMAL : LISTING_MINIMAL;
  drawPhoto(ctx, input);

  ctx.fillStyle = topScrimGradient(ctx, L.topScrim.color, L.topScrim.alpha, L.topScrim.h);
  ctx.fillRect(0, 0, L.width, L.topScrim.h);

  ctx.fillStyle = L.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = font(L.wordmark.weight, L.wordmark.size);
  ctx.fillText(L.wordmark.text, L.wordmark.cx, L.wordmark.cy);

  const headline = HEADLINES[input.variant];
  const hf = fitLine(ctx, headline, L.headline.weight, L.headline.size, L.headline.maxWidth, L.headline.tracking);
  ctx.font = font(L.headline.weight, hf.fontSize);
  drawTracked(ctx, headline, L.width / 2, L.headline.cy, L.headline.tracking * (hf.fontSize / L.headline.size), "center");

  // Bed / bath / sqft chips (Just Listed only) — centred, between the headline and the primary line
  if ("chips" in L) drawChipRow(ctx, input, L.chips, L.width / 2);

  // Primary line + price — centred, no card
  const primary = primaryLine(input);
  if (primary) {
    const f = fitLine(ctx, primary, L.primary.weight, L.primary.size, L.primary.maxWidth);
    ctx.font = font(L.primary.weight, f.fontSize);
    ctx.textAlign = "center";
    ctx.fillText(primary, L.width / 2, L.primary.cy);
  }
  const price = priceLine(input);
  if (price) {
    const f = fitLine(ctx, price, L.price.weight, L.price.size, L.price.maxWidth);
    ctx.font = font(L.price.weight, f.fontSize);
    ctx.textAlign = "center";
    ctx.fillText(price, L.width / 2, L.price.cy);
  }

  // Agent name + designation — centred, near the foot, no divider
  const name = input.agentName.trim();
  if (name) {
    const f = fitLine(ctx, name, L.agentName.weight, L.agentName.size, L.agentName.maxWidth);
    ctx.font = font(L.agentName.weight, f.fontSize);
    ctx.textAlign = "center";
    ctx.fillText(name, L.width / 2, L.agentName.cy);
  }
  const title = input.agentTitle.trim().toUpperCase();
  if (title) {
    const f = fitLine(ctx, title, L.agentTitle.weight, L.agentTitle.size, L.agentTitle.maxWidth, L.agentTitle.tracking);
    ctx.font = font(L.agentTitle.weight, f.fontSize);
    drawTracked(ctx, title, L.width / 2, L.agentTitle.cy, L.agentTitle.tracking, "center");
  }

  drawHeadshot(ctx, input, L.headshot, headshotBoxFor(input.variant, input.design));
  drawQr(ctx, input, L.qr);
}

export function renderListing(ctx: CanvasRenderingContext2D, input: ListingInput, scale = 1) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, LISTING.width, LISTING.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lockText(ctx);

  if (input.design === "minimal") renderMinimal(ctx, input);
  else renderClassic(ctx, input);

  ctx.restore();
}
