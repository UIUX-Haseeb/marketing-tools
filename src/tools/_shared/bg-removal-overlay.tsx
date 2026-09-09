"use client";

/**
 * Full-screen "working on it" overlay shown while the background is being removed. Plays the robot
 * mascot clip (paper plane) on loop; if that file isn't there yet it falls back to the dancing loop.
 */
import { useEffect, useRef, useState } from "react";
import type { RemoveBgProgress } from "./remove-bg";

const PAPER_PLANE = "/mascot/robot-paper-plane.mp4";
const FALLBACK = "/mascot/robot-dancing.mp4";

export function BgRemovalOverlay({ progress, onCancel }: { progress: RemoveBgProgress | null; onCancel?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(PAPER_PLANE);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.play().catch(() => {});
  }, [src]);

  const pct = progress ? Math.round(progress.ratio * 100) : 0;
  const line = !progress
    ? "Warming up…"
    : progress.phase === "download"
      ? `Getting the background remover ready (first time only) · ${pct}%`
      : "Cutting out the background…";

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-navy/90 p-6 text-paper backdrop-blur-sm">
      <video
        ref={ref}
        key={src}
        src={src}
        onError={() => src !== FALLBACK && setSrc(FALLBACK)}
        className="aspect-square w-56 rounded-2xl object-cover shadow-xl sm:w-72"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden
      />
      <div className="text-center">
        <p className="text-lg">Removing the background</p>
        <p className="mt-1 text-sm text-paper/70">{line}</p>
      </div>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-paper/20 sm:w-72">
        <div className={progress?.phase === "process" ? "h-full w-1/3 animate-pulse rounded-full bg-orange" : "h-full rounded-full bg-orange transition-[width]"} style={progress?.phase === "process" ? undefined : { width: `${pct}%` }} />
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} className="text-sm text-paper/70 underline-offset-4 hover:text-paper hover:underline">
          Use the photo as it is
        </button>
      )}
    </div>
  );
}
