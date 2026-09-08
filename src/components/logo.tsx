/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Prov Toys wordmark ("provtoys." — navy, italic "toys", orange dot).
 * Source files: public/provtoys-navy.svg (light surfaces) and public/provtoys-white.svg (navy surfaces).
 * Height controls size; width follows the 578:128 ratio (≈4.5:1).
 */
export function Logo({ className, tone = "dark", height = 24 }: { className?: string; tone?: "dark" | "light"; height?: number }) {
  return (
    <img
      src={tone === "light" ? "/provtoys-white.svg" : "/provtoys-navy.svg"}
      alt="provtoys."
      height={height}
      width={Math.round(height * (578 / 128))}
      className={cn("block shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
