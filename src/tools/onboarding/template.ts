/**
 * Onboarding ("Welcome Aboard!") post — geometry measured from Figma:
 * Birthday-template › Frame 1618872986 (node 131:185), 1080 × 1350.
 *
 * Layers, bottom to top: background artwork (navy gradient + circle pattern + upper gradient),
 * the new joiner's photo (cutout, cover-fit in a 622×897 box), a bottom fade that melts the photo
 * into the background, then the text.
 */
export const ONBOARDING = {
  id: "provident-onboarding",
  label: "Welcome Aboard",
  fileStem: "Welcome-Aboard",
  ctaLabel: "Generate Welcome Post",
  width: 1080,
  height: 1350,
  assets: {
    /** Flattened export of: Rectangle + bg pattern + upper gradient (1080×1350). */
    background: "/tools/onboarding/background.png",
    /** Transparent PNG of the "bottom gradient" layer as it appears (1080×515), drawn at the bottom edge. */
    bottomFade: "/tools/onboarding/bottom-fade.png",
  },
  photo: { x: 245, y: 443, w: 622, h: 897 },
  fade: { h: 515 },
  headline: { text: "Welcome Aboard!", cy: 242.4, size: 87.9, weight: 400, color: "#FFFFFF", maxWidth: 960 },
  sub: {
    lines: ["We are excited to have you on the team and hope this", "new role brings you great success"],
    cy: [328.2, 363.6],
    size: 23.9,
    weight: 300,
    color: "#F4F1EC",
  },
  name: { cy: 1178.5, size: 42, weight: 400, color: "#FFFFFF", maxWidth: 900, minSize: 28, maxChars: 40 },
  title: { cy: 1239.8, size: 20.2, weight: 400, color: "#B0905C", maxWidth: 700, minSize: 15, maxChars: 40, uppercase: true },
} as const;
