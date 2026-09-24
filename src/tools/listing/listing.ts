/**
 * LISTING POSTS — "Just Sold" / "Just Listed" / "Just Rented".
 * Three VARIANTS (headline + a couple of composition rules) × two DESIGNS (layout) × two
 * FORMATS (canvas size) — the user picks the design and format, the tool page picks the
 * variant. All share one field set: bedrooms, bathrooms, sqft, property type, location,
 * price, agent, headshot, QR, plus a Just-Listed-only tagline (`listingLine`).
 *
 * "classic" — geometry measured from Figma: Images-Vol.02 › "Instagram Story – 22 2"
 * (node 685:60), refined since in "Birthday-template" nodes 228:113 (Just Sold), 228:129
 * (Just Listed) and 222:113 (Just Rented) for "post" (1080×1440), and 265:311 / 265:239 /
 * 265:283 for "story" (1080×1920). A frosted card holds the listing/price/agent block; the
 * property photo is the whole background, drawn in code so the frosted card really blurs
 * whatever photo sits behind it.
 *
 * "minimal" — geometry measured from Figma "Birthday-template" nodes 229:128 (Just Sold v1),
 * 229:159 (Just Listed v1), 229:200 (Just Rented v1) for "post", and 265:373 / 265:210 /
 * 265:344 for "story". No card, no blur: the wordmark and the agent/headshot block sit at
 * one edge, and the headline, tagline, chips, listing line and price sit in a column
 * anchored to the *other* edge, stacked. Post anchors the wordmark/agent block left and the
 * text column right; story flips the whole text column to the same left edge as the
 * wordmark instead (a single left-aligned column reads better on a tall, narrow canvas) — a
 * smaller headshot floats free near the bottom next to the QR tile either way.
 *
 * The PRIMARY LINE is composed from bedrooms + property type + location, never typed as one
 * string:
 *   - Just Sold / Just Rented: "{bedrooms}-Bed {propertyType} in {location}", one line.
 *   - Just Listed: bedrooms moves into its own chip (alongside bathrooms and sqft — three
 *     bordered pills, "2 BED" / "7 BATHROOM" / "20,298 SQFT"), so the line below them is just
 *     "{propertyType} in {location}". Just Listed also gets a free-text tagline
 *     (`listingLine`, e.g. "Largest Layout Corner 2BR | Spacious | Pool View") drawn directly
 *     under the headline — the other two variants don't have it.
 * Just Rented additionally appends " /year" to the price.
 */
import { POST_FONT_STACK } from "@/tools/_shared/font";
import type { Drawable, PhotoTransform } from "@/tools/_shared/render";
import { drawableSize } from "@/tools/_shared/render";

export type ListingVariant = "just-sold" | "just-listed" | "just-rented";
export type ListingDesign = "classic" | "minimal";
export type ListingFormat = "post" | "story";

export const LISTING_DESIGNS: { id: ListingDesign; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

export const LISTING_FORMATS: { id: ListingFormat; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "story", label: "Story" },
];

export function canvasSize(format: ListingFormat): { width: number; height: number } {
  return format === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1440 };
}

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
const SCRIM_COLOR = "26,41,66";
/**
 * Every scrim on both designs is the same shape — flat at `flatAlpha` through the first
 * quarter (`flatTo`), then a straight linear fade to transparent by `h` — measured directly
 * off the scrim rectangles in Figma (not an eased approximation).
 *
 * `TOP_SCRIM` / `TOP_SCRIM_CHIPS` sit behind classic's wordmark + headline (+ tagline on
 * Just Listed, hence the taller `_CHIPS` variant); everything below that sits on the frosted
 * card instead, so classic needs nothing else. The "post" heights carry over unchanged to
 * "story" for Just Sold/Rented (measured identical in Figma); Just Listed's story scrim is
 * taller still (`_STORY`) since the extra canvas height gave the design more empty space to
 * cover.
 *
 * Minimal has no card — the whole headline→price stack sits directly on the photo — so it
 * needs both a taller/stronger top scrim (post: same height for both variants; story: two
 * different heights, since Just Listed's block sits further down the taller canvas) AND a
 * second, softer scrim low on the canvas for the headshot/agent block, which classic doesn't
 * need because that block sits on the card there too.
 *
 * The bottom scrim's `flatTo` runs past what's actually in Figma (0.24, which fades out
 * well above the agent name/title) so the flat run keeps the whole block — agent name,
 * title, and the QR tile — protected on an evenly bright photo instead of just the top of
 * the headshot.
 */
