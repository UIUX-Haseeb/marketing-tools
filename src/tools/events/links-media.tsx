"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * Links & media tab. The three image uploads (cover / banner / thumbnail) are replaced by Prov
 * Toys-style template controls: the banner and the grid thumbnail are made from the fields
 * already typed in Details, Schedule and Location — the person only picks a design and a photo
 * (library strip or upload, Size, drag in the preview) and which optional lines to show.
 * The link fields and staff media links follow, as in the CRM.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, CircleAlert, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logGeneratedPost } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ScaledArt } from "./artwork";
import { flyerAgent, useMyCard } from "./my-card";
import { MyCardPanel } from "./my-card-panel";
import { artworkBlob, download, photoDataUrl } from "./exporter";
import { artDate, placeLine, shortDate } from "./format";
import { DEVELOPER_LOGOS, developerLogoSrc, photosFor } from "./photos";
import { ART_DESIGNS, ART_SIZES, LOGO_TYPES, NO_ADJUST, type Adjust, type ArtKind, type EventArtwork, type EventRecord } from "./types";
import { PhotoDropzone, SizeRow } from "./uploads";
import { Pill } from "./ui";

export type FormTab = "details" | "schedule" | "location" | "links" | "registration" | "contact";

function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn("h-8 rounded-lg border px-3 text-sm transition-colors", value === o.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What the artwork reads, and where to fix it. */
function Sources({ e, goTo }: { e: EventRecord; goTo: (t: FormTab) => void }) {
  const d = artDate(e);
  const items: { label: string; value: string; tab: FormTab; need?: boolean }[] = [
    { label: "Title", value: e.title, tab: "details", need: true },
    { label: "Subtitle", value: e.subtitle, tab: "details" },
    { label: "Event type", value: e.types.join(", "), tab: "details", need: true },
    { label: "Date", value: d ? [shortDate(e), d.time].filter(Boolean).join(" · ") : "", tab: "schedule", need: true },
    { label: "Location", value: placeLine(e), tab: "location" },
  ];
  return (
    <ul className="divide-y rounded-lg border text-sm">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-3 px-3 py-2">
          {i.value ? <Check className="size-3.5 shrink-0 text-success" /> : <CircleAlert className={cn("size-3.5 shrink-0", i.need ? "text-warning" : "text-muted-foreground")} />}
          <span className="w-20 shrink-0 text-muted-foreground">{i.label}</span>
          <span className={cn("min-w-0 flex-1 truncate", !i.value && "text-muted-foreground")}>{i.value || (i.need ? "Needed" : "Not set — left off")}</span>
          <button type="button" onClick={() => goTo(i.tab)} className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {i.value ? "Edit" : "Add"}
          </button>
        </li>
      ))}
    </ul>
  );
}

const LOGO_ACCEPT = ["image/svg+xml", "image/png"];

/**
 * Developer logo for launch / webinar / briefing / exhibition / open house artwork: the linked
 * developer's logo from the library, an upload (SVG or PNG — printed in white or navy to suit
 * the design), or none.
 */
