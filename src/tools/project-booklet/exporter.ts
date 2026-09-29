/**
 * Download: each page is drawn from its HTML into a canvas (html-to-image — the pages are
 * HTML/CSS artwork, not canvas code like the Prov Toys post engine), then saved as a PDF
 * (the brochure), one JPEG (a single post) or a ZIP of JPEGs (a carousel).
 *
 * Pictures must be same-origin to be drawn: the saved projects' pictures are files in public/
 * (projects/index.ts), and uploads are blob: URLs.
 */
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { makeZip, zipSafeName } from "./zip";

export type Frame = { node: HTMLElement; w: number; h: number; name: string };

function blobOf(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The page couldn’t be turned into an image."))), type, quality),
  );
}

/** Waits until every picture inside `root` has loaded (or failed), so nothing is drawn blank. */
export async function picturesReady(root: HTMLElement) {
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

/** Draws each frame; `onPage` reports progress (1-based). */
export async function drawFrames(frames: Frame[], pixelRatio: number, onPage?: (i: number, n: number) => void) {
  if (!frames.length) return [];
  const fontEmbedCSS = await getFontEmbedCSS(frames[0].node);
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < frames.length; i++) {
    onPage?.(i + 1, frames.length);
    const f = frames[i];
    out.push(await toCanvas(f.node, { width: f.w, height: f.h, pixelRatio, fontEmbedCSS, cacheBust: false }));
  }
  return out;
}

export async function jpegOf(canvas: HTMLCanvasElement, quality = 0.92) {
  return blobOf(canvas, "image/jpeg", quality);
}

/**
 * A PDF with one full-page JPEG per page — the smallest valid file: catalog, page tree, and
 * per page a page object, a one-line content stream and a DCT image. Page size is in points
 * (1/72 in); 1080 × 1350 px at 96 dpi is 810 × 1012.5 pt.
 */
export async function pdfOf(canvases: HTMLCanvasElement[], pageW: number, pageH: number, quality = 0.88): Promise<Blob> {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (part: Uint8Array | string) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    pos += bytes.length;
  };

  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // binary marker line
  const n = canvases.length;
  const kids = canvases.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  offsets[1] = pos;
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets[2] = pos;
  push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`);

  for (let i = 0; i < n; i++) {
    const canvas = canvases[i];
    const jpeg = new Uint8Array(await (await blobOf(canvas, "image/jpeg", quality)).arrayBuffer());
    const page = 3 + i * 3;
    const content = page + 1;
    const image = page + 2;
    offsets[page] = pos;
    push(`${page} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${i} ${image} 0 R >> >> /Contents ${content} 0 R >>\nendobj\n`);
    const draw = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im${i} Do Q`;
    offsets[content] = pos;
    push(`${content} 0 obj\n<< /Length ${draw.length} >>\nstream\n${draw}\nendstream\nendobj\n`);
    offsets[image] = pos;
    push(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg);
    push("\nendstream\nendobj\n");
  }

  const count = 3 + n * 3;
  const xref = pos;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let k = 1; k < count; k++) table += `${String(offsets[k]).padStart(10, "0")} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export async function zipOf(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const entries = await Promise.all(files.map(async (f) => ({ name: zipSafeName(f.name), data: new Uint8Array(await f.blob.arrayBuffer()) })));
  return makeZip(entries);
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

export const slug = (s: string) =>
  s
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}
