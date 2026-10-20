/**
 * Secondary Brochure types. `Listing` is one company listing as the portal holds it (portal.prov.ae ›
 * Listings › Company Listings), with the description already split into intro / features / area by
 * `real/index.ts`. `Agent` matches the Project Booklet's (demo employee + contact placeholders).
 */

export type Offering = "Sale" | "Rent";
/** The portal's offering types come in two families: Residential Sale / Rent and Commercial Sale / Rent. */
export type Segment = "Residential" | "Commercial";

/** A titled part of the description ("Location Highlights:", "Community Overview:" …). */
export type Section = { title: string; paras: string[]; items: string[] };

export type Listing = {
  id: string;
  ref: string;
  /** The portal title as typed ("Fully Furnished | Ready To Move | Mid Floor"). */
  title: string;
  /** The title split on its separators — the brochure prints these as tags. */
  tags: string[];
  offering: Offering;
  segment: Segment;
  /** The portal's own wording: "Residential Rent", "Commercial Rent" … */
  offeringName: string;
  category: string;
  propertyType: string;
  /** "Studio" or a number as text, as the portal stores it. Empty on commercial listings
   *  (the portal's co-working entries carry junk like "10+" / "20" there, so it is not read). */
  beds: string;
  baths: string;
  /** Built-up area, sq.ft. */
  size: number | null;
  plot: number | null;
  price: number;
  currency: string;
  /** "Yearly" on rentals. */
  rentFrequency: string | null;
  cheques: number | null;
  furnishing: string | null;
  developer: string | null;
  city: string;
  community: string;
  subCommunity: string | null;
  tower: string | null;
  amenities: string[];
  parking: number | null;
  /** ISO date the unit is available from. */
  availability: string | null;
  exclusive: boolean;
  status: string;
  /** Local copies of the uploaded pictures (watermarked), in the portal's order. */
  photos: string[];
  /** Each picture's width / height, and the listing's usual one (the median) — the brochure's
   *  photo cells take this shape so every picture is shown whole. */
  photoRatios: number[];
  photoRatio: number;
  floorplan: string | null;
  description: string;
  /** Description paragraphs before any list or heading, call-to-action lines removed. */
  intro: string[];
  /** Short feature lines from the description (bulleted or one-per-line). */
  features: string[];
  /** The description's location / community part, when it has one. */
  area: Section | null;
};

export type Agent = {
  /** An employee id from the demo list. */
  employeeId: string;
  name: string;
  position: string;
  photo: string | null;
  /** Headshot size inside its circle, 1–3. */
  zoom: number;
  mobile: string;
  email: string;
  brn: string;
};

/** A · Navy (the booklet's A cover), B · White (its B). */
export type Design = "a" | "b";
export const DESIGNS: { id: Design; name: string }[] = [
  { id: "a", name: "A · Navy" },
  { id: "b", name: "B · White" },
];

/** The five pictures on a property page — two across the top, three below: indexes into `photos`. */
export type Slots = number[];

/** The listing's first five pictures in its usual shape (others fill in if it has fewer). */
export function defaultSlots(l: Listing): Slots {
  const fits = l.photos.map((_, i) => i).filter((i) => Math.abs((l.photoRatios[i] ?? l.photoRatio) / l.photoRatio - 1) < 0.08);
  const rest = l.photos.map((_, i) => i).filter((i) => !fits.includes(i));
  const order = [...fits, ...rest];
  return [0, 1, 2, 3, 4].map((k) => order[k % Math.max(order.length, 1)] ?? 0);
}

/** One property in a brochure: the listing, its picture picks and its permit QR. */
export type Item = { l: Listing; slots: Slots; qr: string | null };

export const newItem = (l: Listing): Item => ({ l, slots: defaultSlots(l), qr: null });

export const PAGE = { w: 1080, h: 1350 } as const;
