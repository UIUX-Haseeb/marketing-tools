/**
 * Web Worker that runs @imgly/background-removal off the main thread, so the page (and the mascot
 * video on the loading overlay) keeps animating while ONNX runs on CPU.
 *
 * Messages in:  { type: "preload", publicPath } | { type: "remove", id, file, publicPath }
 * Messages out: { type: "progress", id, key, current, total } | { type: "done", id, blob } | { type: "error", id, message }
 */
import { preload, removeBackground, type Config } from "@imgly/background-removal";


self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { type: "preload"; publicPath: string; model: Config["model"] } | { type: "remove"; id: number; file: Blob; publicPath: string; model: Config["model"] };
  if (msg.type === "preload") {
    preload({ publicPath: msg.publicPath, model: msg.model, device: "cpu" }).catch(() => {});
    return;
  }
  try {
    const blob = await removeBackground(msg.file, {
      publicPath: msg.publicPath,
      model: msg.model,
      device: "cpu",
      output: { format: "image/png", quality: 1 },
      progress: (key, current, total) => self.postMessage({ type: "progress", id: msg.id, key, current, total }),
    });
    self.postMessage({ type: "done", id: msg.id, blob: await refineEdges(blob) });
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, message: (err as Error).message });
  }
};

/**
 * The model's mask is soft (it runs at 1024px and is upscaled), so the cutout keeps a 1–3 px fuzzy
 * fringe tinted by the old background. Tighten it: shave one pixel off the alpha edge, then push the
 * remaining semi-transparent band towards solid/clear while leaving a thin anti-aliased rim.
 */
async function refineEdges(png: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined") return png;
  const bmp = await createImageBitmap(png);
  const { width: w, height: h } = bmp;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return png;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // Larger images get a slightly wider shave: fringe width scales with the upscaling factor.
  const radius = Math.max(1, Math.round(Math.max(w, h) / 1400));
  const alpha = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3];
  const eroded = erode(alpha, w, h, radius);

  // Contrast curve on the eroded alpha: below LO → transparent, above HI → solid, smooth in between.
  const LO = 0.35, HI = 0.8;
  for (let i = 0; i < w * h; i++) {
    let a = eroded[i] / 255;
    a = a <= LO ? 0 : a >= HI ? 1 : (a - LO) / (HI - LO);
    a = a * a * (3 - 2 * a); // smoothstep for a soft but tight rim
    d[i * 4 + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

/** Separable min filter (square kernel) — cheap morphological erosion of an 8-bit mask. */
function erode(src: Uint8ClampedArray, w: number, h: number, r: number) {
  const tmp = new Uint8ClampedArray(w * h);
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        const v = xx < 0 || xx >= w ? 0 : src[row + xx];
        if (v < m) m = v;
      }
      tmp[row + x] = m;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = 255;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        const v = yy < 0 || yy >= h ? 0 : tmp[yy * w + x];
        if (v < m) m = v;
      }
      out[y * w + x] = m;
    }
  }
  return out;
}
