/**
 * Booklet data model. `ProjectData` is exactly what the page parser (scrape.ts) returns for a
 * project page (offplan-dubai.com or abudhabipropertyhub.com) — the saved projects in projects/
 * are that, with the pictures pointing at local copies. `Agent` comes from the employee list (+ contact fields the CRM will
 * have to provide); `ImageSlots` says which picture goes where in each output.
 */

export type Pair = { label: string; value: string };
/** One highlight. Some project pages only give a title, some only a sentence. */
export type Highlight = { title: string; text: string };
export type Milestone = { label: string; share: string; amount: string };
export type Distance = { time: string; place: string };
export type Stat = { value: string; label: string };
/** One row of the page's "Explore Floorplans" list; area and price are blank where the page has none. */
export type UnitType = { name: string; area: string; price: string };
export type Faq = { question: string; answer: string };

export type ProjectData = {
  url: string;
  name: string;
  developer: string;
  location: string;
  /** The city the page's site covers — "Dubai" or "Abu Dhabi"; the layouts write "Location · City". */
  city: string;
  heroImage: string;
  heroStats: Pair[];
  /** Paragraphs; `**text**` marks the bold phrases the site highlights. */
  overview: string[];
  highlights: Highlight[];
  details: Pair[];
  gallery: string[];
  amenitiesIntro: string;
  amenities: string[];
  payment: Milestone[];
  paymentNote: string;
  locationText: string[];
  mapImage: string;
  distances: Distance[];
  investmentIntro: string;
  investmentStats: Stat[];
  marketTitle: string;
  marketContext: string[];
  financing: string[];
  developerLogo: string;
  developerText: string;
  developerImage: string;
  /* Also on the page, kept with the project but not used by the layouts yet: */
  unitTypes: UnitType[];
  /** The "About <area>" card — only some pages have one. */
  areaTitle: string;
  areaText: string;
  areaImage: string;
  faqs: Faq[];
  /** The page's listing / share picture (538 × 323). */
  thumbnail: string;
};

export type Agent = {
  /** An employee id from the demo list, or MANUAL when typed in by hand. */
  employeeId: string;
  name: string;
  position: string;
  photo: string | null;
  /** Headshot size inside its circle, 1–3 (the listing tools' Size slider). */
  zoom: number;
  mobile: string;
  email: string;
  brn: string;
};

export const MANUAL = "__manual__";
/** Same limits as the Prov Toys listing tools' agent fields. */
export const AGENT_LIMITS = { name: 32, position: 28 } as const;

/* ── what is being made ──────────────────────────────────────────────────── */

export type Output = "brochure" | "social";
export type Design = "a" | "b";
export type SocialKind = "single" | "carousel";
export type PostFormat = "feed" | "story";

export const OUTPUTS: { id: Output; label: string }[] = [
  { id: "brochure", label: "PDF brochure" },
  { id: "social", label: "Social media post" },
];
export const DESIGNS: { id: Design; label: string }[] = [
  { id: "a", label: "A · Paper & navy" },
  { id: "b", label: "B · White" },
];
export const SOCIAL_KINDS: { id: SocialKind; label: string }[] = [
  { id: "single", label: "Single post" },
  { id: "carousel", label: "Carousel" },
];
export const POST_FORMATS: { id: PostFormat; label: string }[] = [
  { id: "feed", label: "Feed · 4:5" },
  { id: "story", label: "Story · 9:16" },
];

/** The social posts' two designs each: A is the studio template the tool started with, B the alternative. */
export type SocialDesign = "a" | "b";
export const SINGLE_DESIGNS: { id: SocialDesign; label: string }[] = [
  { id: "a", label: "A · Stacked" },
  { id: "b", label: "B · Split" },
];
export const CAROUSEL_DESIGNS: { id: SocialDesign; label: string }[] = [
  { id: "a", label: "A · Navy" },
  { id: "b", label: "B · White" },
];

/**
 * Which picture set a view uses: each brochure design has its own, the single post (feed and
 * story share it) and the carousel have one each.
 */
export type SlotSet = "a" | "b" | "single" | "carousel";