const TOP_SCRIM = { h: 419, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const TOP_SCRIM_CHIPS = { h: 663, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const TOP_SCRIM_CHIPS_STORY = { h: 884, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const MINIMAL_SCRIM = { h: 628, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const MINIMAL_SCRIM_STORY = { h: 762, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const MINIMAL_SCRIM_CHIPS_STORY = { h: 1040, color: SCRIM_COLOR, flatAlpha: 0.8, flatTo: 0.24 } as const;
const MINIMAL_BOTTOM_SCRIM = { y: 1083, h: 357, color: SCRIM_COLOR, flatAlpha: 0.6, flatTo: 0.8 } as const;
const MINIMAL_BOTTOM_SCRIM_STORY = { y: 1565, h: 357, color: SCRIM_COLOR, flatAlpha: 0.6, flatTo: 0.8 } as const;
const CHIP_STYLE = { h: 54, padX: 20, radius: 10, gap: 14, size: 17, weight: 500, tracking: 17 * 0.14, border: "rgba(255,255,255,1)", borderWidth: 0.5 } as const;
/** "minimal" only — the edge the wordmark and the agent/headshot block always anchor to; the text column anchors here too on "story" (left-aligned), or to MINIMAL_RIGHT on "post" (right-aligned). */
const MINIMAL_LEFT = 98;
const MINIMAL_RIGHT = 996;

/** "classic", Just Sold / Just Rented, "post" — measured off Figma nodes 228:113 / 222:113. */
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

/** "classic", Just Listed, "post" — measured off Figma node 228:129. Adds the tagline under the headline and the bed/bath/sqft chip row; the card grows to hold the chips (bottom edge unchanged, top extends up). */
export const LISTING_CHIPS = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, cx: 540, cy: 114 },
  headline: { ...HEADLINE_STYLE, cy: 259 },
  tagline: { top: 354, size: 27, weight: 300, lineHeight: 34, maxWidth: 900 },
  topScrim: TOP_SCRIM_CHIPS,
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

/** "classic", Just Sold / Just Rented, "story" — measured off Figma node 265:311. The wordmark + headline sit at the exact same position as "post"; only the card block (and the QR, which moves to a standalone tile centred below the card) shift down into the taller canvas. */
export const LISTING_STORY = {
  width: 1080,
  height: 1920,
  wordmark: { ...WORDMARK, cx: 540, cy: 114 },
  headline: { ...HEADLINE_STYLE, cy: 259 },
  topScrim: TOP_SCRIM,
  card: { x: 59.5, y: 1248, w: 960, h: 377, radius: 24, fill: "rgba(26,41,66,0.5)", border: "rgba(255,255,255,0.33)", blur: 6.55 },
  col: { x: 109.5, w: 536 },
  primary: { top: 1289.5, size: 27, weight: 300, lineHeight: 34 },
  price: { top: 1340.5, size: 55, weight: 400, lineHeight: 69 },
  divider: { y: 1440.5, w: 536, color: "rgba(255,255,255,0.33)" },
  agentName: { top: 1468.5, size: 35, weight: 400, lineHeight: 44, maxWidth: 536 },
  agentTitle: { top: 1529.5, size: 24, weight: 500, lineHeight: 30, tracking: 0.5, maxWidth: 536 },
  headshot: { cx: 840, cy: 1429, r: 147.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 456, y: 1684, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

/** "classic", Just Listed, "story" — measured off Figma node 265:239. Same pattern as LISTING_STORY; the QR sits at the exact same standalone position as LISTING_STORY's (centred below the card) regardless of the card's own height. */
export const LISTING_CHIPS_STORY = {
  width: 1080,
  height: 1920,
  wordmark: { ...WORDMARK, cx: 540, cy: 114 },
  headline: { ...HEADLINE_STYLE, cy: 259 },
  tagline: { top: 354, size: 27, weight: 300, lineHeight: 34, maxWidth: 900 },
  topScrim: TOP_SCRIM_CHIPS_STORY,
  card: { x: 60, y: 1193, w: 960, h: 432, radius: 24, fill: "rgba(26,41,66,0.5)", border: "rgba(255,255,255,0.33)", blur: 6.55 },
  col: { x: 109.5, w: 536 },
  chips: { ...CHIP_STYLE, top: 1233, align: "left" as const },
  primary: { top: 1310, size: 27, weight: 300, lineHeight: 34 },
  price: { top: 1355, size: 55, weight: 400, lineHeight: 69 },
  divider: { y: 1455, w: 536, color: "rgba(255,255,255,0.33)" },
  agentName: { top: 1483, size: 35, weight: 400, lineHeight: 44, maxWidth: 536 },
  agentTitle: { top: 1544, size: 24, weight: 500, lineHeight: 30, tracking: 0.5, maxWidth: 536 },
  headshot: { cx: 814, cy: 1417, r: 150, border: "rgba(255,255,255,0.9)" },
  qr: { x: 456, y: 1684, size: 168, pad: 3, radius: 14 },
  color: "#FFFFFF",
} as const;

/**
 * "minimal", Just Sold / Just Rented, "post" — measured off Figma nodes 229:128 / 229:200.
 * No card, no blur. The wordmark and the agent/headshot block sit left-aligned at
 * MINIMAL_LEFT; the headline, listing line and price are right-aligned to MINIMAL_RIGHT,
 * stacked in a column.
 */
export const LISTING_MINIMAL = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, x: MINIMAL_LEFT, cy: 116.5 },
  headline: { size: 117, weight: 400, tracking: -7, maxWidth: 900, cy: 164 },
  topScrim: MINIMAL_SCRIM,
  col: { x: MINIMAL_RIGHT, align: "right" as const },
  primary: { cy: 274, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 345.5, size: 55, weight: 400, maxWidth: 900 },
  agentName: { cy: 1293, size: 35, weight: 400, maxWidth: 700, x: MINIMAL_LEFT },
  agentTitle: { cy: 1347, size: 24, weight: 500, tracking: 0.5, maxWidth: 700, x: MINIMAL_LEFT },
  headshot: { cx: 218.5, cy: 1123.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1194, size: 168, pad: 3, radius: 14 },
  bottomScrim: MINIMAL_BOTTOM_SCRIM,
  color: "#FFFFFF",
} as const;

/**
 * "minimal", Just Listed, "post" — measured off Figma node 229:159. Same left/right split as
 * LISTING_MINIMAL, but the right column also carries the tagline (directly under the
 * headline) and the bed/bath/sqft chip row (right-aligned to MINIMAL_RIGHT); the headline and
 * price sit smaller to make room. The agent/headshot block is unchanged.
 */
export const LISTING_CHIPS_MINIMAL = {
  width: 1080,
  height: 1440,
  wordmark: { ...WORDMARK, x: MINIMAL_LEFT, cy: 116.5 },
  headline: { size: 97, weight: 400, tracking: -7, maxWidth: 900, cy: 151.5 },
  topScrim: MINIMAL_SCRIM,
  tagline: { cy: 249, size: 27, weight: 300, maxWidth: 900 },
  col: { x: MINIMAL_RIGHT, align: "right" as const },
  chips: { ...CHIP_STYLE, top: 286, align: "right" as const },
  primary: { cy: 378, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 439, size: 38, weight: 400, maxWidth: 900 },
  agentName: { cy: 1293, size: 35, weight: 400, maxWidth: 700, x: MINIMAL_LEFT },
  agentTitle: { cy: 1347, size: 24, weight: 500, tracking: 0.5, maxWidth: 700, x: MINIMAL_LEFT },
  headshot: { cx: 218.5, cy: 1123.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1194, size: 168, pad: 3, radius: 14 },
  bottomScrim: MINIMAL_BOTTOM_SCRIM,
  color: "#FFFFFF",
} as const;

/**
 * "minimal", Just Sold / Just Rented, "story" — measured off Figma node 265:373. Unlike
 * "post", the text column is LEFT-aligned to MINIMAL_LEFT — the same edge as the wordmark —
 * instead of right-aligned to MINIMAL_RIGHT; a single left-aligned column reads better on
 * the taller canvas. Because both now share that left edge, the column also drops well below
 * the wordmark (headline top at y=233, vs. y=91 in "post") so they don't crowd each other —
 * "post" could set the headline right next to the wordmark since they sat in separate left/
 * right columns. The headshot/agent/QR block sits at the exact same offset from the bottom
 * edge as "post" (+482px lower, matching the extra canvas height).
 */
export const LISTING_MINIMAL_STORY = {
  width: 1080,
  height: 1920,
  wordmark: { ...WORDMARK, x: MINIMAL_LEFT, cy: 116.5 },
  headline: { size: 117, weight: 400, tracking: -7, maxWidth: 900, cy: 306 },
  topScrim: MINIMAL_SCRIM_STORY,
  col: { x: MINIMAL_LEFT, align: "left" as const },
  primary: { cy: 416, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 487.5, size: 55, weight: 400, maxWidth: 900 },
  agentName: { cy: 1775, size: 35, weight: 400, maxWidth: 700, x: MINIMAL_LEFT },
  agentTitle: { cy: 1829, size: 24, weight: 500, tracking: 0.5, maxWidth: 700, x: MINIMAL_LEFT },
  headshot: { cx: 218.5, cy: 1605.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1676, size: 168, pad: 3, radius: 14 },
  bottomScrim: MINIMAL_BOTTOM_SCRIM_STORY,
  color: "#FFFFFF",
} as const;

/**
 * "minimal", Just Listed, "story" — measured off Figma node 265:210. Same left-aligned
 * column as LISTING_MINIMAL_STORY, at the same y=233 top edge, plus the tagline and the chip
 * row (also left-aligned, the mirror of "post"'s right-aligned row) in between; the headline
 * itself runs smaller (97px vs. 117px) to leave room for that extra content without pushing
 * the primary line/price any lower. The agent/headshot/QR block is unchanged from
 * LISTING_MINIMAL_STORY.
 */
export const LISTING_CHIPS_MINIMAL_STORY = {
  width: 1080,
  height: 1920,
  wordmark: { ...WORDMARK, x: MINIMAL_LEFT, cy: 147 },
  headline: { size: 97, weight: 400, tracking: -7, maxWidth: 900, cy: 293.5 },
  topScrim: MINIMAL_SCRIM_CHIPS_STORY,
  tagline: { cy: 391, size: 27, weight: 300, maxWidth: 900 },
  col: { x: MINIMAL_LEFT, align: "left" as const },
  chips: { ...CHIP_STYLE, top: 428, align: "left" as const },
  primary: { cy: 520, size: 27, weight: 300, maxWidth: 900 },
  price: { cy: 581, size: 38, weight: 400, maxWidth: 900 },
  agentName: { cy: 1775, size: 35, weight: 400, maxWidth: 700, x: MINIMAL_LEFT },
  agentTitle: { cy: 1829, size: 24, weight: 500, tracking: 0.5, maxWidth: 700, x: MINIMAL_LEFT },
  headshot: { cx: 218.5, cy: 1605.5, r: 120.5, border: "rgba(255,255,255,0.9)" },
  qr: { x: 848, y: 1676, size: 168, pad: 3, radius: 14 },
  bottomScrim: MINIMAL_BOTTOM_SCRIM_STORY,
  color: "#FFFFFF",
} as const;

export const LISTING_LIMITS = { bedrooms: 4, bathrooms: 4, sqft: 12, propertyType: 24, location: 32, price: 20, listingLine: 60, agentName: 32, agentTitle: 28 } as const;

export type ListingInput = {
  variant: ListingVariant;
  design: ListingDesign;
  format: ListingFormat;
  photo: Drawable | null;
  photoTransform: PhotoTransform;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  propertyType: string;
  location: string;
  price: string;
  /** Just Listed only — a free-text tagline drawn directly under the headline, e.g. "Largest Layout Corner 2BR | Spacious | Pool View". */
  listingLine: string;
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

/** The whole-canvas cover-fit box for the property photo background, sized for `format`. */
export function photoBoxFor(format: ListingFormat) {
  const { width, height } = canvasSize(format);
  return { cx: width / 2, cy: height / 2, w: width, h: height };
}

function photoBoxOf(L: { width: number; height: number }) {
  return { cx: L.width / 2, cy: L.height / 2, w: L.width, h: L.height };
}

const HEADSHOT_BOX_CLASSIC = { cx: LISTING.headshot.cx, cy: LISTING.headshot.cy, w: LISTING.headshot.r * 2, h: LISTING.headshot.r * 2 };
const HEADSHOT_BOX_CLASSIC_CHIPS = { cx: LISTING_CHIPS.headshot.cx, cy: LISTING_CHIPS.headshot.cy, w: LISTING_CHIPS.headshot.r * 2, h: LISTING_CHIPS.headshot.r * 2 };
const HEADSHOT_BOX_CLASSIC_STORY = { cx: LISTING_STORY.headshot.cx, cy: LISTING_STORY.headshot.cy, w: LISTING_STORY.headshot.r * 2, h: LISTING_STORY.headshot.r * 2 };
const HEADSHOT_BOX_CLASSIC_CHIPS_STORY = { cx: LISTING_CHIPS_STORY.headshot.cx, cy: LISTING_CHIPS_STORY.headshot.cy, w: LISTING_CHIPS_STORY.headshot.r * 2, h: LISTING_CHIPS_STORY.headshot.r * 2 };
const HEADSHOT_BOX_MINIMAL = { cx: LISTING_MINIMAL.headshot.cx, cy: LISTING_MINIMAL.headshot.cy, w: LISTING_MINIMAL.headshot.r * 2, h: LISTING_MINIMAL.headshot.r * 2 };
const HEADSHOT_BOX_MINIMAL_STORY = { cx: LISTING_MINIMAL_STORY.headshot.cx, cy: LISTING_MINIMAL_STORY.headshot.cy, w: LISTING_MINIMAL_STORY.headshot.r * 2, h: LISTING_MINIMAL_STORY.headshot.r * 2 };

/** The headshot's cover-fit box for whichever variant + design + format is selected. Minimal shares one box across variants (the agent block never moves); classic has a distinct box per variant. */
export function headshotBoxFor(variant: ListingVariant, design: ListingDesign, format: ListingFormat) {
  if (design === "minimal") return format === "story" ? HEADSHOT_BOX_MINIMAL_STORY : HEADSHOT_BOX_MINIMAL;
  if (format === "story") return usesChips(variant) ? HEADSHOT_BOX_CLASSIC_CHIPS_STORY : HEADSHOT_BOX_CLASSIC_STORY;
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

function drawTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "center" | "right") {
  if (!tracking) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }
  const total = ctx.measureText(text).width + tracking * (text.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
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

function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D, L: { width: number; height: number }) {
  const g = ctx.createLinearGradient(0, 0, 0, L.height);
  g.addColorStop(0, "#2F4960");
  g.addColorStop(1, "#1A2942");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L.width, L.height);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = font(300, 28);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Property photo", L.width / 2, Math.round(L.height * 0.444));
}

/**
 * Flat navy → transparent gradient, `h` tall starting at `y`: solid through `flatTo`, then a
 * straight linear fade to 0. The one shape behind every scrim on both designs — see
 * TOP_SCRIM's comment. `anchor: "top"` (the default) is solid at `y` and fades out going
 * down, for scrims that sit at the top of the canvas; `anchor: "bottom"` flips that — solid
 * at `y + h` and fading out going up — for the minimal bottom scrims, which ground the
 * headshot/agent block against the bottom edge rather than fading into it.
 */
function scrimGradient(ctx: CanvasRenderingContext2D, y: number, s: { h: number; color: string; flatAlpha: number; flatTo: number }, anchor: "top" | "bottom" = "top") {
  const g = anchor === "top" ? ctx.createLinearGradient(0, y, 0, y + s.h) : ctx.createLinearGradient(0, y + s.h, 0, y);
  g.addColorStop(0, `rgba(${s.color},${s.flatAlpha})`);
  g.addColorStop(s.flatTo, `rgba(${s.color},${s.flatAlpha})`);
  g.addColorStop(1, `rgba(${s.color},0)`);
  return g;
}

function drawPhoto(ctx: CanvasRenderingContext2D, input: ListingInput, box: { cx: number; cy: number; w: number; h: number }, L: { width: number; height: number }) {
  if (input.photo) {
    const r = coverRect(input.photo, box, input.photoTransform);
    ctx.drawImage(input.photo, r.x, r.y, r.w, r.h);
  } else if (input.showPlaceholders) {
    drawPhotoPlaceholder(ctx, L);
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

/** The bed / bath / sqft chip row — left-aligned at `anchorX` (classic, minimal story), centred on it (unused currently), or right-aligned to it (minimal post). Empty values are skipped. */
function drawChipRow(ctx: CanvasRenderingContext2D, input: ListingInput, chips: typeof CHIP_STYLE & { top: number; align: "left" | "center" | "right" }, anchorX: number) {
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
  // Centred or right-aligned: measure every chip's width first so the row can be placed as a whole.
  ctx.font = font(chips.weight, chips.size);
  const widths = values.map(([value, label]) => trackedWidth(ctx, `${value} ${label}`, chips.tracking) + chips.padX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + chips.gap * (values.length - 1);
  let x = chips.align === "right" ? anchorX - total : anchorX - total / 2;
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

function classicGeometryFor(input: ListingInput) {
  const chips = usesChips(input.variant);
  if (input.format === "story") return chips ? LISTING_CHIPS_STORY : LISTING_STORY;
  return chips ? LISTING_CHIPS : LISTING;
}

function minimalGeometryFor(input: ListingInput) {
  const chips = usesChips(input.variant);
  if (input.format === "story") return chips ? LISTING_CHIPS_MINIMAL_STORY : LISTING_MINIMAL_STORY;
  return chips ? LISTING_CHIPS_MINIMAL : LISTING_MINIMAL;
}

function renderClassic(ctx: CanvasRenderingContext2D, input: ListingInput) {
  const L = classicGeometryFor(input);
  const photoBox = photoBoxOf(L);
  drawPhoto(ctx, input, photoBox, L);

  // Top scrim, so white skies don't wash out the wordmark/headline/tagline
  ctx.fillStyle = scrimGradient(ctx, 0, L.topScrim);
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

  // Tagline (Just Listed only) — centred directly under the headline
  if ("tagline" in L) {
    const tagline = input.listingLine.trim();
    if (tagline) {
      const f = fitLine(ctx, tagline, L.tagline.weight, L.tagline.size, L.tagline.maxWidth);
      ctx.font = font(L.tagline.weight, f.fontSize);
      ctx.textAlign = "center";
      ctx.fillText(tagline, L.width / 2, L.tagline.top + L.tagline.lineHeight / 2);
    }
  }

  // Frosted card: blurred copy of the photo clipped to the card, then tint + border
  const c = L.card;
  ctx.save();
  roundedRect(ctx, c.x, c.y, c.w, c.h, c.radius);
  ctx.clip();
  if (input.photo && "filter" in ctx) {
    const r = coverRect(input.photo, photoBox, input.photoTransform);
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

  drawHeadshot(ctx, input, L.headshot, headshotBoxFor(input.variant, input.design, input.format));
  drawQr(ctx, input, L.qr);
}

/** "minimal" — wordmark + agent/headshot block anchored at MINIMAL_LEFT; headline/tagline/chips/listing line/price anchored (and aligned) per `L.col`. */
function renderMinimal(ctx: CanvasRenderingContext2D, input: ListingInput) {
  const L = minimalGeometryFor(input);
  const photoBox = photoBoxOf(L);
  drawPhoto(ctx, input, photoBox, L);

  // Top scrim behind the headline/tagline/chips/listing line/price, and a second, softer
  // scrim low on the canvas grounding the headshot/agent block against the bottom edge —
  // minimal has no card, so both ends of the text need their own contrast against the photo.
  ctx.fillStyle = scrimGradient(ctx, 0, L.topScrim);
  ctx.fillRect(0, 0, L.width, L.topScrim.h);
  ctx.fillStyle = scrimGradient(ctx, L.bottomScrim.y, L.bottomScrim, "bottom");
  ctx.fillRect(0, L.bottomScrim.y, L.width, L.bottomScrim.h);

  ctx.fillStyle = L.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = font(L.wordmark.weight, L.wordmark.size);
  ctx.fillText(L.wordmark.text, L.wordmark.x, L.wordmark.cy);

  const headline = HEADLINES[input.variant];
  const hf = fitLine(ctx, headline, L.headline.weight, L.headline.size, L.headline.maxWidth, L.headline.tracking);
  ctx.font = font(L.headline.weight, hf.fontSize);
  drawTracked(ctx, headline, L.col.x, L.headline.cy, L.headline.tracking * (hf.fontSize / L.headline.size), L.col.align);

  // Tagline (Just Listed only) — directly under the headline
  if ("tagline" in L) {
    const tagline = input.listingLine.trim();
    if (tagline) {
      const f = fitLine(ctx, tagline, L.tagline.weight, L.tagline.size, L.tagline.maxWidth);
      ctx.font = font(L.tagline.weight, f.fontSize);
      ctx.textAlign = L.col.align;
      ctx.fillText(tagline, L.col.x, L.tagline.cy);
    }
  }

  // Bed / bath / sqft chips (Just Listed only) — anchored to the same column
  if ("chips" in L) drawChipRow(ctx, input, L.chips, L.col.x);

  // Primary line + price — no card
  const primary = primaryLine(input);
  if (primary) {
    const f = fitLine(ctx, primary, L.primary.weight, L.primary.size, L.primary.maxWidth);
    ctx.font = font(L.primary.weight, f.fontSize);
    ctx.textAlign = L.col.align;
    ctx.fillText(primary, L.col.x, L.primary.cy);
  }
  const price = priceLine(input);
  if (price) {
    const f = fitLine(ctx, price, L.price.weight, L.price.size, L.price.maxWidth);
    ctx.font = font(L.price.weight, f.fontSize);
    ctx.textAlign = L.col.align;
    ctx.fillText(price, L.col.x, L.price.cy);
  }

  // Agent name + designation — left-aligned, near the foot, no divider
  const name = input.agentName.trim();
  if (name) {
    const f = fitLine(ctx, name, L.agentName.weight, L.agentName.size, L.agentName.maxWidth);
    ctx.font = font(L.agentName.weight, f.fontSize);
    ctx.textAlign = "left";
    ctx.fillText(name, L.agentName.x, L.agentName.cy);
  }
  const title = input.agentTitle.trim().toUpperCase();
  if (title) {
    const f = fitLine(ctx, title, L.agentTitle.weight, L.agentTitle.size, L.agentTitle.maxWidth, L.agentTitle.tracking);
    ctx.font = font(L.agentTitle.weight, f.fontSize);
    drawTracked(ctx, title, L.agentTitle.x, L.agentTitle.cy, L.agentTitle.tracking, "left");
  }

  drawHeadshot(ctx, input, L.headshot, headshotBoxFor(input.variant, input.design, input.format));
  drawQr(ctx, input, L.qr);
}

export function renderListing(ctx: CanvasRenderingContext2D, input: ListingInput, scale = 1) {
  const { width, height } = canvasSize(input.format);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  lockText(ctx);

  if (input.design === "minimal") renderMinimal(ctx, input);
  else renderClassic(ctx, input);

  ctx.restore();
}
