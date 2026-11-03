"use client";

/**
 * Small pieces in the portal's support-ticket style: choice cards, toggle chips, the file drop
 * zone, pills, the centred dialog and the right-hand pop-out. Modal / Drawer are copied from
 * events/ui.tsx.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CloudUpload, FileText, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isLowRes, LOW_RES_PX } from "./rules";
import type { Attachment } from "./types";

export function Field({ label, htmlFor, required, help, error, children, className }: { label: string; htmlFor?: string; required?: boolean; help?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && "*"}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/** The ticket dialog's big option card ("Something is broken" / "It's slowing me down"). */
export function ChoiceCard({ selected, onClick, icon, title, help, className }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; help?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        selected && "border-navy-2 bg-secondary/70 shadow-[inset_0_0_0_1px_var(--navy-2)] dark:border-paper/60",
        className,
      )}
    >
      {icon}
      <span className="min-w-0">
        <span className="block text-sm font-normal">{title}</span>
        {help && <span className="mt-0.5 block text-xs text-muted-foreground">{help}</span>}
      </span>
    </button>
  );
}

/** Multi-select as a row of toggle chips. */
export function Chips({ options, value, onChange, id }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; id?: string }) {
  return (
    <div id={id} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : options.filter((x) => x === o || value.includes(x)))}
            className={cn(
              "h-8 rounded-full border px-3.5 text-sm transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/40",
              on && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Check({ checked, onChange, children, id }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-navy-2" />
      <span>{children}</span>
    </label>
  );
}

export const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

async function describe(f: File): Promise<Attachment> {
  const a: Attachment = { name: f.name, size: f.size, type: f.type };
  if (f.type.startsWith("image/") && f.type !== "image/svg+xml") {
    try {
      const bmp = await createImageBitmap(f);
      a.width = bmp.width;
      a.height = bmp.height;
      bmp.close();
    } catch {}
  }
  return a;
}

/** "Drag files here, or click to choose" — keeps each file's name, size and pixel size. */
/** `checkRes` warns about small pictures — for assets that get designed with, not QR codes or approvals. */
export function DropZone({ id, files, onChange, accept, hint, compact, error, checkRes }: { id: string; files: Attachment[]; onChange: (f: Attachment[]) => void; accept?: string; hint?: string; compact?: boolean; error?: boolean; checkRes?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = async (list: FileList | null) => {
    if (!list?.length) return;
    const added = await Promise.all(Array.from(list).map(describe));
    onChange([...files, ...added.filter((a) => !files.some((x) => x.name === a.name && x.size === a.size))]);
  };
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-controls={id}
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
          take(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-center transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/40",
          compact ? "px-3 py-3" : "px-4 py-6",
          over && "border-navy-2 bg-secondary",
          error && "border-destructive",
        )}
      >
        <CloudUpload className={cn("text-muted-foreground", compact ? "size-4" : "size-6")} />
        <p className="text-sm font-normal">Drag files here, or click to choose</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <input id={id} ref={input} type="file" multiple accept={accept} className="sr-only" onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <FileRow key={`${f.name}-${i}`} file={f} checkRes={checkRes} onRemove={() => onChange(files.filter((_, j) => j !== i))} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FileRow({ file, onRemove, checkRes }: { file: Attachment; onRemove?: () => void; checkRes?: boolean }) {
  const low = checkRes && isLowRes(file);
  return (
    <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      {file.width && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.width} × {file.height}</span>}
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{fmtSize(file.size)}</span>
      {low && (
        <span title={`Under ${LOW_RES_PX} px on the long side — fine for a small post, too soft for print or a big screen.`} className="inline-flex shrink-0 items-center gap-1 text-xs text-warning">
          <AlertTriangle className="size-3.5" /> Low resolution
        </span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

const PILL = {
  grey: "bg-secondary text-foreground/80",
  info: "bg-info/12 text-info",
  warn: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  success: "bg-success/12 text-success",
  outline: "border text-muted-foreground",
} as const;
export type Tone = keyof typeof PILL;

export function Pill({ tone = "grey", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-[1.2] font-medium [&_svg]:size-3", PILL[tone], className)}>{children}</span>;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

/** Centred dialog. The backdrop doesn't close it — one stray click shouldn't lose a filled-in form. */
export function Modal({ label, onClose, children, className }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:py-8">
      <div className="fixed inset-0 bg-navy/40" />
      <div role="dialog" aria-modal aria-label={label} className={cn("relative flex max-h-[calc(100vh-4rem)] w-full flex-col rounded-2xl border bg-card shadow-2xl", className)}>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside role="dialog" className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b bg-card px-5 py-3.5">
          <div className="min-w-0 text-base font-normal">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
