/**
 * Export — ported from the original General Post Generator (src/lib/render.ts exportPost).
 * PNG when it fits the byte budget, otherwise a JPEG stepped down a quality ladder.
 */
import { encodeJpeg } from "./jpeg";
import { isPostFontReady } from "./font";
import { renderPost, type RenderInput } from "./render";
import { PHOTO_ACCEPT, PHOTO_MAX_BYTES, type PostTemplate } from "./templates";

export const MAX_POST_BYTES = 1.4 * 1024 * 1024;
const JPEG_QUALITY_LADDER = [0.96, 0.94, 0.92, 0.9, 0.87, 0.84, 0.8];

export type ExportResult = {
  blob: Blob;
  format: "png" | "jpeg";
  quality: number | null;
  bytes: number;
  extension: "png" | "jpg";
};

async function encodeFaithfulJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bytes = encodeJpeg(data, canvas.width, canvas.height, { quality: Math.round(quality * 100) }) as Uint8Array;
    const blob = new Blob([bytes as BlobPart], { type: "image/jpeg" });
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      const sane = bitmap.width === canvas.width && bitmap.height === canvas.height;
      bitmap.close?.();
      if (!sane) return null;
    }
    return blob;
  } catch {
    return null;
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function exportPost(input: RenderInput, maxBytes = MAX_POST_BYTES): Promise<ExportResult> {
  if (!isPostFontReady()) {
    throw new Error("The locked brand font is not loaded, so the post was not created. Please reload the page and try again.");
  }
  const { template } = input;
  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  renderPost(ctx, { ...input, showPlaceholder: false }, 1);
  return encodeCanvas(canvas, maxBytes);
}

/** PNG if it fits the budget, else JPEG down the quality ladder. Shared by every post design. */
export async function encodeCanvas(canvas: HTMLCanvasElement, maxBytes = MAX_POST_BYTES): Promise<ExportResult> {
  const png = await toBlob(canvas, "image/png");
  if (png && png.size <= maxBytes) return { blob: png, format: "png", quality: null, bytes: png.size, extension: "png" };

  let last: Blob | null = null;
  let lastQuality = JPEG_QUALITY_LADDER[0];
  for (const q of JPEG_QUALITY_LADDER) {
    const jpeg = (await encodeFaithfulJpeg(canvas, q)) ?? (await toBlob(canvas, "image/jpeg", q));
    if (!jpeg) continue;
    last = jpeg;
    lastQuality = q;
    if (jpeg.size <= maxBytes) return { blob: jpeg, format: "jpeg", quality: q, bytes: jpeg.size, extension: "jpg" };
  }
  if (last) return { blob: last, format: "jpeg", quality: lastQuality, bytes: last.size, extension: "jpg" };
  if (png) return { blob: png, format: "png", quality: null, bytes: png.size, extension: "png" };
  throw new Error("Could not create the image file.");
}

/** e.g. Happy-Birthday-Fatima-Al-Zahra-Birthday-post.png */
export function safeFileName(template: PostTemplate, name: string, extension = "png") {
  const slug = name.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  const style = template.label.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return `${template.fileStem}${slug ? `-${slug}` : ""}${style ? `-${style}` : ""}.${extension}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validatePhotoFile(file: File): { ok: true } | { ok: false; error: string } {
  const byExt = /\.(jpe?g|png)$/i.test(file.name);
  if (!PHOTO_ACCEPT.includes(file.type.toLowerCase()) && !byExt) return { ok: false, error: "Please choose a JPG, JPEG or PNG image." };
  if (file.size > PHOTO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `That photo is ${mb} MB. The maximum is 10 MB.` };
  }
  return { ok: true };
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}
