/**
 * Condolence post — geometry LOCKED, ported 1:1 from the original General Post Generator.
 * Artwork 1101 × 1468: "With deepest condolences … We are deeply saddened by the passing of the beloved"
 * then our two dynamic lines: "<relation> of our colleague <Name>." and the closing paragraph.
 */
export const CONDOLENCE = {
  id: "provident-condolence",
  label: "Condolence",
  fileStem: "With-deepest-condolences",
  ctaLabel: "Generate Condolence Post",
  src: "/tools/condolence/provident-condolence.webp",
  width: 1101,
  height: 1468,
  /** Ink is drawn then its alpha raised to this power so the strokes read as thin as the artwork's own text. */
  inkGamma: 2.2,
  colors: { lead: "#B0905C", name: "#FFFFFF", message: "#ECE7DF" },
  // "<relation> of our colleague <Name>." — one line, left margin shared with every fixed line.
  // Auto-shrinks rather than wrapping so gold and white never land on separate rows.
  lead: { x: 103, cy: 769, maxWidth: 880, weight: 400, maxFontSize: 31.45, minFontSize: 22 },
  // Closing paragraph; cy is the FIRST line's centre and the paragraph grows downwards.
  message: { x: 103, cy: 848, maxWidth: 880, weight: 400, maxFontSize: 31.45, minFontSize: 24, lineHeight: 51, maxLines: 3, maxChars: 260 },
  nameMaxChars: 35,
} as const;
