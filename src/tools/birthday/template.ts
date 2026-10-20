/** Birthday post — geometry LOCKED, ported 1:1 from the original General Post Generator. */
import { BRAND_COLORS, JOB_TITLE_MAX_CHARS, NAME_MAX_CHARS, type PostTemplate } from "@/tools/_shared/templates";

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

export const BIRTHDAY: PostTemplate = {
  id: "provident-birthday-post",
  label: "Birthday post",
  variantLabel: "Portrait",
  group: "birthday",
  groupLabel: "Birthday post",
  ctaLabel: "Generate Birthday Post",
  src: "/tools/birthday/provident-birthday-post.webp",
  width: BIRTHDAY_GEOMETRY.width,
  height: BIRTHDAY_GEOMETRY.height,
  photoArea: BIRTHDAY_GEOMETRY.photoArea,
  slots: {
    name: { ...BIRTHDAY_GEOMETRY.name, color: BRAND_COLORS.birthdayPost.name },
    jobTitle: { ...BIRTHDAY_GEOMETRY.jobTitle, color: BRAND_COLORS.birthdayPost.jobTitle },
  },
  fileStem: "Happy-Birthday",
};

/**
 * Landscape (16:9) — the portrait design laid out side by side: the photo circle on the left,
 * "Happy Birthday", the name, the designation and the message on the right, the wordmark in the
 * footer band. Artwork is 3840 x 2160 (2x a 1920 x 1080 post, same density as the portrait),
 * composed from the portrait's own elements; name and designation keep the portrait's sizes.
 * Figma: ProvToys-Templates › Marketing Tools › Birthday, frame "Birthday · Landscape".
 */
export const BIRTHDAY_LANDSCAPE: PostTemplate = {
  ...BIRTHDAY,
  id: "provident-birthday-landscape",
  label: "Birthday post (landscape)",
  variantLabel: "Landscape",
  src: "/tools/birthday/provident-birthday-landscape.webp",
  width: 3840,
  height: 2160,
  photoArea: { cx: 1240, cy: 993, r: 429, bleed: 2 },
  slots: {
    name: { ...BIRTHDAY.slots.name, cx: 2660, cy: 1060, maxWidth: 1500 },
    jobTitle: { ...BIRTHDAY.slots.jobTitle!, cx: 2660, cy: 1150, maxWidth: 1450 },
  },
  fileStem: "Happy-Birthday-Landscape",
};

export const BIRTHDAY_TEMPLATES = [BIRTHDAY, BIRTHDAY_LANDSCAPE] as const;
