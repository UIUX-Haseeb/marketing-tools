"use client";

/**
 * The Brochure dialog — opened from one listing's "Brochure" button, or from the stage page with
 * several listings selected. Every field comes from the listings; the dialog only adds what they
 * don't hold: the design, the agent (demo employee list + contact placeholders), the five
 * pictures per property, each property's permit QR, and the order. Preview on the right;
 * Download PDF draws the pages at 2× into one PDF.
 */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Download, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EMPLOYEES } from "@/lib/demo/employees";
import { logGeneratedPost } from "@/lib/store";
import { cn } from "@/lib/utils";
import { agentFrom } from "./agent";
import { downloadBlob, drawFrames, formatBytes, pdfOf, picturesReady, slug } from "./exporter";
import { headline } from "./format";
import { buildBrochure } from "./pages";
import { DESIGNS, FULL_PHOTO, HIDE_LOGO, PAGE, defaultSlots, newItem, type Agent, type Design, type Frame, type Item, type Listing } from "./types";
import { Modal } from "./ui";

/** A page drawn at its real size and scaled to the box's width. */
export function Scaled({ children, w = PAGE.w, h = PAGE.h, className }: { children: ReactNode; w?: number; h?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.25);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

const SLOT_NAMES = ["Cover", "Row 1", "Row 2", "Row 3", "Row 4"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b px-5 py-4 last:border-b-0">
      <p className="kicker">{title}</p>
      {children}
    </section>
  );
}

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{label}</Label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#2f4960]" />
    </div>
  );
}

const sameFrame = (a: Frame, b: Frame) => a.zoom === b.zoom && a.x === b.x && a.y === b.y;

/**
 * Cover framing. The portal stamps "provident." into the lower left of its pictures; "Hide portal
 * logo" (the default) anchors the photo to its top so the stamp is cropped off, "Whole photo" shows it
 * all, and Zoom / Across / Down fine-tune for pictures where the stamp sits elsewhere.
 */
function FrameControls({ frame, onChange }: { frame: Frame; onChange: (f: Frame) => void }) {
  return (
    <div className="space-y-2 rounded-md bg-secondary/50 p-2.5">
      <div className="flex gap-1.5">
        {([["Hide portal logo", HIDE_LOGO], ["Whole photo", FULL_PHOTO]] as const).map(([label, f]) => (
          <button key={label} type="button" onClick={() => onChange(f)} aria-pressed={sameFrame(frame, f)} className={cn("h-7 rounded-full border bg-card px-2.5 text-xs", sameFrame(frame, f) ? "border-[#2f4960] bg-[#2f4960] text-white" : "hover:bg-secondary")}>
            {label}
          </button>
        ))}
      </div>
      <Slider id="fr-zoom" label="Zoom" value={frame.zoom} min={1} max={2.5} step={0.05} onChange={(zoom) => onChange({ ...frame, zoom })} />
      <Slider id="fr-x" label="Across" value={frame.x} min={0} max={1} step={0.02} onChange={(x) => onChange({ ...frame, x })} />
      <Slider id="fr-y" label="Down" value={frame.y} min={0} max={1} step={0.02} onChange={(y) => onChange({ ...frame, y })} />
    </div>
  );
}

