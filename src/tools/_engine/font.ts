/**
 * LOCKED POST FONT — Google Sans Flex 400, the typeface the artwork is set in.
 * The family name is namespaced so a font installed on the user's computer cannot
 * shadow it, and the renderer requests it with NO fallback list, so a different
 * typeface can never be substituted. Only weight 400 is bundled.
 * Ported from the original General Post Generator (font-coverage.ts / loaders.ts).
 */

export const POST_FONT_FAMILY = "Provident Brand Sans";
export const POST_FONT_STACK = `"${POST_FONT_FAMILY}"`;
export const POST_FONT_WEIGHTS = [400] as const;
export const POST_FONT_URL = "/post-assets/post-sans-400.woff2";

const PROBE_TEXT = "AaBbGgQqMWil0123";
// Advance widths of PROBE_TEXT at 1000 upm, weight 400 — used to prove the canvas
// really is drawing with the bundled font and not a look-alike.
const FINGERPRINT_400 = [670, 535, 605.5, 602, 789, 597, 824, 602, 866, 944, 226, 211, 645, 367.5, 526, 535];
const FINGERPRINT_EM = 1000;
// Some renderers (Linux Chromium) round advances to whole pixels, so measure large
// and allow 1.2%. A substitute font is off by 7–50%, so this still catches it.
const FINGERPRINT_TOLERANCE = 0.012;

// Code-point ranges covered by the bundled (subsetted) font.
const COVERAGE: [number, number][] = [
  [32, 126],
  [9676, 9676],
  [57344, 57350],
  [64256, 64260],
  [120545, 120545],
];

export function isCharacterSupported(codePoint: number) {
  let lo = 0;
  let hi = COVERAGE.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end] = COVERAGE[mid];
    if (codePoint < start) hi = mid - 1;
    else if (codePoint > end) lo = mid + 1;
    else return true;
  }
  return false;
}

/** Characters in `text` the bundled font cannot draw (would render as boxes). */
export function unsupportedCharacters(text: string) {
  const out: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === 32) continue;
    if (!isCharacterSupported(cp) && !out.includes(ch)) out.push(ch);
  }
  return out;
}

let loading: Promise<FontVerification> | null = null;

export type FontVerification = { ok: boolean; error?: string };

/** Load and verify the locked font once per page. Safe to call repeatedly. */
export function ensurePostFont(): Promise<FontVerification> {
  if (!loading) loading = loadAndVerify().catch((e) => ({ ok: false, error: String(e) }));
  return loading;
}

async function loadAndVerify(): Promise<FontVerification> {
  if (typeof document === "undefined" || !document.fonts) return { ok: false, error: "Fonts API unavailable." };

  const already = [...document.fonts].some((f) => f.family.replace(/^"|"$/g, "") === POST_FONT_FAMILY);
  if (!already) {
    const face = new FontFace(POST_FONT_FAMILY, `url(${POST_FONT_URL})`, { weight: "400", style: "normal", display: "block" });
    await face.load();
    document.fonts.add(face);
  }
  for (const weight of POST_FONT_WEIGHTS) {
    const spec = `${weight} 132px ${POST_FONT_STACK}`;
    try {
      await document.fonts.load(spec, PROBE_TEXT);
    } catch {}
    if (!document.fonts.check(spec)) {
      return { ok: false, error: `The bundled ${POST_FONT_FAMILY} font did not load. Posts are not generated with a substitute font — please reload the page.` };
    }
  }
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: "Canvas is unavailable." };
  const SIZE = 1000;
  ctx.font = `400 ${SIZE}px ${POST_FONT_STACK}`;
  const chars = [...PROBE_TEXT];
  const mismatch = chars.some((ch, i) => {
    const target = (FINGERPRINT_400[i] * SIZE) / FINGERPRINT_EM;
    return Math.abs(ctx.measureText(ch).width - target) / target > FINGERPRINT_TOLERANCE;
  });
  if (mismatch) {
    return { ok: false, error: `The text is not being drawn with the bundled ${POST_FONT_FAMILY} font. Posts are never generated with a substitute font — please reload the page.` };
  }
  return { ok: true };
}

export function isPostFontReady() {
  if (typeof document === "undefined" || !document.fonts) return false;
  return POST_FONT_WEIGHTS.every((w) => document.fonts.check(`${w} 132px ${POST_FONT_STACK}`));
}
