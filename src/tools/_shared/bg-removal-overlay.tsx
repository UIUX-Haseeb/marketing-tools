"use client";

/**
 * Full-screen "working on it" overlay shown while the background is being removed. The running robot
 * plays on a transparent background straight over the navy: VP9-alpha WebM where supported, an
 * animated WebP with alpha on Safari (which drops the alpha channel of WebM).
 */
import { useEffect, useRef, useState } from "react";
import type { RemoveBgProgress } from "./remove-bg";

const ROBOT_WEBM = "/mascot/robot-running.webm";
const ROBOT_WEBP = "/mascot/robot-running.webp";

function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/i.test(ua);
}

export function BgRemovalOverlay({ progress, onCancel }: { progress: RemoveBgProgress | null; onCancel?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [useImage, setUseImage] = useState(isSafari);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.play().catch(() => {});
  }, [useImage]);

  const pct = progress ? Math.round(progress.ratio * 100) : 0;
  const line = !progress
    ? "Warming up…"
    : progress.phase === "download"
      ? `Getting the background remover ready (first time only) · ${pct}%`
      : "Cutting out the background…";

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/90 p-6 text-paper backdrop-blur-sm">
      {useImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- animated WebP must not go through the image optimizer
        <img src={ROBOT_WEBP} alt="" className="h-40 w-auto sm:h-52" draggable={false} />
      ) : (
        <video ref={ref} src={ROBOT_WEBM} onError={() => setUseImage(true)} className="h-40 w-auto sm:h-52" autoPlay muted loop playsInline preload="auto" disablePictureInPicture aria-hidden />
      )}
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
