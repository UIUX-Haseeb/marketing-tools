import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Prov Toys mascot. Use sparingly — one per screen, only where a human would
 * naturally react: empty states, "coming soon", 404, and the login welcome.
 *
 *  <Mascot pose="confused" size={160} />   transparent PNG, sits on any surface
 *  <MascotLoop />                          silent 9s dancing loop in a rounded tile
 */
export function Mascot({ pose = "confused", size = 160, className }: { pose?: "confused"; size?: number; className?: string }) {
  const src = size <= 240 ? `/mascot/robot-${pose}-sm.webp` : `/mascot/robot-${pose}.webp`;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("select-none pointer-events-none", className)}
      priority={false}
    />
  );
}

export function MascotLoop({ className }: { className?: string }) {
  return (
    <video
      className={cn("aspect-square w-full rounded-2xl object-cover", className)}
      src="/mascot/robot-dancing.mp4"
      poster="/mascot/robot-dancing-poster.webp"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
    />
  );
}
