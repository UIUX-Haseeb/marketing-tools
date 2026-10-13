"use client";

/**
 * Upload + field helpers, copied from Prov Toys so the agent and DLD sections look and behave
 * exactly like the listing tools: PhotoDropzone and Counter from src/tools/_shared/ui.tsx,
 * SizeRow from src/tools/listing/listing-editor.tsx, the file check from _shared/export.ts.
 */
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const PHOTO_ACCEPT = ["image/jpeg", "image/jpg", "image/png"];
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export function validatePhotoFile(file: File): { ok: true } | { ok: false; error: string } {
  const byExt = /\.(jpe?g|png)$/i.test(file.name);
  if (!PHOTO_ACCEPT.includes(file.type.toLowerCase()) && !byExt) return { ok: false, error: "Please choose a JPG, JPEG or PNG image." };
  if (file.size > PHOTO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `That photo is ${mb} MB. The maximum is 10 MB.` };
  }
  return { ok: true };
}

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
        <p className="text-sm">{label ?? (compact ? "Add photo" : "Choose a photo, or drag one here")}</p>
        {!compact && <p className="text-xs text-muted-foreground">JPG or PNG, up to 10 MB. Any shape — it&apos;s cropped to the circle.</p>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => take(e.target.files?.[0])} />
      {hint}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={cn("font-mono text-[11px] tabular-nums", n > max ? "text-destructive" : "text-muted-foreground")}>{n}/{max}</span>;
}

/** One-line size control shown right under an upload. */
export function SizeRow({ id, zoom, onZoom, onReset }: { id: string; zoom: number; onZoom: (z: number) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <label htmlFor={id} className="w-8 shrink-0">
        Size
      </label>
      <Minus className="size-3" />
      <input id={id} type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
      <Plus className="size-3" />
      <button type="button" onClick={onReset} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">
        Reset
      </button>
    </div>
  );
}
