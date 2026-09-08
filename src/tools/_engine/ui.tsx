"use client";

/**
 * Shared UI for post tools: live preview canvas, photo dropzone, photo position controls.
 * Keep these dumb — state lives in the tool.
 */
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Upload, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_ZOOM, MIN_ZOOM, type Drawable, type PhotoTransform } from "./render";
import type { PostTemplate } from "./templates";
import { usePostCanvas } from "./use-post";
import { validatePhotoFile } from "./export";

/* ── Preview ─────────────────────────────────────────────────────────────── */

export function PostPreview({
  template,
  artwork,
  photo,
  transform,
  name,
  jobTitle,
  maxPx = 1080,
  className,
  onDrag,
  showPlaceholder = true,
}: {
  template: PostTemplate;
  artwork: Drawable | null;
  photo?: Drawable | null;
  transform: PhotoTransform;
  name: string;
  jobTitle?: string;
  maxPx?: number;
  className?: string;
  /** Called with a delta in TEMPLATE pixels while the user drags the photo. */
  onDrag?: (dx: number, dy: number) => void;
  showPlaceholder?: boolean;
}) {
  const ref = usePostCanvas({ template, templateImage: artwork, photo, transform, name, jobTitle: jobTitle ?? "", showPlaceholder }, maxPx);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const draggable = !!onDrag && !!photo && !!template.photoArea;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-navy", className)} style={{ aspectRatio: `${template.width} / ${template.height}` }}>
      <canvas
        ref={ref}
        className={cn("block h-full w-full touch-none", draggable && "cursor-grab active:cursor-grabbing")}
        onPointerDown={(e) => {
          if (!draggable) return;
          drag.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !onDrag) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const k = template.width / rect.width;
          onDrag((e.clientX - drag.current.x) * k, (e.clientY - drag.current.y) * k);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      {!artwork && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
    </div>
  );
}

/* ── Photo dropzone ──────────────────────────────────────────────────────── */

export function PhotoDropzone({ onFile, hint, compact, label }: { onFile: (f: File) => void; hint?: ReactNode; compact?: boolean; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = useCallback(
    (f?: File | null) => {
      if (!f) return;
      const v = validatePhotoFile(f);
      if (!v.ok) return setError(v.error);
      setError(null);
      onFile(f);
    },
    [onFile],
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-center transition-colors hover:bg-secondary/60",
          compact ? "px-3 py-3" : "px-4 py-8",
          over && "border-navy-2 bg-secondary",
        )}
      >
        <Upload className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{label ?? (compact ? "Add photo" : "Choose a photo, or drag one here")}</p>
        {!compact && <p className="text-xs text-muted-foreground">JPG or PNG, up to 10 MB. Any shape — it&apos;s cropped to the circle.</p>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => take(e.target.files?.[0])} />
      {hint}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ── Zoom + nudge ────────────────────────────────────────────────────────── */

export function PhotoControls({
  transform,
  onChange,
  onReset,
  disabled,
}: {
  transform: PhotoTransform;
  onChange: (patch: Partial<PhotoTransform>) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const nudge = (dx: number, dy: number) => onChange({ offsetX: transform.offsetX + dx, offsetY: transform.offsetY + dy });
  const step = 20;
  return (
    <div className={cn("space-y-3", disabled && "pointer-events-none opacity-50")}>
      <div className="space-y-1.5">
        <Label htmlFor="zoom" className="text-xs text-muted-foreground">Zoom</Label>
        <div className="flex items-center gap-2">
          <Minus className="size-3.5 text-muted-foreground" />
          <input
            id="zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={transform.zoom}
            onChange={(e) => onChange({ zoom: Number(e.target.value) })}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy"
          />
          <Plus className="size-3.5 text-muted-foreground" />
          <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">{transform.zoom.toFixed(2)}×</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-3 gap-1">
          <span />
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Move photo up" onClick={() => nudge(0, -step)}><ArrowUp /></Button>
          <span />
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Move photo left" onClick={() => nudge(-step, 0)}><ArrowLeft /></Button>
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Move photo down" onClick={() => nudge(0, step)}><ArrowDown /></Button>
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Move photo right" onClick={() => nudge(step, 0)}><ArrowRight /></Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Drag the photo in the preview, or nudge it here.
          <button type="button" onClick={onReset} className="mt-1 flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            <RotateCcw className="size-3" /> Reset position
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Field with counter ──────────────────────────────────────────────────── */

export function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={cn("font-mono text-[11px] tabular-nums", n > max ? "text-destructive" : "text-muted-foreground")}>{n}/{max}</span>;
}

/* ── Minimal modal ───────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-background p-6 shadow-xl", wide ? "max-w-4xl" : "max-w-xl")}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-h2 font-medium">{title}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
}