/* ── pictures ────────────────────────────────────────────────────────────── */

export type SlotKey =
  | "cover"
  | "overview"
  | "gallery1"
  | "gallery2"
  | "gallery3"
  | "gallery4"
  | "gallery5"
  | "amenities"
  | "payment"
  | "strip"
  | "post"
  | "details"
  | "type"
  | "agent";
export type ImageSlots = Record<SlotKey, string>;

export const SLOT_LABELS: Record<SlotKey, string> = {
  cover: "Cover",
  overview: "Overview",
  gallery1: "Gallery · large",
  gallery2: "Gallery · 2",
  gallery3: "Gallery · 3",
  gallery4: "Gallery · 4",
  gallery5: "Gallery · 5",
  amenities: "Amenities",
  payment: "Payment plan",
  strip: "Investment strip",
  post: "Post background",
  details: "Project details",
  type: "Property type",
  agent: "Agent contact",
};

/** The brochure's picture slots, per design (the Pictures section). The social posts list theirs per page. */
export const SLOTS_BY_VIEW = {
  a: ["cover", "overview", "gallery1", "gallery2", "gallery3", "gallery4", "gallery5", "amenities", "payment"],
  b: ["cover", "overview", "gallery1", "gallery2", "gallery3", "gallery4", "gallery5", "amenities", "payment", "strip"],
} satisfies Record<Design, SlotKey[]>;

/**
 * How a social post's photo sits in its frame: `zoom` 1–3 (the listing tools' Size slider) and
 * the point shown, `x` / `y` from 0 (left / top edge of the photo) to 1 (right / bottom),
 * 0.5 = centred. Relative, so one setting suits the feed and the story alike.
 */
export type Adjust = { zoom: number; x: number; y: number };
export const NO_ADJUST: Adjust = { zoom: 1, x: 0.5, y: 0.5 };
export type Adjusts = Partial<Record<SlotKey, Adjust>>;
/** A photo frame on a social page, for the photo picker. */
export type FrameInfo = { key: SlotKey; label: string };

/**
 * Default picture for each slot, as positions in the site gallery (`"hero"` = the site's hero
 * banner). The positions are the ones the approved layout was made with (Eleve by Deyaar); both
 * designs open on the hero so the first page matches. Every project gets the same positions,
 * and a slot whose position doesn't exist takes the next picture not used yet.
 */
const SOCIAL_PICKS: Partial<Record<SlotKey, number | "hero">> = { post: 3, overview: 2, gallery1: 0, gallery2: 1, gallery3: 7, gallery4: 8, amenities: 6, details: 5, type: 4, agent: 3 };
const DEFAULT_PICKS: Record<SlotSet, Partial<Record<SlotKey, number | "hero">>> = {
  a: { cover: "hero", overview: 2, gallery1: 3, gallery2: 0, gallery3: 1, gallery4: 7, gallery5: 8, amenities: 6, payment: 4 },
  b: { cover: "hero", overview: 2, gallery1: 0, gallery2: 1, gallery3: 7, gallery4: 8, gallery5: 5, amenities: 6, payment: 4, strip: "hero" },
  // The same picks, so the single post opens on the same photo as the carousel's cover.
  single: SOCIAL_PICKS,
  carousel: SOCIAL_PICKS,
};

export function defaultSlots(d: ProjectData, set: SlotSet): ImageSlots {
  const picks = DEFAULT_PICKS[set];
  const used = new Set<string>();
  const slots = {} as ImageSlots;
  const next = () => d.gallery.find((g) => !used.has(g)) ?? d.gallery[0] ?? d.heroImage;
  for (const key of Object.keys(SLOT_LABELS) as SlotKey[]) {
    const pick = picks[key];
    let src: string;
    if (pick === "hero" || pick === undefined) src = d.heroImage || next();
    else src = d.gallery[pick] && !used.has(d.gallery[pick]) ? d.gallery[pick] : next();
    if (pick !== "hero" && pick !== undefined && src) used.add(src);
    slots[key] = src ?? "";
  }
  return slots;
}
