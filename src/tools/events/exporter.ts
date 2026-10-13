/**
 * Artwork → PNG: the HTML/CSS artwork is drawn into a canvas with html-to-image (as the Project
 * Booklet does) at 2×, so the 1143 × 420 banner saves as 2286 × 840. Pictures must be
 * same-origin or data: URLs to be drawn — the library photos are in public/, uploads are data URLs.
 */
import { getFontEmbedCSS, toCanvas } from "html-to-image";

async function picturesReady(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth
        ? img.decode().catch(() => undefined)
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
  await document.fonts?.ready;
}

// The embedded font CSS is the same for every artwork (the three Google Sans Flex files) and
// slow to build, so it's made once per page load.
let fontCss: Promise<string> | null = null;

export async function artworkBlob(node: HTMLElement, w: number, h: number, pixelRatio = 2) {
  await picturesReady(node);
  fontCss ??= getFontEmbedCSS(node).catch((err) => {
    fontCss = null;
    throw err;
  });
  const fontEmbedCSS = await fontCss;
  const canvas = await toCanvas(node, { width: w, height: h, pixelRatio, fontEmbedCSS, cacheBust: false });
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The artwork couldn’t be turned into an image."))), "image/png"));
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** An upload, downscaled to at most `max` px on its long side and kept as a JPEG data URL — so it
 * survives a reload in the demo's localStorage and html-to-image can draw it. */
export async function photoDataUrl(file: File, max = 2400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.naturalWidth * k);
    cv.height = Math.round(img.naturalHeight * k);
    cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
