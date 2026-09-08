"use client";

import { useEffect, useRef, useState } from "react";
import { ensurePostFont } from "./font";
import { loadImage, renderPost, type Drawable, type RenderInput } from "./render";
import type { PostTemplate } from "./templates";

const artworkCache = new Map<string, Promise<HTMLImageElement>>();

/** Loads (and caches) the artwork for a template plus the locked font. */
export function usePostAssets(template: PostTemplate) {
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!artworkCache.has(template.src)) artworkCache.set(template.src, loadImage(template.src));
    artworkCache.get(template.src)!.then((img) => alive && setArtwork(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    ensurePostFont().then((r) => {
      if (!alive) return;
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
    return () => {
      alive = false;
    };
  }, [template.src]);

  return { artwork, fontReady, fontError, ready: !!artwork && fontReady };
}

/** Load a File/Blob/URL into a drawable image. */
export async function toDrawable(src: Blob | string): Promise<HTMLImageElement> {
  if (typeof src === "string") return loadImage(src);
  const url = URL.createObjectURL(src);
  try {
    return await loadImage(url);
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("That file could not be opened as an image.");
  }
}

/**
 * Keeps a <canvas> in sync with a render input, drawn at `maxPx` on the long side
 * (device-pixel aware). Returns the ref to attach.
 */
export function usePostCanvas(input: Omit<RenderInput, "templateImage"> & { templateImage: Drawable | null }, maxPx = 1080) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { template, templateImage, photo, transform, name, jobTitle, showPlaceholder } = input;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !templateImage) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, maxPx / Math.max(template.width, template.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(template.width * scale);
      const h = Math.round(template.height * scale);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      canvas.style.aspectRatio = `${template.width} / ${template.height}`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderPost(ctx, { template, templateImage, photo, transform, name, jobTitle, showPlaceholder }, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [template, templateImage, photo, transform, name, jobTitle, showPlaceholder, maxPx]);

  return ref;
}
