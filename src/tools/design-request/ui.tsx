"use client";

/**
 * Small pieces in the portal's support-ticket style: choice cards, toggle chips, the file drop
 * zone, pills, the centred dialog, the right-hand sheet and the "More" menu. Modal is copied from
 * events/ui.tsx.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CloudUpload, FileText, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isLowRes } from "./rules";
import { settings } from "./settings";
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
  const [refused, setRefused] = useState<string[]>([]);
  const take = async (list: FileList | null) => {
    if (!list?.length) return;
    let added = await Promise.all(Array.from(list).map(describe));
    // Settings › Files › "Refuse the picture": small pictures aren't accepted at all.
    const refuse = checkRes && settings().files.mode === "refuse" ? added.filter(isLowRes) : [];
    setRefused(refuse.map((a) => a.name));
    added = added.filter((a) => !refuse.includes(a));
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
      {refused.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" /> Not added — under {settings().files.minPx} px on the long side: {refused.join(", ")}
        </p>
      )}
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
        <span title={`Under ${settings().files.minPx} px on the long side — fine for a small post, too soft for print or a big screen.`} className="inline-flex shrink-0 items-center gap-1 text-xs text-warning">
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

/** The portal's request pop-out: a wide right-hand sheet; the board builds its header, body and footer. */
export function Sheet({ label, onClose, children, width = "max-w-[1040px]" }: { label: string; onClose: () => void; children: ReactNode; width?: string }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside role="dialog" aria-label={label} className={cn("absolute inset-y-0 right-0 flex w-full flex-col bg-card shadow-2xl", width)}>
        {children}
      </aside>
    </div>
  );
}

/** "··· More" — a small menu that opens upwards from the sheet's footer. */
export function Menu({ trigger, items }: { trigger: ReactNode; items: ({ label: string; icon?: ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void } | "divider")[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", away);
    return () => window.removeEventListener("mousedown", away);
  }, [open]);
  if (!items.length) return null;
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
        {trigger}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-60 rounded-xl border bg-popover p-1 shadow-xl">
          {items.map((it, i) =>
            it === "divider" ? (
              <div key={i} className="my-1 border-t" />
            ) : (
              <button
                key={it.label}
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary disabled:opacity-40 [&_svg]:size-4", it.danger && "text-destructive")}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
