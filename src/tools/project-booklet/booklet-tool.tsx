"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * Project Booklet editor: pick a source (Dubai Offplan or Abu Dhabi Offplan) and one of its saved
 * projects (projects/ — pages stored with this build) → every project field fills in → make a
 * PDF brochure (design A or B) or a social
 * media post (a single feed/story post, or a carousel; two designs each). Project fields are
 * locked by default (the saved project is the source of truth); "Adjust fields" unlocks all of
 * them, picking another project locks them again, and only the fields the chosen output uses are
 * shown. Social posts get the listing tools' photo controls — pick any of the project's pictures
 * or upload one, Size it and drag it in the preview — per photo frame (a carousel has one or
 * more per slide). The agent and permit QR sections are the listing tools' own and always editable.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink, LoaderCircle, Lock, LockOpen, Maximize2, Plus, RotateCcw, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EMPLOYEES } from "@/lib/demo/employees";
import { logGeneratedPost } from "@/lib/store";
import { agentFrom } from "./agent";
import { downloadBlob, drawFrames, formatBytes, jpegOf, pdfOf, picturesReady, slug, zipOf } from "./exporter";
import { buildBooklet, type BookletPage } from "./pages";
import { PROJECTS, SOURCES, type SourceId } from "./projects";
import { buildCarousel, buildSingle } from "./social";
import {
  AGENT_LIMITS,
  CAROUSEL_DESIGNS,
  DESIGNS,
  MANUAL,
  NO_ADJUST,
  OUTPUTS,
  POST_FORMATS,
  SINGLE_DESIGNS,
  SLOTS_BY_VIEW,
  SLOT_LABELS,
  SOCIAL_KINDS,
  defaultSlots,
  type Adjust,
  type Adjusts,
  type Agent,
  type Design,
  type FrameInfo,
  type ImageSlots,
  type Output,
  type PostFormat,
  type ProjectData,
  type SlotKey,
  type SlotSet,
  type SocialDesign,
  type SocialKind,
} from "./types";
import { Counter, PhotoDropzone, SizeRow } from "./uploads";

const slotsFor = (d: ProjectData): Record<SlotSet, ImageSlots> => ({ a: defaultSlots(d, "a"), b: defaultSlots(d, "b"), single: defaultSlots(d, "single"), carousel: defaultSlots(d, "carousel") });
const noAdjusts = (): Record<SocialKind, Adjusts> => ({ single: {}, carousel: {} });

/** The project fields each output uses. The others are hidden while it is the one being made. */
type SectionId = "cover" | "overview" | "highlights" | "details" | "pictures" | "amenities" | "payment" | "location" | "investment" | "financing" | "developer" | "more";
const SECTIONS: Record<"brochure" | PostFormat | "carousel", SectionId[]> = {
  brochure: ["cover", "overview", "highlights", "details", "pictures", "amenities", "payment", "location", "investment", "financing", "developer", "more"],
  feed: ["cover", "details"],
  story: ["cover", "details", "amenities"],
  carousel: ["cover", "overview", "details", "amenities", "payment", "location", "investment", "developer"],
};

/** "2026-09-25" → "25 Sep 2026" (UTC, so the server and the browser print the same day). */
/** The permit QR's wording per source: Dubai's is the DLD permit; Abu Dhabi's is kept generic. */
const PERMIT: Record<SourceId, { label: string; hint: string; missing: string }> = {
  dubai: { label: "DLD QR code", hint: "The QR from the project’s Dubai Land Department permit — required on every brochure and post.", missing: "Upload your DLD permit QR — every brochure and post needs it." },
  "abu-dhabi": { label: "Permit QR code", hint: "The QR from the project’s advertising permit — required on every brochure and post.", missing: "Upload the project’s permit QR — every brochure and post needs it." },
};

const savedDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/* ── small pieces ────────────────────────────────────────────────────────── */

/** Shows a fixed-size page (1080 × 1350 or 1080 × 1920) scaled to the box width. */
function Scaled({ w, h, children, className }: { w: number; h: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        {children}
      </div>
    </div>
  );
}

/** Pill radio group — the listing tools' design / format pickers. */
function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn("h-8 rounded-full border px-3 text-sm transition-colors", o.id === value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Switch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50", checked ? "border-primary bg-primary" : "border-input bg-muted")}
    >
      <span className={cn("inline-block size-3.5 rounded-full transition-transform", checked ? "translate-x-[18px] bg-primary-foreground" : "translate-x-[3px] bg-muted-foreground/60")} />
    </button>
  );
}

function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-normal">{title}</span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{meta}</span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="space-y-4 border-t px-4 py-4">{children}</div>
    </details>
  );
}

