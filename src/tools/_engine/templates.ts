/**
 * POST TEMPLATES — geometry is LOCKED.
 * Ported 1:1 from the original General Post Generator (src/lib/templates.ts).
 * Every number was measured on the artwork; do not "tidy" them.
 */

export type TextSlot = {
  cx: number;
  cy: number;
  maxWidth: number;
  fontWeight: number;
  maxFontSize: number;
  minFontSize: number;
  /** Tracking in em — does not scale with resolution. */
  letterSpacing: number;
  uppercase: boolean;
  maxChars: number;
  color: string;
};

export type PhotoArea = { cx: number; cy: number; r: number; bleed: number };

export type PostTemplate = {
  id: string;
  label: string;
  group: "birthday" | "baby";
  groupLabel: string;
  variantLabel?: string;
  ctaLabel: string;
  /** Public URL of the artwork. */
  src: string;
  width: number;
  height: number;
  /** Omitted entirely when the design takes no photo. */
  photoArea?: PhotoArea;
  slots: { name: TextSlot; jobTitle?: TextSlot };
  fileStem: string;
};

export const NAME_MAX_CHARS = 35;
export const JOB_TITLE_MAX_CHARS = 35;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

const BRAND_COLORS = {
  // Live birthday artwork reverses the usual pairing: NAME gold, DESIGNATION white.
  birthdayPost: { name: "#B0905C", jobTitle: "#FFFFFF" },
  // Baby designs carry only a name, off-white to match the fixed line beneath it.
  babyPost: { name: "#ECE7DF" },
} as const;

const BIRTHDAY_GEOMETRY = {
  // Artwork is 2160 x 2936 — exactly twice the original export.
  // Flood-filling the placeholder gives cx 1078.5, cy 1402.5, r 429.0.
  width: 2160,
  height: 2936,
  photoArea: { cx: 1078, cy: 1402, r: 429, bleed: 2 },
  name: {
    cx: 1078,
    cy: 2284,
    maxWidth: 1760,
    fontWeight: 400,
    maxFontSize: 94,
    minFontSize: 56,
    letterSpacing: 0,
    uppercase: false,
    maxChars: NAME_MAX_CHARS,
  },
  jobTitle: {
    cx: 1078,
    cy: 2374,
    maxWidth: 1680,
    fontWeight: 400,
    maxFontSize: 38,
    minFontSize: 26,
    letterSpacing: 0.14,
    uppercase: true,
    maxChars: JOB_TITLE_MAX_CHARS,
  },
};

const BABY_GEOMETRY = {
  width: 810,
  height: 1440,
  name: {
    cx: 405,
    // Rendered ink lands on the reference's rows 1272-1293.
    cy: 1285,
    // Width of "Congratulations to", the widest line already on the design.
    maxWidth: 479,
    fontWeight: 400,
    maxFontSize: 28.7,
    minFontSize: 20,
    letterSpacing: 0,
    uppercase: false,
    maxChars: NAME_MAX_CHARS,
  },
};

const ASSETS = "/post-assets";

export const BIRTHDAY: PostTemplate = {
  id: "provident-birthday-post",
  label: "Birthday post",
  group: "birthday",
  groupLabel: "Birthday post",
  ctaLabel: "Generate Birthday Post",
  src: `${ASSETS}/provident-birthday-post.webp`,
  width: BIRTHDAY_GEOMETRY.width,
  height: BIRTHDAY_GEOMETRY.height,
  photoArea: BIRTHDAY_GEOMETRY.photoArea,
  slots: {
    name: { ...BIRTHDAY_GEOMETRY.name, color: BRAND_COLORS.birthdayPost.name },
    jobTitle: { ...BIRTHDAY_GEOMETRY.jobTitle, color: BRAND_COLORS.birthdayPost.jobTitle },
  },
  fileStem: "Happy-Birthday",
};

export const BABY_BOY: PostTemplate = {
  id: "provident-baby-boy",
  label: "It's a Boy",
  group: "baby",
  groupLabel: "Baby congrats",
  variantLabel: "It's a Boy",
  ctaLabel: "Generate Congratulations Post",
  src: `${ASSETS}/provident-baby-boy.webp`,
  width: BABY_GEOMETRY.width,
  height: BABY_GEOMETRY.height,
  slots: { name: { ...BABY_GEOMETRY.name, color: BRAND_COLORS.babyPost.name } },
  fileStem: "Congratulations",
};

export const BABY_GIRL: PostTemplate = {
  ...BABY_BOY,
  id: "provident-baby-girl",
  label: "It's a Girl",
  variantLabel: "It's a Girl",
  src: `${ASSETS}/provident-baby-girl.webp`,
};

export const TEMPLATES: PostTemplate[] = [BIRTHDAY, BABY_BOY, BABY_GIRL];

export const usesPhoto = (t: PostTemplate) => t.photoArea !== undefined;
export const usesJobTitle = (t: PostTemplate) => t.slots.jobTitle !== undefined;