function LogoPicker({ e, value, onChange, goTo }: { e: EventRecord; value: string; onChange: (v: string) => void; goTo: (t: FormTab) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const key = DEVELOPER_LOGOS[e.developer];
  const uploaded = value && value !== "none" ? value : "";
  const opt = (on: boolean) => cn("flex h-14 items-center justify-center rounded-lg border px-3 text-xs transition-colors", on ? "ring-2 ring-ring" : "hover:bg-secondary");
  const take = (f?: File | null) => {
    if (!f) return;
    if (!LOGO_ACCEPT.includes(f.type) && !/\.(svg|png)$/i.test(f.name)) return setError("Please choose an SVG or PNG logo.");
    if (f.size > 2 * 1024 * 1024) return setError("That logo is over 2 MB.");
    setError(null);
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-2">
      <Label>Developer logo</Label>
      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" onClick={() => onChange("")} className={cn(opt(value === ""), "bg-navy")} title={key ? `${e.developer} — from the developer record` : "No developer with a logo linked"}>
          {key ? <img src={developerLogoSrc(key, "white")} alt={e.developer} className="max-h-5 max-w-full" /> : <span className="text-paper/70">From developer</span>}
        </button>
        <button type="button" onClick={() => (uploaded ? onChange(uploaded) : input.current?.click())} className={cn(opt(!!uploaded), "bg-navy")}>
          {uploaded ? <img src={uploaded} alt="Your logo" className="max-h-5 max-w-full brightness-0 invert" /> : <span className="inline-flex items-center gap-1 text-paper/70"><Plus className="size-3" /> Upload</span>}
        </button>
        <button type="button" onClick={() => onChange("none")} className={opt(value === "none")}>None</button>
      </div>
      <input ref={input} type="file" accept=".svg,.png,image/svg+xml,image/png" className="sr-only" onChange={(ev) => take(ev.target.files?.[0])} />
      <p className="text-xs text-muted-foreground">
        {key ? `${e.developer}'s logo, from the developer record. ` : (
          <>
            Link a developer in{" "}
            <button type="button" onClick={() => goTo("location")} className="underline underline-offset-4 hover:text-foreground">Location</button>{" "}
            or upload one.{" "}
          </>
        )}
        Sits beside Provident&apos;s wordmark{uploaded && (
          <>
            {" "}·{" "}
            <button type="button" onClick={() => input.current?.click()} className="underline underline-offset-4 hover:text-foreground">replace upload</button>
          </>
        )}
        .
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function LinksMedia({ e, set, goTo }: { e: EventRecord; set: (p: Partial<EventRecord>) => void; goTo: (t: FormTab) => void }) {
  const art = e.artwork;
  const setArt = (p: Partial<EventArtwork>) => set({ artwork: { ...art, ...p } });
  const setAdj = (kind: ArtKind, a: Adjust) => setArt({ adjust: { ...art.adjust, [kind]: a } });
  const adj = (kind: ArtKind) => art.adjust[kind] ?? NO_ADJUST;
  const [uploads, setUploads] = useState<string[]>(() => (art.photo.startsWith("data:") ? [art.photo] : []));
  const [busy, setBusy] = useState<ArtKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nodes = useRef<Record<ArtKind, HTMLDivElement | null>>({ banner: null, thumb: null, flyer: null });
  const library = photosFor(e.project);
  const card = useMyCard();
  const agent = flyerAgent(card);

  const pick = (src: string) => setArt({ photo: src, adjust: { banner: NO_ADJUST, thumb: NO_ADJUST, flyer: NO_ADJUST } });

  // Drag in a preview moves the photo inside its frame (the listing tools' behaviour): the move
  // is measured from where the drag started, against how far the photo overhangs the frame.
  const drag = useRef<{ kind: ArtKind; x0: number; y0: number; base: Adjust; ox: number; oy: number; k: number } | null>(null);
  const startDrag = (kind: ArtKind, ev: ReactPointerEvent<HTMLDivElement>) => {
    const el = ev.currentTarget.querySelector<HTMLElement>("[data-frame]");
    // a "whole picture" photo isn't cropped, so there is nothing to drag (Size still zooms it)
    if (el?.dataset.fit === "whole") return;
    const img = el?.querySelector<HTMLImageElement>("img[data-photo]");
    if (!el || !img || !art.photo) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const base = art.adjust[kind] ?? NO_ADJUST;
    const cover = Math.max(w / (img.naturalWidth || w), h / (img.naturalHeight || h)) * base.zoom;
    drag.current = { kind, x0: ev.clientX, y0: ev.clientY, base, ox: (img.naturalWidth || w) * cover - w, oy: (img.naturalHeight || h) * cover - h, k: w / (el.getBoundingClientRect().width || w) };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const moveDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const dx = (ev.clientX - g.x0) * g.k;
    const dy = (ev.clientY - g.y0) * g.k;
    setAdj(g.kind, { ...g.base, x: g.ox > 0.5 ? clamp(g.base.x - dx / g.ox) : g.base.x, y: g.oy > 0.5 ? clamp(g.base.y - dy / g.oy) : g.base.y });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const save = async (kind: ArtKind) => {
    const node = nodes.current[kind]?.firstElementChild as HTMLElement | null;
    if (!node) return;
    setBusy(kind);
    setError(null);
    try {
      const { w, h } = ART_SIZES[kind];
      // The flyer is already story size (1080 × 1920), so it saves at 1×; banner and thumbnail at 2×.
      const blob = await artworkBlob(node, w, h, kind === "flyer" ? 1 : 2);
      download(blob, `${e.slug || "event"}-${kind === "thumb" ? "thumbnail" : kind}.png`);
      logGeneratedPost({ tool: "events", templateId: `events-${kind}-${art.design}`, subject: e.title.trim(), source: "manual", format: kind, bytes: blob.size, ...(kind === "flyer" && agent && card.employeeId ? { employeeId: card.employeeId } : {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(null);
    }
  };

  const ready = !!e.title.trim() && e.types.length > 0 && !!artDate(e);
  // the chosen picture's real size — portal uploads run from 335 px tiles to 1440 × 2560 stories
  const [dims, setDims] = useState<{ src: string; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!art.photo) return;
    const im = new Image();
    im.onload = () => setDims({ src: art.photo, w: im.naturalWidth, h: im.naturalHeight });
    im.src = art.photo;
  }, [art.photo]);
  const size = dims && dims.src === art.photo ? dims : null;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <p className="kicker">Event artwork</p>
          <h3 className="mt-1 text-h2">Banner and thumbnail<span className="text-brand">.</span></h3>
          <p className="mt-1 text-sm text-muted-foreground">Made from Details, Schedule and Location — change the wording there and it updates here.</p>
        </div>

        <Sources e={e} goTo={goTo} />
        <Pills label="Design" value={art.design} options={ART_DESIGNS} onChange={(design) => setArt({ design })} />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label>Banner</Label>
            <span className="text-xs text-muted-foreground">{ART_SIZES.banner.use}</span>
          </div>
          <div onPointerDown={(ev) => startDrag("banner", ev)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={cn("touch-none", art.photo && "cursor-grab active:cursor-grabbing")}>
            <ScaledArt e={e} kind="banner" artRef={(el) => (nodes.current.banner = el)} className="ring-1 ring-border" />
          </div>
          {art.photo && <SizeRow id="banner-size" zoom={adj("banner").zoom} onZoom={(zoom) => setAdj("banner", { ...adj("banner"), zoom })} onReset={() => setAdj("banner", NO_ADJUST)} />}
        </div>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Thumbnail</Label>
              <span className="text-xs text-muted-foreground">{ART_SIZES.thumb.use}</span>
            </div>
            {/* shown inside a grid card, as on the stage page */}
            <div className="overflow-hidden rounded-xl border bg-card">
              <div onPointerDown={(ev) => startDrag("thumb", ev)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={cn("touch-none", art.photo && "cursor-grab active:cursor-grabbing")}>
                <ScaledArt e={e} kind="thumb" rounded={false} artRef={(el) => (nodes.current.thumb = el)} />
              </div>
              <div className="space-y-1 px-3 py-2.5">
                <p className="kicker">{e.types[0] ?? "Event type"}</p>
                <p className="truncate text-sm font-normal">{e.title || "Event title"}</p>
                <div className="flex gap-1.5"><Pill>{e.status}</Pill></div>
              </div>
            </div>
            {art.photo && <SizeRow id="thumb-size" zoom={adj("thumb").zoom} onZoom={(zoom) => setAdj("thumb", { ...adj("thumb"), zoom })} onReset={() => setAdj("thumb", NO_ADJUST)} />}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="grid grid-cols-4 gap-1.5">
                <button type="button" onClick={() => pick("")} className={cn("flex aspect-[16/10] items-center justify-center rounded-md border text-[11px] text-muted-foreground", !art.photo && "ring-2 ring-ring")}>
                  None
                </button>
                {[...uploads.map((src) => ({ src, label: "Yours", mine: true })), ...library.map((p) => ({ src: p.src, label: p.label, mine: false }))].map((p) => (
                  <button key={p.src.slice(0, 120)} type="button" title={p.label} onClick={() => pick(p.src)} className={cn("relative aspect-[16/10] overflow-hidden rounded-md", art.photo === p.src && "ring-2 ring-ring ring-offset-1")}>
                    <img src={p.src} alt={p.label} className="size-full object-cover" draggable={false} />
                    {p.mine && <span className="absolute bottom-0.5 left-0.5 rounded bg-card/90 px-1 text-[9px]">Yours</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{e.project ? `${e.project} photos first.` : "Link a project in Location to put its photos first."} Drag in either preview to move it.</p>
              {size && size.w < 1143 && (
                <p className="text-xs text-warning">
                  This picture is {size.w} × {size.h} px — it will look soft on the banner (saved at 2286 px wide). A picture at least 1600 px wide is best.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Photo fit</Label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["auto", "Auto"],
                    ["fill", "Fill the frame"],
                    ["whole", "Whole picture"],
                  ] as const
                ).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setArt({ fit: v })} className={cn("h-8 rounded-lg border px-3 text-xs", (art.fit ?? "auto") === v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Most uploaded pictures are finished posters with their own text. Auto shows those whole, over a blurred copy, instead of cropping them; Fill crops to the frame.
              </p>
            </div>
            <PhotoDropzone
              compact
              label="Upload your own photo"
              onFile={async (f) => {
                const src = await photoDataUrl(f);
                setUploads((u) => [src, ...u]);
                pick(src);
              }}
            />
            {e.types.some((t) => LOGO_TYPES.includes(t)) && <LogoPicker e={e} value={art.logo ?? ""} onChange={(logo) => setArt({ logo })} goTo={goTo} />}
            <div className="space-y-2">
              <Label>Show on the banner</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {(["subtitle", "time", "location"] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2 capitalize">
                    <input type="checkbox" className="size-4 accent-navy" checked={art.show[k]} onChange={(ev) => setArt({ show: { ...art.show, [k]: ev.target.checked } })} />
                    {k}
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-navy" checked={art.tidyCaps ?? true} onChange={(ev) => setArt({ tidyCaps: ev.target.checked })} />
                Tidy ALL CAPS title
              </label>
              <p className="text-xs text-muted-foreground">Type, title and date are always on. Description, registration and contact never are.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t pt-5 sm:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="space-y-2">
            <div onPointerDown={(ev) => startDrag("flyer", ev)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={cn("touch-none", art.photo && "cursor-grab active:cursor-grabbing")}>
              <ScaledArt e={e} kind="flyer" agent={agent} artRef={(el) => (nodes.current.flyer = el)} className="ring-1 ring-border" />
            </div>
            {art.photo && <SizeRow id="flyer-size" zoom={adj("flyer").zoom} onZoom={(zoom) => setAdj("flyer", { ...adj("flyer"), zoom })} onReset={() => setAdj("flyer", NO_ADJUST)} />}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label>Flyer</Label>
              <span className="text-xs text-muted-foreground">{ART_SIZES.flyer.use}</span>
            </div>
            <p className="text-sm text-muted-foreground">For stories and WhatsApp. Same design and photo, with more of the event on it:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Short description <span className="text-xs">(Details)</span></li>
              <li>Full address <span className="text-xs">(Location)</span></li>
              <li>{e.online ? "Livestream link" : "Registration link, or whether it’s needed"} <span className="text-xs">(Links &amp; media · Registration)</span></li>
              <li>{agent ? "Your contact card (below)" : <>Contact name and phone <span className="text-xs">(Contact)</span></>}</li>
            </ul>
            <p className="text-xs text-muted-foreground">Anything left empty is left off.</p>
            <MyCardPanel />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="button" variant="outline" size="sm" disabled={!ready || !!busy} onClick={() => save("banner")}>
            {busy === "banner" ? <Loader2 className="animate-spin" /> : <Download />} Banner PNG
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!ready || !!busy} onClick={() => save("thumb")}>
            {busy === "thumb" ? <Loader2 className="animate-spin" /> : <Download />} Thumbnail PNG
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!ready || !!busy} onClick={() => save("flyer")}>
            {busy === "flyer" ? <Loader2 className="animate-spin" /> : <Download />} Flyer 9:16 PNG
          </Button>
          <span className="text-xs text-muted-foreground">{ready ? "Banner and thumbnail save at 2×, the flyer at 1080 × 1920." : "Add a title, event type and dates first."}</span>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        {(
          [
            ["registrationUrl", "Registration link", "e.g. https://events.prov.ae/register/marina"],
            ["website", "Website", "e.g. https://provident.ae/events/marina"],
            ["promoVideo", "Promo video", "e.g. https://youtu.be/…"],
            ["livestream", "Livestream", "e.g. https://youtube.com/live/…"],
            ["brochure", "Brochure", "e.g. https://media.prov.ae/public/marketing/events/brochure.pdf"],
          ] as const
        ).map(([k, label, ph]) => (
          <div key={k} className="space-y-2">
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} type="url" placeholder={ph} value={e[k]} onChange={(ev) => set({ [k]: ev.target.value })} />
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t pt-6">
        <div>
          <p className="text-sm font-normal">Media links — staff only</p>
          <p className="mt-1 text-xs text-muted-foreground">Share links to the event&apos;s photos and videos, such as Google Drive folders. Only signed-in staff see them, even on a public event.</p>
        </div>
        {e.mediaLinks.map((m, i) => (
          <div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-2">
            <Input aria-label="Label" placeholder="Label" value={m.label} onChange={(ev) => set({ mediaLinks: e.mediaLinks.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)) })} />
            <Input aria-label="Link" type="url" placeholder="https://drive.google.com/…" value={m.url} onChange={(ev) => set({ mediaLinks: e.mediaLinks.map((x, j) => (j === i ? { ...x, url: ev.target.value } : x)) })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove link" onClick={() => set({ mediaLinks: e.mediaLinks.filter((_, j) => j !== i) })}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set({ mediaLinks: [...e.mediaLinks, { label: "", url: "" }] })}>
          <Plus /> Add media link
        </Button>
      </section>
    </div>
  );
}
