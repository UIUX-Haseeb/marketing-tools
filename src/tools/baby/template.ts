/**
 * Baby congrats posts (Boy / Girl) — geometry LOCKED.
 * Sep 2026 redesign: canvas widened from 810 to 1080 (135 px of pattern added each side, Figma
 * "Birthday-template" nodes 94:2503 / 145:9746). Vertical layout is unchanged, so the name slot only
 * moved horizontally to the new centre.
 */
import { BRAND_COLORS, NAME_MAX_CHARS, type PostTemplate } from "@/tools/_shared/templates";

const BABY_GEOMETRY = {
  width: 1080,
  height: 1440,
  name: {
    cx: 540,
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


export const BABY_BOY: PostTemplate = {
  id: "provident-baby-boy",
  label: "It's a Boy",
  group: "baby",
  groupLabel: "Baby congrats",
  variantLabel: "It's a Boy",
  ctaLabel: "Generate Congratulations Post",
  src: "/tools/baby/provident-baby-boy.webp",
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
  src: "/tools/baby/provident-baby-girl.webp",
};
