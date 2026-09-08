"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Silent looping mascot video. Client component because React doesn't emit the
 * `muted` attribute in SSR HTML, and browsers only autoplay videos that are
 * muted at load — so we mute and start playback explicitly on mount.
 */
export function MascotLoopClient({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    const play = () => v.play().catch(() => {});
    play();
    // Retry once the page becomes visible / after a user gesture, in case autoplay was blocked.
    const onVisible = () => document.visibilityState === "visible" && play();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", play, { once: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", play);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={cn("aspect-square w-full rounded-2xl object-cover", className)}
      src="/mascot/robot-dancing.mp4"
      poster="/mascot/robot-dancing-poster.webp"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden
    />
  );
}
