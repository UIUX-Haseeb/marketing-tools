"use client";

/** Small pieces the CRM's events screens use: pills, a switch, a key/value card, copy, overlays. */
import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PILL = {
  grey: "bg-muted text-foreground",
  info: "bg-info/12 text-info",
  warn: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  outline: "border text-muted-foreground",
} as const;

export function Pill({ tone = "grey", children, className }: { tone?: keyof typeof PILL; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-[11px] leading-none", PILL[tone], className)}>{children}</span>;
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50", checked ? "bg-primary" : "bg-muted")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-sm transition-transform", checked && "translate-x-4")} />
      </button>
      {label}
    </label>
  );
}

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <p className="kicker border-b px-4 py-3">{title}</p>
      {children}
    </section>
  );
}

export function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-6 px-4 py-2.5 text-sm">
          <dt className="shrink-0 text-muted-foreground">{k}</dt>
          <dd className="min-w-0 text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => undefined);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
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

/** Right-hand pop-out (the stage page's "Event details"). */
export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside role="dialog" aria-label={title} className="absolute inset-y-0 right-0 flex w-full max-w-[1000px] flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b bg-card px-5 py-3.5">
          <h2 className="text-base font-normal">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}

/** Centred dialog (Add event / Edit event). */
export function Modal({ label, onClose, children, className }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:py-6">
      <div className="fixed inset-0 bg-navy/40" onClick={onClose} />
      <div role="dialog" aria-modal aria-label={label} className={cn("relative flex max-h-[calc(100vh-3rem)] w-full flex-col rounded-2xl bg-card shadow-2xl", className)}>
        {children}
      </div>
    </div>
  );
}