function Field({ label, id, children, hint }: { label: string; id?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type Pic = { src: string; label: string; mine?: boolean };

/** The listing tools' photo strip: every picture of the project (and any uploaded), one tap to use it. */
function PhotoStrip({ pics, value, onPick }: { pics: Pic[]; value: string; onPick: (src: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  // Keep the chosen picture in view — sideways only, so it never scrolls the page.
  useEffect(() => {
    const c = box.current;
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!c || !el) return;
    if (el.offsetLeft < c.scrollLeft || el.offsetLeft + el.offsetWidth > c.scrollLeft + c.clientWidth) {
      c.scrollTo({ left: el.offsetLeft - (c.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [value, pics.length]);
  return (
    <div ref={box} className="relative -mx-1 flex gap-2 overflow-x-auto p-1 pb-2">
      {pics.map((p, i) => (
        <button
          key={`${i}:${p.src}`}
          type="button"
          title={p.label}
          aria-label={p.label}
          aria-pressed={p.src === value}
          onClick={() => onPick(p.src)}
          className={cn("relative aspect-[7/5] w-28 shrink-0 overflow-hidden rounded-lg border bg-muted transition-shadow", p.src === value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:border-navy-2/60")}
        >
          <img src={p.src} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
          {p.mine && <span className="absolute bottom-1 left-1 rounded bg-navy/80 px-1.5 py-0.5 text-[10px] leading-none text-paper">Yours</span>}
        </button>
      ))}
    </div>
  );
}

/** Editable list of plain strings. */
function TextList({ items, onChange, multiline, noun }: { items: string[]; onChange: (v: string[]) => void; multiline?: boolean; noun: string }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <Textarea value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="min-h-24" />
          ) : (
            <Input value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          )}
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground" aria-label={`Remove ${noun}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus /> Add {noun}
      </Button>
    </div>
  );
}

type Col<T> = { key: keyof T & string; label: string; span?: 1 | 2; multiline?: boolean };

/** Editable list of small records (highlights, details, milestones…). */
function RowList<T extends Record<string, string>>({ items, cols, blank, onChange, noun }: { items: T[]; cols: Col<T>[]; blank: T; onChange: (v: T[]) => void; noun: string }) {
  const set = (i: number, key: keyof T, v: string) => onChange(items.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {noun} {i + 1}
            </span>
            <Button type="button" variant="ghost" size="icon" className="-mr-1 size-7 text-muted-foreground" aria-label={`Remove ${noun} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cols.map((col) => (
              <div key={col.key} className={cn("space-y-1", col.span !== 1 && "col-span-2")}>
                <span className="text-[11px] text-muted-foreground">{col.label}</span>
                {col.multiline ? (
                  <Textarea value={item[col.key]} onChange={(e) => set(i, col.key, e.target.value)} className="min-h-16" />
                ) : (
                  <Input value={item[col.key]} onChange={(e) => set(i, col.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank])}>
        <Plus /> Add {noun.toLowerCase()}
      </Button>
    </div>
  );
}

/* ── the tool ────────────────────────────────────────────────────────────── */

export function BookletTool() {
  const [output, setOutput] = useState<Output>("brochure");
  const [design, setDesign] = useState<Design>("a");
  const [kind, setKind] = useState<SocialKind>("single");
  const [format, setFormat] = useState<PostFormat>("feed");
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const saved = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const source = SOURCES.find((x) => x.id === saved.source) ?? SOURCES[0];
  const loaded = saved.data;
  const [data, setData] = useState<ProjectData>(loaded);
  const [slots, setSlots] = useState<Record<SlotSet, ImageSlots>>(() => slotsFor(loaded));
  const [agent, setAgent] = useState<Agent>(() => agentFrom(EMPLOYEES[0]));
  const [qr, setQr] = useState<string | null>(null);
  const [singleDesign, setSingleDesign] = useState<SocialDesign>("a");
  const [carouselDesign, setCarouselDesign] = useState<SocialDesign>("a");
  const [adjust, setAdjust] = useState<Record<SocialKind, Adjusts>>(noAdjusts);
  const [uploads, setUploads] = useState<Pic[]>([]);
  const [activeFrame, setActiveFrame] = useState<SlotKey | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [page, setPage] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const set = <K extends keyof ProjectData>(key: K, value: ProjectData[K]) => setData((d) => ({ ...d, [key]: value }));
  const social = output === "social";
  const slotSet: SlotSet = social ? kind : design;
  const socialDesign = kind === "carousel" ? carouselDesign : singleDesign;
  const view = social ? (kind === "carousel" ? "carousel" : format) : "brochure";
  const show = (id: SectionId) => SECTIONS[view].includes(id);

  const pickProject = (id: string) => {
    const p = PROJECTS.find((x) => x.id === id);
    if (!p) return;
    setProjectId(p.id);
    setData(p.data);
    setSlots(slotsFor(p.data));
    setAdjust(noAdjusts());
    setActiveFrame(null);
    setUnlocked(false);
    setPage(0);
  };
  /** Another source opens on its first project. */
  const pickSource = (id: SourceId) => {
    if (id !== saved.source) pickProject(PROJECTS.find((p) => p.source === id)?.id ?? "");
  };

  const built = useMemo(() => {
    if (output === "brochure") return buildBooklet(design, { d: data, agent, qr, slots: slots[design] });
    const input = { d: data, agent, qr, slots: slots[kind], adjust: adjust[kind], design: socialDesign };
    return kind === "carousel" ? buildCarousel(input) : buildSingle(format, input);
  }, [output, design, kind, format, data, agent, qr, slots, adjust, socialDesign]);
  const pages = built.pages;
  const count = pages.length;
  const current = Math.min(page, count - 1);
  const go = (i: number) => setPage((i + count) % count);

  // ← → turn pages (not while typing); Esc closes the enlarged view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") setPage((current + 1) % count);
      else if (e.key === "ArrowLeft") setPage((current - 1 + count) % count);
      else if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, count]);

  // Collect "text set smaller / cut off" flags from the rendered pages for the notes list.
  const preview = useRef<HTMLDivElement>(null);
  const [fitNotes, setFitNotes] = useState<string[]>([]);
  useEffect(() => {
    const root = preview.current;
    if (!root) return;
    const scan = () => {
      const out = new Set<string>();
      root.querySelectorAll<HTMLElement>("[data-page-name]").forEach((p) => {
        p.querySelectorAll<HTMLElement>("[data-fit-label]").forEach((f) => {
          if (f.dataset.overflow === "1") out.add(`${p.dataset.pageName}: ${f.dataset.fitLabel} is too long and gets cut off.`);
          else if (Number(f.dataset.k ?? 1) < 0.9) out.add(`${p.dataset.pageName}: ${f.dataset.fitLabel} is set smaller to fit.`);
        });
      });
      const list = [...out];
      setFitNotes((prev) => (prev.join("|") === list.join("|") ? prev : list));
    };
    const t = setTimeout(scan, 60);
    document.fonts?.ready.then(scan);
    return () => clearTimeout(t);
  });

  /* ── agent + QR (object URLs are released when replaced) ──────────────── */

  const urls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const held = urls.current;
    return () => held.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const objectUrl = (file: File, previous: string | null) => {
    if (previous && urls.current.has(previous)) {
      URL.revokeObjectURL(previous);
      urls.current.delete(previous);
    }
    const u = URL.createObjectURL(file);
    urls.current.add(u);
    return u;
  };
  function selectAgent(id: string) {
    const e = EMPLOYEES.find((x) => x.id === id);
    // "Type manually…" keeps what is there; picking someone prefills their details (all editable).
    if (!e) return setAgent((a) => ({ ...a, employeeId: id }));
    setAgent(agentFrom(e));
  }

  /* ── download ─────────────────────────────────────────────────────────── */

  const problems: string[] = [];
  if (!data.name.trim()) problems.push("Add the project name.");
  if (!agent.name.trim()) problems.push("Add the agent name.");
  if (!agent.photo) problems.push("Add the agent headshot.");
  if (!qr) problems.push(PERMIT[saved.source].missing);

  const [job, setJob] = useState<{ pages: BookletPage[]; key: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportRoot = useRef<HTMLDivElement>(null);
  const stateKey = JSON.stringify([output, design, kind, format, socialDesign, data, agent, !!qr, slots[slotSet], social ? adjust[kind] : null]);
  const shownResult = result?.key === stateKey ? result.text : null;
  const downloadLabel = output === "brochure" ? "Download PDF brochure" : kind === "carousel" ? "Download carousel" : format === "story" ? "Download story" : "Download feed post";
  const canDownload = problems.length === 0 && !job;

  // The export renders its own full-size copy of the pages (off screen), draws them, then leaves.
  useEffect(() => {
    if (!job) return;
    let alive = true;
    (async () => {
      try {
        const root = exportRoot.current;
        if (!root) throw new Error("The pages weren’t ready. Try again.");
        await picturesReady(root);
        await new Promise((r) => setTimeout(r, 150));
        const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-export]"));
        const frames = nodes.map((node, i) => ({ node, w: job.pages[i].w, h: job.pages[i].h, name: job.pages[i].name }));
        const canvases = await drawFrames(frames, output === "brochure" ? 2 : 1, (i, n) => alive && setProgress(n > 1 ? `Drawing page ${i} of ${n}…` : "Drawing the post…"));
        const base = slug([data.name, data.developer && `by ${data.developer}`].filter(Boolean).join(" ")) || "Project";
        let text: string;
        let logged: { templateId: string; format: string; bytes: number };
        if (output === "brochure") {
          setProgress("Making the PDF…");
          const pdf = await pdfOf(canvases, 810, 1012.5);
          downloadBlob(pdf, `${base}-Brochure-${design.toUpperCase()}.pdf`);
          text = `Saved as PDF · ${canvases.length} pages · ${formatBytes(pdf.size)}`;
          logged = { templateId: `project-booklet-brochure-${design}`, format: "pdf", bytes: pdf.size };
        } else if (kind === "carousel") {
          setProgress("Packing the slides…");
          const files = await Promise.all(canvases.map(async (cv, i) => ({ name: `${String(i + 1).padStart(2, "0")}-${slug(frames[i].name)}.jpg`, blob: await jpegOf(cv) })));
          const zip = await zipOf(files);
          downloadBlob(zip, `${base}-Carousel-${socialDesign.toUpperCase()}.zip`);
          text = `Saved as ZIP · ${files.length} slides, 1080 × 1350 JPG · ${formatBytes(zip.size)}`;
          logged = { templateId: `project-booklet-carousel-${socialDesign}`, format: "zip", bytes: zip.size };
        } else {
          const jpg = await jpegOf(canvases[0]);
          downloadBlob(jpg, `${base}-${format === "story" ? "Story" : "Feed-Post"}-${socialDesign.toUpperCase()}.jpg`);
          text = `Saved as JPG · ${canvases[0].width} × ${canvases[0].height} · ${formatBytes(jpg.size)}`;
          logged = { templateId: `project-booklet-${format}-${socialDesign}`, format: "jpg", bytes: jpg.size };
        }
        const manual = agent.employeeId === MANUAL;
        logGeneratedPost({ tool: "project-booklet", subject: data.name.trim(), source: manual ? "manual" : "demo", employeeId: manual ? undefined : agent.employeeId, ...logged });
        if (alive) setResult({ key: job.key, text });
      } catch (e) {
        if (alive) setError((e as Error).message || "The download couldn’t be made. Try again.");
      } finally {
        if (alive) {
          setJob(null);
          setProgress(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // `job` starts it; the rest is read as it was when the button was pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const edited = unlocked && JSON.stringify(data) !== JSON.stringify(loaded);
  const imageOptions = [
    { label: "Hero banner", src: data.heroImage },
    ...data.gallery.map((src, i) => ({ label: `Gallery ${i + 1}`, src })),
    { label: "Developer photo", src: data.developerImage },
    { label: "Area photo", src: data.areaImage },
    { label: "Listing thumbnail", src: data.thumbnail },
  ].filter((o) => o.src);
  const notes = [...built.notes, ...fitNotes];
  const page0 = pages[current];

  function setSlot(key: SlotKey, value: string) {
    setSlots((all) => {
      const next = { ...all, [slotSet]: { ...all[slotSet], [key]: value } };
      // The brochure's first page uses one picture in both designs.
      if (output === "brochure" && key === "cover") {
        next.a = { ...next.a, cover: value };
        next.b = { ...next.b, cover: value };
      }
      return next;
    });
  }

  /* ── social photos: the page's frames, the picture in each, its zoom and position ──── */

  const frames: FrameInfo[] = social ? (page0?.frames ?? []) : [];
  const frame = frames.find((f) => f.key === activeFrame) ?? frames[0];
  const adj = (frame && adjust[kind][frame.key]) || NO_ADJUST;
  const setAdj = (key: SlotKey, a: Adjust) => setAdjust((all) => ({ ...all, [kind]: { ...all[kind], [key]: a } }));
  const pics: Pic[] = [...uploads, ...imageOptions];
  const photoSlides = pages.map((p, i) => ({ i, name: p.name, n: p.frames?.length ?? 0 })).filter((p) => p.n > 0);
  const pickPhoto = (key: SlotKey, src: string) => {
    setSlot(key, src);
    setAdj(key, NO_ADJUST);
  };
  const uploadPhoto = (f: File) => {
    if (!frame) return;
    const src = objectUrl(f, null);
    setUploads((u) => [{ src, label: f.name || "Your photo", mine: true }, ...u]);
    pickPhoto(frame.key, src);
  };

  // Drag in the preview moves the photo inside the frame under the pointer (the listing tools'
  // behaviour). The move is measured from where the drag started, in page pixels, against how
  // far the photo overhangs its frame at the current zoom — so it tracks the pointer exactly.
  const drag = useRef<{ key: SlotKey; x0: number; y0: number; base: Adjust; ox: number; oy: number; k: number } | null>(null);
  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-frame]"));
    const inside = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const el = els.find(inside) ?? (els.length === 1 ? els[0] : undefined);
    if (!el) return;
    const key = el.dataset.frame as SlotKey;
    const img = el.querySelector("img");
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const iw = img?.naturalWidth || w;
    const ih = img?.naturalHeight || h;
    const base = adjust[kind][key] ?? NO_ADJUST;
    const cover = Math.max(w / iw, h / ih) * base.zoom;
    drag.current = { key, x0: e.clientX, y0: e.clientY, base, ox: iw * cover - w, oy: ih * cover - h, k: w / (el.getBoundingClientRect().width || w) };
    setActiveFrame(key);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const dx = (e.clientX - g.x0) * g.k;
    const dy = (e.clientY - g.y0) * g.k;
    setAdj(g.key, { ...g.base, x: g.ox > 0.5 ? clamp(g.base.x - dx / g.ox) : g.base.x, y: g.oy > 0.5 ? clamp(g.base.y - dy / g.oy) : g.base.y });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      {/* ── Form ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Pills label="Make" value={output} options={OUTPUTS} onChange={(v) => { setOutput(v); setPage(0); }} />
        {output === "brochure" ? (
          <Pills label="Design" value={design} options={DESIGNS} onChange={setDesign} />
        ) : (
          <div className="space-y-6">
            <Pills label="Post" value={kind} options={SOCIAL_KINDS} onChange={(v) => { setKind(v); setPage(0); setActiveFrame(null); }} />
            {kind === "single" ? (
              <>
                <Pills label="Design" value={singleDesign} options={SINGLE_DESIGNS} onChange={setSingleDesign} />
                <Pills label="Format" value={format} options={POST_FORMATS} onChange={setFormat} />
              </>
            ) : (
              <div className="space-y-2">
                <Pills label="Design" value={carouselDesign} options={CAROUSEL_DESIGNS} onChange={setCarouselDesign} />
                <p className="text-xs text-muted-foreground">Carousel slides are 4:5 (1080 × 1350).</p>
              </div>
            )}
          </div>
        )}

        <Pills label="Source" value={saved.source} options={SOURCES} onChange={pickSource} />

        <div className="space-y-2">
          <Label htmlFor="project">Project</Label>
          <Select id="project" value={projectId} onChange={(e) => pickProject(e.target.value)}>
            {PROJECTS.filter((p) => p.source === saved.source).map((p) => (
              <option key={p.id} value={p.id}>
                {p.data.name} · {p.data.developer}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Saved from {source.site} on {savedDate(saved.savedOn)} — the text and all {Object.keys(saved.sources).length} pictures are stored with this build.{" "}
            <a href={loaded.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-foreground underline-offset-4 hover:underline">
              Project page <ExternalLink className="size-3" />
            </a>
          </p>
        </div>

        {/* Photo — social posts: pick from the project's pictures or upload one, then size and drag it */}
        {social && (
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <Label>Photo</Label>
              {kind === "carousel" && page0 && (
                <span className="truncate text-xs text-muted-foreground">
                  Slide {current + 1} of {pages.length} · {page0.name}
                </span>
              )}
            </div>
            {!frame ? (
              <p className="text-xs text-muted-foreground">
                This slide has no photo. Slides with one:{" "}
                {photoSlides.map((p, j) => (
                  <span key={p.i}>
                    {j > 0 && " · "}
                    <button type="button" className="text-foreground underline-offset-4 hover:underline" onClick={() => setPage(p.i)}>
                      {p.name}
                    </button>
                  </span>
                ))}
              </p>
            ) : (
              <>
                {frames.length > 1 && (
                  <div role="radiogroup" aria-label="Picture" className="flex flex-wrap gap-1.5">
                    {frames.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        role="radio"
                        aria-checked={f.key === frame.key}
                        onClick={() => setActiveFrame(f.key)}
                        className={cn("h-7 rounded-full border px-2.5 text-xs transition-colors", f.key === frame.key ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground")}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imageOptions.length} photos in this project{uploads.length > 0 && ` + ${uploads.length} of yours`} — pick the one for {kind === "single" ? "the post" : frames.length > 1 ? frame.label.toLowerCase() : "this slide"}.
                </p>
                <PhotoStrip pics={pics} value={slots[kind][frame.key]} onPick={(src) => pickPhoto(frame.key, src)} />
                <PhotoDropzone compact label={uploads.some((u) => u.src === slots[kind][frame.key]) ? "Replace photo" : "Upload your own photo"} onFile={uploadPhoto} />
                <p className="text-xs text-muted-foreground">
                  {kind === "single" ? "Fills the whole post" : "Fills this photo’s frame"}. Landscape or portrait both work — it’s cropped to fit. Drag it in the preview to move it.
                </p>
                <SizeRow id="photo-size" zoom={adj.zoom} onZoom={(z) => setAdj(frame.key, { ...adj, zoom: z })} onReset={() => setAdj(frame.key, NO_ADJUST)} />
              </>
            )}
          </div>
        )}

        {/* Project fields — locked until Adjust fields is on */}
        <div className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {unlocked ? <LockOpen className="size-4 text-muted-foreground" /> : <Lock className="size-4 text-muted-foreground" />}
              <p className="text-sm">Project fields</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="adjust" className="text-xs text-muted-foreground">
                Adjust fields
              </Label>
              <Switch id="adjust" checked={unlocked} onChange={setUnlocked} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {unlocked ? "Everything below is editable. Picking another project replaces your edits." : "Filled in from the saved project and locked. Turn on Adjust fields to edit anything."}
            {social && ` Only what the ${kind === "carousel" ? "carousel" : format === "story" ? "story" : "feed post"} uses is shown.`}
          </p>
          {edited && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs"
              onClick={() => {
                setData(loaded);
                // The brochure's pictures are project fields; the social photos are chosen outside them, so they stay.
                const fresh = slotsFor(loaded);
                setSlots((all) => ({ ...all, a: fresh.a, b: fresh.b }));
              }}
            >
              <RotateCcw className="size-3" /> Undo my edits
            </Button>
          )}

          <fieldset disabled={!unlocked} className="min-w-0 space-y-2">
            {show("cover") && (
            <Section title={social && kind === "single" ? "Name & key figures" : "Cover"} meta={data.name}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Project name" id="f-name">
                  <Input id="f-name" value={data.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Developer" id="f-dev">
                  <Input id="f-dev" value={data.developer} onChange={(e) => set("developer", e.target.value)} />
                </Field>
              </div>
              <Field label="Location" id="f-loc" hint={`Shown as “Location · ${data.city}”.`}>
                <Input id="f-loc" value={data.location} onChange={(e) => set("location", e.target.value)} />
              </Field>
              <RowList noun="Key figure" items={data.heroStats} blank={{ label: "", value: "" }} onChange={(v) => set("heroStats", v)} cols={[{ key: "label", label: "Label", span: 1 }, { key: "value", label: "Value", span: 1 }]} />
            </Section>
            )}

            {show("overview") && (
            <Section title="Project overview" meta={`${data.overview.length} paragraphs`}>
              <TextList noun="paragraph" multiline items={data.overview} onChange={(v) => set("overview", v)} />
              <p className="text-xs text-muted-foreground">Wrap words in **double stars** to make them stand out.</p>
            </Section>
            )}

            {show("highlights") && (
            <Section title="Project highlights" meta={String(data.highlights.length)}>
              <RowList noun="Highlight" items={data.highlights} blank={{ title: "", text: "" }} onChange={(v) => set("highlights", v)} cols={[{ key: "title", label: "Title" }, { key: "text", label: "Text", multiline: true }]} />
            </Section>
            )}

            {show("details") && (
            <Section title="Project details" meta={String(data.details.length)}>
              <RowList noun="Detail" items={data.details} blank={{ label: "", value: "" }} onChange={(v) => set("details", v)} cols={[{ key: "label", label: "Label", span: 1 }, { key: "value", label: "Value", span: 1 }]} />
            </Section>
            )}

            {show("pictures") && (
            <Section title="Pictures" meta={`${data.gallery.length} in gallery`}>
              <p className="text-xs text-muted-foreground">Which picture goes where in the brochure, design {design.toUpperCase()}. The cover is shared by both designs.</p>
              <div className="space-y-2">
                {SLOTS_BY_VIEW[design].map((key) => {
                  const value = slots[design][key];
                  const known = imageOptions.some((o) => o.src === value);
                  const label = SLOT_LABELS[key];
                  return (
                    <div key={key} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
                      <span className="block aspect-[16/10] overflow-hidden rounded-md border bg-muted">{value && <img src={value} alt="" className="size-full object-cover" />}</span>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">{label}</span>
                        <Select value={value} onChange={(e) => setSlot(key, e.target.value)}>
                          {!known && <option value={value}>Custom picture</option>}
                          {imageOptions.map((o) => (
                            <option key={o.label} value={o.src}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
              <TextList noun="gallery picture" items={data.gallery} onChange={(v) => set("gallery", v)} />
            </Section>
            )}

            {show("amenities") && (
            <Section title="Amenities" meta={String(data.amenities.length)}>
              <Field label="Intro" id="f-am">
                <Textarea id="f-am" value={data.amenitiesIntro} onChange={(e) => set("amenitiesIntro", e.target.value)} />
              </Field>
              <TextList noun="amenity" items={data.amenities} onChange={(v) => set("amenities", v)} />
              <p className="text-xs text-muted-foreground">Icons are picked from the name (pool, gym, BBQ, kids…).</p>
            </Section>
            )}

            {show("payment") && (
            <Section title="Payment plan" meta={data.payment.map((m) => m.share).join(" / ")}>
              <RowList noun="Step" items={data.payment} blank={{ label: "", share: "", amount: "" }} onChange={(v) => set("payment", v)} cols={[{ key: "label", label: "Stage" }, { key: "share", label: "Share (e.g. 70%)", span: 1 }, { key: "amount", label: "Amount", span: 1 }]} />
              <Field label="Note" id="f-pn">
                <Textarea id="f-pn" value={data.paymentNote} onChange={(e) => set("paymentNote", e.target.value)} />
              </Field>
            </Section>
            )}

            {show("location") && (
            <Section title="Location" meta={`${data.distances.length} distances`}>
              <TextList noun="paragraph" multiline items={data.locationText} onChange={(v) => set("locationText", v)} />
              <RowList noun="Distance" items={data.distances} blank={{ time: "", place: "" }} onChange={(v) => set("distances", v)} cols={[{ key: "time", label: "Minutes", span: 1 }, { key: "place", label: "Place", span: 1 }]} />
            </Section>
            )}

            {show("investment") && (
            <Section title="Investment" meta={String(data.investmentStats.length)}>
              <Field label="Intro" id="f-inv">
                <Textarea id="f-inv" value={data.investmentIntro} onChange={(e) => set("investmentIntro", e.target.value)} />
              </Field>
              <RowList noun="Figure" items={data.investmentStats} blank={{ value: "", label: "" }} onChange={(v) => set("investmentStats", v)} cols={[{ key: "value", label: "Figure", span: 1 }, { key: "label", label: "Label", span: 1 }]} />
              <Field label="List title" id="f-mt">
                <Input id="f-mt" value={data.marketTitle} onChange={(e) => set("marketTitle", e.target.value)} />
              </Field>
              <TextList noun="point" items={data.marketContext} onChange={(v) => set("marketContext", v)} />
            </Section>
            )}

            {show("financing") && (
            <Section title="Financing" meta={String(data.financing.length)}>
              <TextList noun="option" items={data.financing} onChange={(v) => set("financing", v)} />
            </Section>
            )}

            {show("developer") && (
            <Section title="Developer" meta={data.developerText ? data.developer : "Not on this page"}>
              <Field label="About the developer" id="f-dt">
                <Textarea id="f-dt" value={data.developerText} onChange={(e) => set("developerText", e.target.value)} className="min-h-28" />
              </Field>
              <Field label="Logo link" id="f-dl">
                <Input id="f-dl" value={data.developerLogo} onChange={(e) => set("developerLogo", e.target.value)} />
              </Field>
              <Field label="Photo link" id="f-di">
                <Input id="f-di" value={data.developerImage} onChange={(e) => set("developerImage", e.target.value)} />
              </Field>
            </Section>
            )}

            {show("more") && (
            <Section title="More from the page" meta="Not in the layouts yet">
              <p className="text-xs text-muted-foreground">Also on the project page and saved with it — unit types, the area card and the FAQ. No layout uses them yet.</p>
              <RowList noun="Unit type" items={data.unitTypes} blank={{ name: "", area: "", price: "" }} onChange={(v) => set("unitTypes", v)} cols={[{ key: "name", label: "Type" }, { key: "area", label: "Size", span: 1 }, { key: "price", label: "Starting price", span: 1 }]} />
              <Field label="Area title" id="f-at">
                <Input id="f-at" value={data.areaTitle} onChange={(e) => set("areaTitle", e.target.value)} placeholder="Not on this page" />
              </Field>
              <Field label="About the area" id="f-ax">
                <Textarea id="f-ax" value={data.areaText} onChange={(e) => set("areaText", e.target.value)} />
              </Field>
              <Field label="Area photo link" id="f-ai">
                <Input id="f-ai" value={data.areaImage} onChange={(e) => set("areaImage", e.target.value)} />
              </Field>
              <RowList noun="FAQ" items={data.faqs} blank={{ question: "", answer: "" }} onChange={(v) => set("faqs", v)} cols={[{ key: "question", label: "Question" }, { key: "answer", label: "Answer", multiline: true }]} />
            </Section>
            )}
          </fieldset>
        </div>

        {/* Agent — the listing tools' section, plus the contact lines the booklet shows */}
        <div className="space-y-3 border-t pt-5">
          <div className="space-y-2">
            <Label htmlFor="agent">Agent</Label>
            <Select id="agent" value={agent.employeeId} onChange={(e) => selectAgent(e.target.value)}>
              {EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
              <option value={MANUAL}>Type manually…</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentName">Name</Label>
                <Counter value={agent.name} max={AGENT_LIMITS.name} />
              </div>
              <Input id="agentName" value={agent.name} onChange={(e) => setAgent({ ...agent, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentTitle">Designation</Label>
                <Counter value={agent.position} max={AGENT_LIMITS.position} />
              </div>
              <Input id="agentTitle" value={agent.position} onChange={(e) => setAgent({ ...agent, position: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentMobile">Mobile</Label>
              <Input id="agentMobile" value={agent.mobile} onChange={(e) => setAgent({ ...agent, mobile: e.target.value })} inputMode="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentBrn">BRN</Label>
              <Input id="agentBrn" value={agent.brn} onChange={(e) => setAgent({ ...agent, brn: e.target.value })} inputMode="numeric" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentEmail">Email</Label>
            <Input id="agentEmail" value={agent.email} onChange={(e) => setAgent({ ...agent, email: e.target.value })} inputMode="email" />
          </div>
          <div className="space-y-2">
            <PhotoDropzone compact label={agent.photo ? "Replace headshot" : "Add headshot"} onFile={(f) => setAgent((a) => ({ ...a, photo: objectUrl(f, a.photo), zoom: 1 }))} />
            {agent.photo && <SizeRow id="headshot-size" zoom={agent.zoom} onZoom={(z) => setAgent((a) => ({ ...a, zoom: z }))} onReset={() => setAgent((a) => ({ ...a, zoom: 1 }))} />}
          </div>
          <p className="text-xs text-muted-foreground">Demo agents. Mobile, email and BRN are placeholders until the CRM provides them.</p>
        </div>

        {/* Permit QR (Dubai: DLD) — the listing tools' section */}
        <div className="space-y-2 border-t pt-5">
          <Label>{PERMIT[saved.source].label}</Label>
          <PhotoDropzone compact label={qr ? "Replace QR image" : "Upload your permit QR image"} onFile={(f) => setQr((q) => objectUrl(f, q))} />
          <p className="text-xs text-muted-foreground">{PERMIT[saved.source].hint}</p>
        </div>

        {/* Download */}
        <div className="space-y-3 border-t pt-5">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={() => { setError(null); setJob({ pages, key: stateKey }); }} disabled={!canDownload}>
            {job ? <LoaderCircle className="animate-spin" /> : <Download />} {job ? progress ?? "Preparing…" : downloadLabel}
          </Button>
          {shownResult && <p className="text-xs text-muted-foreground">{shownResult}</p>}
        </div>
      </div>

      {/* ── Preview ──────────────────────────────────────────── */}
      <div ref={preview} className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            {page0?.name}
            <span className="text-muted-foreground">
              {" "}
              · {pages.length > 1 ? `Page ${current + 1} of ${pages.length}` : `${page0?.w} × ${page0?.h}`}
            </span>
          </p>
          <div className="flex gap-1.5">
            {pages.length > 1 && (
              <>
                <Button type="button" variant="outline" size="icon" aria-label="Previous page" onClick={() => go(current - 1)}>
                  <ChevronLeft />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Next page" onClick={() => go(current + 1)}>
                  <ChevronRight />
                </Button>
              </>
            )}
            <Button type="button" variant="outline" size="icon" aria-label="Enlarge" onClick={() => setZoomed(true)}>
              <Maximize2 />
            </Button>
          </div>
        </div>

        {page0 &&
          (social ? (
            <div
              data-page-name={page0.name}
              className={cn("mx-auto block w-full touch-none select-none overflow-hidden rounded-xl border bg-navy", frames.length > 0 && "cursor-grab active:cursor-grabbing")}
              style={{ maxWidth: `calc(72vh * ${page0.w / page0.h})` }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <Scaled w={page0.w} h={page0.h}>
                {page0.node}
              </Scaled>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              data-page-name={page0.name}
              className="mx-auto block w-full cursor-zoom-in overflow-hidden rounded-xl border bg-navy"
              style={{ maxWidth: `calc(72vh * ${page0.w / page0.h})` }}
              aria-label="Enlarge page"
            >
              <Scaled w={page0.w} h={page0.h}>
                {page0.node}
              </Scaled>
            </button>
          ))}
        {social && frames.length > 0 && (
          <p className="-mt-2 text-center text-xs text-muted-foreground">Drag the photo to move it{frames.length > 1 ? " — each picture moves on its own" : ""}.</p>
        )}

        {pages.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {pages.map((p, i) => (
              <button
                key={p.key}
                type="button"
                data-page-name={p.name}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}: ${p.name}`}
                className={cn("overflow-hidden rounded-md border transition-colors", i === current ? "ring-2 ring-ring ring-offset-1" : "hover:border-navy-2/60")}
              >
                <Scaled w={p.w} h={p.h}>
                  {p.node}
                </Scaled>
              </button>
            ))}
          </div>
        )}

        {notes.length > 0 && (
          <div className="space-y-1.5 rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs">
              <TriangleAlert className="size-3.5 text-warning" /> Layout notes for this project
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {zoomed && page0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 p-4" onClick={() => setZoomed(false)} role="presentation">
          <div className="relative" style={{ width: `min(94vw, calc(88vh * ${page0.w / page0.h}))` }} onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-xl">
              <Scaled w={page0.w} h={page0.h}>
                {page0.node}
              </Scaled>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-paper/70">
              <span>
                {page0.name} · {current + 1} / {pages.length}
              </span>
              <span className="flex gap-1.5">
                {pages.length > 1 && (
                  <>
                    <Button type="button" variant="ghost" size="icon" className="text-paper hover:bg-white/10 hover:text-paper" aria-label="Previous page" onClick={() => go(current - 1)}>
                      <ChevronLeft />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="text-paper hover:bg-white/10 hover:text-paper" aria-label="Next page" onClick={() => go(current + 1)}>
                      <ChevronRight />
                    </Button>
                  </>
                )}
                <Button type="button" variant="ghost" size="icon" className="text-paper hover:bg-white/10 hover:text-paper" aria-label="Close" onClick={() => setZoomed(false)}>
                  <X />
                </Button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Full-size copy of the pages, drawn for the download and then removed */}
      {job && (
        <div ref={exportRoot} aria-hidden className="pointer-events-none fixed left-[-20000px] top-0">
          {job.pages.map((p) => (
            <div key={p.key} data-export style={{ width: p.w, height: p.h }}>
              {p.node}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
