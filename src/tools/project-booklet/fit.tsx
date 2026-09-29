"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A text box that shrinks its copy until it fits. The box's size comes from its CSS
 * (max-height / width); the copy inside is sized as `calc(Npx * var(--k, 1))`, and this steps
 * --k down from 1 to `min`. If the copy still doesn't fit at `min` it is cut off by the box.
 * `data-fit="shrunk"` / `data-overflow="1"` let the editor list which pages needed it.
 *
 * `watch` is anything that changes when the copy changes (the text itself is fine).
 * `lines` measures by line count instead of box height — for big display type set tighter than
 * 1.0, whose glyphs always overhang the line box (the cover title).
 */
export function Fit({ className, style, min = 0.62, lines, watch, label, children }: { className?: string; style?: CSSProperties; min?: number; lines?: number; watch: unknown; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = typeof watch === "string" ? watch : JSON.stringify(watch);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const over = () => {
      if (el.scrollWidth > el.clientWidth + 1) return true;
      if (lines) return el.offsetHeight > lines * parseFloat(getComputedStyle(el).lineHeight) + 1;
      return el.scrollHeight > el.clientHeight + 1;
    };
    const run = () => {
      let k = 1;
      el.style.setProperty("--k", "1");
      while (k > min && over()) {
        k = Math.max(min, Math.round((k - 0.03) * 100) / 100);
        el.style.setProperty("--k", String(k));
      }
      el.dataset.k = String(k);
      el.dataset.fit = k < 1 ? "shrunk" : "";
      el.dataset.overflow = over() ? "1" : "";
    };
    run();
    let alive = true;
    document.fonts?.ready.then(() => alive && run());
    return () => {
      alive = false;
    };
  }, [key, min, lines]);

  return (
    <div ref={ref} className={className} style={style} data-fit-label={label}>
      {children}
    </div>
  );
}
