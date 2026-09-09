"use client";

/**
 * In-browser background removal (no server, nothing leaves the user's machine).
 *
 * Uses @imgly/background-removal (AGPL-3.0) with a self-hosted model bundle at
 * public/tools/_shared/bg-removal/ — ISNet fp16 (~84 MB) + ONNX runtime wasm (~12 MB), fetched
 * once and then served from the browser cache. Rebuild the bundle with
 * `node scripts/build-bg-removal-assets.mjs <model file>` if the package version changes.
 *
 * Why fp16 and not the smaller quint8: on real headshots with busy studio backgrounds the quantised
 * model leaves large patches of background behind; fp16 cuts them cleanly. The full-size model needs
 * more memory than a worker reliably gets.
 *
 * The work runs in a Web Worker (remove-bg.worker.ts) so the page stays responsive. The first run on
 * a device downloads the model, so expect 20–60 s the first time and a few seconds afterwards.
 * `progress` reports download vs. processing so the UI can say which is happening.
 */

export const BG_REMOVAL_PUBLIC_PATH = "/tools/_shared/bg-removal/";

/** Which ISNet variant to run. quint8 ≈ 42 MB, fp16 ≈ 88 MB, full ≈ 176 MB. */
export type BgModel = "isnet" | "isnet_fp16" | "isnet_quint8";
export const BG_REMOVAL_MODEL: BgModel = "isnet_fp16";
function model(): BgModel {
  const o = (globalThis as { __BG_MODEL__?: BgModel }).__BG_MODEL__; // test hook
  return o ?? BG_REMOVAL_MODEL;
}

export type RemoveBgProgress = { phase: "download" | "process"; ratio: number };

type Pending = { onProgress?: (p: RemoveBgProgress) => void; resolve: (b: Blob) => void; reject: (e: Error) => void; seen: Map<string, number>; downloaded: number; total: number };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function publicPath() {
  return new URL(BG_REMOVAL_PUBLIC_PATH, window.location.origin).href;
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./remove-bg.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: "progress"; id: number; key: string; current: number; total: number } | { type: "done"; id: number; blob: Blob } | { type: "error"; id: number; message: string };
    const p = pending.get(m.id);
    if (!p) return;
    if (m.type === "progress") {
      if (!p.onProgress) return;
      if (m.key.startsWith("fetch:")) {
        // Sum download progress across the individual resources being fetched.
        if (!p.seen.has(m.key)) {
          p.seen.set(m.key, 0);
          p.total += m.total;
        }
        p.downloaded += m.current - (p.seen.get(m.key) ?? 0);
        p.seen.set(m.key, m.current);
        p.onProgress({ phase: "download", ratio: p.total ? Math.min(1, p.downloaded / p.total) : 0 });
      } else {
        p.onProgress({ phase: "process", ratio: m.total ? m.current / m.total : 0 });
      }
    } else {
      pending.delete(m.id);
      if (m.type === "done") p.resolve(m.blob);
      else p.reject(new Error(m.message));
    }
  };
  worker.onerror = (e) => {
    const err = new Error(e.message || "The background remover crashed.");
    pending.forEach((p) => p.reject(err));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

/** Warm the library + model in the background (e.g. when a tool that uses it mounts). */
export function preloadBackgroundRemoval() {
  try {
    getWorker().postMessage({ type: "preload", publicPath: publicPath(), model: model() });
  } catch {
    /* no worker support — removeBackground will surface the error when used */
  }
}

/** Returns a transparent PNG blob of `file` with the background removed. */
export function removeBackground(file: Blob, onProgress?: (p: RemoveBgProgress) => void): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { onProgress, resolve, reject, seen: new Map(), downloaded: 0, total: 0 });
    try {
      getWorker().postMessage({ type: "remove", id, file, publicPath: publicPath(), model: model() });
    } catch (e) {
      pending.delete(id);
      reject(e as Error);
    }
  });
}
