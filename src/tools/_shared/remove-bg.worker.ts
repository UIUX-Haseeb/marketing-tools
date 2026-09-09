/**
 * Web Worker that runs @imgly/background-removal off the main thread, so the page (and the mascot
 * video on the loading overlay) keeps animating while ONNX runs on CPU.
 *
 * Messages in:  { type: "preload", publicPath } | { type: "remove", id, file, publicPath }
 * Messages out: { type: "progress", id, key, current, total } | { type: "done", id, blob } | { type: "error", id, message }
 */
import { preload, removeBackground, type Config } from "@imgly/background-removal";

const MODEL: Config["model"] = "isnet_quint8";

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { type: "preload"; publicPath: string } | { type: "remove"; id: number; file: Blob; publicPath: string };
  if (msg.type === "preload") {
    preload({ publicPath: msg.publicPath, model: MODEL, device: "cpu" }).catch(() => {});
    return;
  }
  try {
    const blob = await removeBackground(msg.file, {
      publicPath: msg.publicPath,
      model: MODEL,
      device: "cpu",
      output: { format: "image/png", quality: 1 },
      progress: (key, current, total) => self.postMessage({ type: "progress", id: msg.id, key, current, total }),
    });
    self.postMessage({ type: "done", id: msg.id, blob });
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, message: (err as Error).message });
  }
};
