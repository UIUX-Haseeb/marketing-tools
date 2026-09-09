/**
 * POST TEMPLATE TYPES + shared constants.
 * Each tool defines its own template(s) in its folder (e.g. tools/birthday/template.ts).
 * Geometry is LOCKED — every number was measured on the artwork; do not "tidy" them.
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

export const BRAND_COLORS = {
  // Live birthday artwork reverses the usual pairing: NAME gold, DESIGNATION white.
  birthdayPost: { name: "#B0905C", jobTitle: "#FFFFFF" },
  // Baby designs carry only a name, off-white to match the fixed line beneath it.
  babyPost: { name: "#ECE7DF" },
} as const;


export const usesPhoto = (t: PostTemplate) => t.photoArea !== undefined;
export const usesJobTitle = (t: PostTemplate) => t.slots.jobTitle !== undefined;
