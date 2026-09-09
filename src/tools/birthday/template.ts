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
