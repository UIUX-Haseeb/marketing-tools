/**
 * Marriage / engagement congratulations post — geometry measured from Figma:
 * Birthday-template › Frame 1618872992 (node 201:133), 1080 × 1440.
 *
 * The artwork (wordmark, gold script "Congratulations", rings, "A BEAUTIFUL NEW CHAPTER BEGINS") is a
 * flat export; we draw three text blocks into the gap: name, designation (tracked caps) and a
 * three-line message whose pronoun and occasion come from two chips.
 */
export const MARRIAGE = {
  id: "provident-marriage",
  label: "Marriage",
  fileStem: "Congratulations",
  ctaLabel: "Generate Congratulations Post",
  src: "/tools/marriage/provident-marriage.webp",
  width: 1080,
  height: 1440,
  name: { cy: 585.5, size: 55, weight: 400, color: "#F4F1EC", maxWidth: 900, minSize: 34, maxChars: 40 },
  title: { cy: 634.5, size: 18, weight: 400, color: "#6A727F", tracking: 4.5, maxWidth: 900, minSize: 13, maxChars: 40 },
  /** Message: Light 25 in warm grey, wrapped to at most three centred lines; cy is the first line's centre. */
  message: { cy: 735.5, lineHeight: 40, size: 25, weight: 300, color: "#D3CFC3", maxWidth: 470, minSize: 20, maxLines: 3 },
} as const;