/** One property's settings: its five pictures, its permit QR, its place in the brochure. */
function PropertyRow({ item, index, count, open, onToggle, onChange, onMove, onRemove }: {
  item: Item; index: number; count: number; open: boolean; onToggle: () => void;
  onChange: (i: Item) => void; onMove: (d: -1 | 1) => void; onRemove: () => void;
}) {
  const { l, slots, qr } = item;
  const [slot, setSlot] = useState(0);
  const qrInput = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-expanded={open}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.photos[slots[0]]} alt="" className="size-9 shrink-0 rounded object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-sm">{index + 1}. {headline(l)}</span>
            <span className="block truncate text-xs text-muted-foreground">{l.ref} · {l.community}</span>
          </span>
          <ChevronDown className={cn("ml-auto size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {count > 1 && (
          <span className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" className="size-7" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp /></Button>
            <Button variant="ghost" size="icon" className="size-7" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown /></Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remove from brochure"><Trash2 /></Button>
          </span>
        )}
      </div>
      {open && (
        <div className="space-y-3 border-t px-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            {SLOT_NAMES.map((name, i) => (
              <button key={name} type="button" onClick={() => setSlot(i)} aria-pressed={slot === i} className={cn("h-7 rounded-full border px-2.5 text-xs", slot === i ? "border-[#2f4960] bg-[#2f4960] text-white" : "hover:bg-secondary")}>
                {name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {l.photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => onChange({ ...item, slots: slots.map((v, k) => (k === slot ? i : v)) })}
                aria-label={`Picture ${i + 1}`}
                aria-pressed={slots[slot] === i}
                className={cn("relative aspect-[4/3] overflow-hidden rounded ring-offset-1", slots[slot] === i ? "ring-2 ring-[#f3793c]" : slots.includes(i) ? "opacity-90" : "opacity-55 hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          {slot === 0 && <FrameControls frame={item.frame} onChange={(frame) => onChange({ ...item, frame })} />}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={qrInput}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChange({ ...item, qr: URL.createObjectURL(f) });
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => qrInput.current?.click()}>
              <ImagePlus /> {qr ? "Replace permit QR" : "Permit QR"}
            </Button>
            {qr && (
              <Button variant="ghost" size="sm" onClick={() => onChange({ ...item, qr: null })}>
                Remove QR
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onChange({ ...item, slots: defaultSlots(l) })}>
              Reset pictures
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BrochureStudio({ listings, onClose, initialAgent = 0 }: { listings: Listing[]; onClose: () => void; initialAgent?: number }) {
  const [design, setDesign] = useState<Design>("a");
  const [agent, setAgent] = useState<Agent>(() => agentFrom(EMPLOYEES[initialAgent % EMPLOYEES.length]));
  const [items, setItems] = useState<Item[]>(() => listings.map(newItem));
  const [openId, setOpenId] = useState<string | null>(listings.length === 1 ? listings[0].id : null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const out = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => buildBrochure(design, { items, agent, draft: true }), [design, items, agent]);
  const final = useMemo(() => buildBrochure(design, { items, agent }), [design, items, agent]);

  const update = (i: number, next: Item) => setItems(items.map((x, k) => (k === i ? next : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setItems(next);
  };

  async function download() {
    const root = out.current;
    if (!root) return;
    setBusy("Preparing…");
    setError(null);
    setDone(null);
    try {
      await picturesReady(root);
      const nodes = Array.from(root.children) as HTMLElement[];
      const canvases = await drawFrames(
        nodes.map((node, i) => ({ node: node.firstElementChild as HTMLElement, w: PAGE.w, h: PAGE.h, name: final.pages[i].name })),
        2,
        (i, n) => setBusy(`Drawing page ${i} of ${n}…`),
      );
      setBusy("Saving PDF…");
      const blob = await pdfOf(canvases, 810, 1012.5);
      const name = items.length === 1 ? `${items[0].l.ref} ${headline(items[0].l)}` : `${items.length} properties ${items.map((x) => x.l.ref).join(" ")}`;
      downloadBlob(blob, `${slug(name)}-brochure-${design}.pdf`);
      logGeneratedPost({ tool: "secondary-brochure", templateId: `secondary-brochure-${design}`, subject: items.map((x) => x.l.ref).join(", "), source: "demo", employeeId: agent.employeeId, format: "pdf", bytes: blob.size });
      setDone(`Saved · ${final.pages.length} pages · ${formatBytes(blob.size)}`);
    } catch {
      setError("The brochure couldn’t be made — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal label="Brochure" onClose={onClose} className="h-[calc(100vh-3rem)] max-w-[1240px]">
      <header className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-base font-normal">
            Brochure · {items.length === 1 ? headline(items[0].l) : `${items.length} properties`}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{items.map((x) => x.l.ref).join(" · ")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
      </header>
      <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[360px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r">
          <Section title="Design">
            <div className="grid grid-cols-2 gap-2">
              {DESIGNS.map((d) => (
                <button key={d.id} type="button" onClick={() => setDesign(d.id)} aria-pressed={design === d.id} className={cn("rounded-lg border px-3 py-2 text-left text-sm", design === d.id ? "border-primary bg-secondary" : "hover:bg-secondary/60")}>
                  {d.name}
                </button>
              ))}
            </div>
          </Section>

          <Section title={`Properties · ${items.length}`}>
            <div className="space-y-2">
              {items.map((item, i) => (
                <PropertyRow
                  key={item.l.id}
                  item={item}
                  index={i}
                  count={items.length}
                  open={openId === item.l.id}
                  onToggle={() => setOpenId(openId === item.l.id ? null : item.l.id)}
                  onChange={(next) => update(i, next)}
                  onMove={(d) => move(i, d)}
                  onRemove={() => setItems(items.filter((_, k) => k !== i))}
                />
              ))}
            </div>
          </Section>

          <Section title="Agent">
            <div className="space-y-1.5">
              <Label htmlFor="sb-agent">Name</Label>
              <Select id="sb-agent" value={agent.employeeId} onChange={(e) => setAgent({ ...agentFrom(EMPLOYEES.find((x) => x.id === e.target.value)!), zoom: agent.zoom })}>
                {EMPLOYEES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} — {e.designation}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="sb-mobile">Mobile</Label>
                <Input id="sb-mobile" value={agent.mobile} onChange={(e) => setAgent({ ...agent, mobile: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sb-brn">BRN</Label>
                <Input id="sb-brn" value={agent.brn} onChange={(e) => setAgent({ ...agent, brn: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-email">Email</Label>
              <Input id="sb-email" value={agent.email} onChange={(e) => setAgent({ ...agent, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-zoom">Headshot size</Label>
              <input id="sb-zoom" type="range" min={1} max={2} step={0.05} value={agent.zoom} onChange={(e) => setAgent({ ...agent, zoom: +e.target.value })} className="w-full accent-[#2f4960]" />
            </div>
          </Section>

          {preview.notes.length > 0 && (
            <Section title="Layout notes">
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {preview.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Section>
          )}
        </aside>

        <div className="flex min-h-0 flex-col bg-secondary/40">
          <div className="flex items-center justify-between gap-3 border-b bg-card px-5 py-3">
            <p className="text-sm text-muted-foreground">
              {preview.pages.length} pages · 4:5 · 1080 × 1350
            </p>
            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-destructive">{error}</span>}
              {done && !busy && <span className="text-xs text-muted-foreground">{done}</span>}
              <Button onClick={download} disabled={!!busy || items.length === 0}>
                {busy ? <Loader2 className="animate-spin" /> : <Download />} {busy ?? "Download PDF"}
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No properties left — close and select some.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {preview.pages.map((p, i) => (
                  <figure key={p.key} className="space-y-1.5">
                    <Scaled className="rounded-md shadow-sm">{p.node}</Scaled>
                    <figcaption className="text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} · {p.key === "closing" ? "Ask Us About" : p.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Full-size copies for the download, off-screen. */}
      <div ref={out} aria-hidden style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }}>
        {final.pages.map((p) => (
          <div key={p.key} style={{ width: PAGE.w, height: PAGE.h }}>
            {p.node}
          </div>
        ))}
      </div>
    </Modal>
  );
}
