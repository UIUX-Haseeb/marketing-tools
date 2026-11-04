/**
 * Card → PNG: the HTML/CSS card is drawn into a canvas with html-to-image (as the Events flyer and
 * the Project Booklet do), 1080 × 1920 at 1×. Pictures must be same-origin or data: URLs to be
 * drawn — the cover and wordmarks are in public/, uploads are data URLs.
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

let fontCss: Promise<string> | null = null;

export async function cardBlob(node: HTMLElement, w: number, h: number) {
  await picturesReady(node);
  fontCss ??= getFontEmbedCSS(node).catch((err) => {
    fontCss = null;
    throw err;
  });
  const fontEmbedCSS = await fontCss;
  const canvas = await toCanvas(node, { width: w, height: h, pixelRatio: 1, fontEmbedCSS, cacheBust: false, style: { transform: "none" } });
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The card couldn’t be turned into an image."))), "image/png"));
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

/** An upload, downscaled to at most `max` px on its long side, as a JPEG data URL. */
export async function photoDataUrl(file: File, max: number): Promise<string> {
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
    return cv.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
