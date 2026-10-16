/**
 * Secondary Brochure types. `Listing` is one company listing as the portal holds it (portal.prov.ae ›
 * Listings › Company Listings), with the description already split into intro / features / area by
 * `real/index.ts`. `Agent` matches the Project Booklet's (demo employee + contact placeholders).
 */

export type Offering = "Sale" | "Rent";

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
  category: string;
  propertyType: string;
  /** "Studio" or a number as text, as the portal stores it. */
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

/** A · Navy header (the old flyer's), B · White header. */
export type Design = "a" | "b";
export const DESIGNS: { id: Design; name: string }[] = [
  { id: "a", name: "A · Navy" },
  { id: "b", name: "B · White" },
];

/** The five pictures on a property page (two large, three small): indexes into `photos`. */
export type Slots = number[];

/** The listing's first five pictures, repeating when it has fewer. */
export function defaultSlots(l: Listing): Slots {
  const n = Math.max(l.photos.length, 1);
  return [0, 1, 2, 3, 4].map((i) => i % n);
}

/** One property in a brochure: the listing, its picture picks and its permit QR. */
export type Item = { l: Listing; slots: Slots; qr: string | null };

export const PAGE = { w: 1080, h: 1350 } as const;
