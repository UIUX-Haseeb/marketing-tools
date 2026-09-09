/** Baby congrats posts (Boy / Girl) — geometry LOCKED, ported 1:1 from the original General Post Generator. */
import { BRAND_COLORS, NAME_MAX_CHARS, type PostTemplate } from "@/tools/_shared/templates";

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
