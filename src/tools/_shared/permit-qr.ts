"use client";
/**
 * The permit QR every listing-type design carries (Dubai Land Department / Trakheesi permit),
 * preloaded so agents don't upload it. 684 × 684 — the supplied 171 px code at 4×, nearest
 * neighbour so the modules stay sharp; checked to still scan. Replace the file to change it.
 */
import { useEffect, useState } from "react";
import { loadImage } from "./render";

export const PERMIT_QR_SRC = "/tools/_shared/permit-qr.png";

let cached: Promise<HTMLImageElement> | null = null;

/** The permit QR as a drawable image, or null for the moment it takes to load. */
export function usePermitQr(): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    cached ??= loadImage(PERMIT_QR_SRC);
    cached.then((i) => alive && setImg(i)).catch(() => {
      cached = null;
    });
    return () => {
      alive = false;
    };
  }, []);
  return img;
}
