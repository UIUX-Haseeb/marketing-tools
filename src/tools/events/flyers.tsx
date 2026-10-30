"use client";

/**
 * Event Flyers — the agents' page. Pick an event from the Events list (the data comes straight
 * from the event record, nothing is retyped), choose a 9:16 story or a 4:5 feed post and a
 * design, add your own contact card (my-card.ts, the Project Booklet's agent card) and download.
 * Marketing makes the event in the Events tool; agents only personalise and share it here.
 */
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Download, Loader2, Lock, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logGeneratedPost } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ScaledArt } from "./artwork";
import { slugify } from "./data";
import { artworkBlob, download } from "./exporter";
import { isPast, isUpcoming, nextOccurrence, parse, placeLine, shortDate } from "./format";
import { flyerAgent, useMyCard } from "./my-card";
import { MyCardPanel } from "./my-card-panel";
import { useEvents } from "./store";
import { ART_DESIGNS, ART_SIZES, type ArtDesign, type EventRecord } from "./types";

type Format = "flyer" | "post";
const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: "flyer", label: "Story 9:16", hint: "Stories, Status and WhatsApp · 1080 × 1920" },
  { id: "post", label: "Post 4:5", hint: "Instagram and LinkedIn feed · 1080 × 1350" },
];

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

/** When it next happens (or last happened), for sorting: upcoming soonest first, then past latest first. */
function when(e: EventRecord) {
  const next = nextOccurrence(e);
  if (next) return next.day.getTime();
  const end = parse(e.ends) ?? parse(e.starts);
  return end ? -new Date(end.y, end.m - 1, end.d).getTime() : -Infinity;
}

function EventRow({ e, on, onPick }: { e: EventRecord; on: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={on} className={cn("flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors", on ? "border-[#f3793c] bg-card shadow-[inset_0_0_0_1px_#f3793c]" : "bg-card hover:border-navy-2/40")}>
      <div className="w-24 shrink-0 overflow-hidden rounded-md">
        <ScaledArt e={e} kind="thumb" rounded={false} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{e.title || "Untitled event"}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          {shortDate(e) || "No date"}
          {isPast(e) && " · past"}
        </p>
        {placeLine(e) && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {placeLine(e)}
          </p>
        )}
      </div>
      {e.audience !== "Public" && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Staff only" />}
    </button>
  );
}

export default function EventFlyersTool() {
  const events = useEvents();
  const card = useMyCard();
  const agent = flyerAgent(card);
  const [query, setQuery] = useState("");
  const [past, setPast] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("flyer");
  const [design, setDesign] = useState<ArtDesign | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const node = useRef<HTMLDivElement | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => e.status === "Published" && !e.cancelled)
      .filter((e) => past || isUpcoming(e))
      .filter((e) => !q || [e.title, e.venue, e.city, ...e.types].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const x = when(a);
        const y = when(b);
        return (x >= 0) !== (y >= 0) ? (x >= 0 ? -1 : 1) : x >= 0 ? x - y : y - x;
      });
  }, [events, query, past]);

  const event = list.find((e) => e.id === pickedId) ?? list[0] ?? null;
  const dz = design ?? event?.artwork.design ?? "a";
  const { w, h } = ART_SIZES[format];

  const save = async () => {
    const el = node.current?.firstElementChild as HTMLElement | null;
    if (!el || !event) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await artworkBlob(el, w, h, 1);
      const who = agent ? `-${slugify(agent.name)}` : "";
      download(blob, `${event.slug || slugify(event.title) || "event"}-${format === "post" ? "post" : "story"}${who}.png`);
      logGeneratedPost({ tool: "event-flyers", templateId: `events-${format}-${dz}`, subject: event.title.trim(), source: "demo", format, bytes: blob.size, ...(agent && card.employeeId ? { employeeId: card.employeeId } : {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ef-search">Event</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ef-search" value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Search events, venues, types…" className="rounded-full pl-9" />
          </div>
          <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
            {list.map((e) => (
              <EventRow key={e.id} e={e} on={e.id === event?.id} onPick={() => setPickedId(e.id)} />
            ))}
            {!list.length && <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{query ? "No events match." : "No upcoming events — include past ones below."}</p>}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="size-4 accent-navy" checked={past} onChange={(ev) => setPast(ev.target.checked)} />
            Include past events
          </label>
        </div>

        <div className="space-y-1.5 border-t pt-5">
          <Pills label="Format" value={format} options={FORMATS} onChange={setFormat} />
          <p className="text-xs text-muted-foreground">{FORMATS.find((f) => f.id === format)!.hint}</p>
        </div>

        <Pills label="Design" value={dz} options={ART_DESIGNS.map((d) => ({ id: d.value, label: d.label }))} onChange={setDesign} />

        <div className="border-t pt-5">
          <MyCardPanel />
        </div>

        <div className="space-y-2 border-t pt-5">
          <Button type="button" onClick={save} disabled={!event || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />} Download {format === "post" ? "post" : "story"} PNG
          </Button>
          <p className="text-xs text-muted-foreground">
            {event ? `${w} × ${h}${agent ? `, with your card (${agent.name})` : ", with the event contact"}.` : "Pick an event first."}
            {event && event.audience !== "Public" && " Staff-only event — share with brokers and clients privately, not on public channels."}
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        {event ? (
          <div className={cn("mx-auto", format === "post" ? "max-w-[30rem]" : "max-w-[24rem]")}>
            <ScaledArt key={`${event.id}-${format}`} e={event} kind={format} design={dz} agent={agent} artRef={(el) => (node.current = el)} className="shadow-sm ring-1 ring-border" />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Made from the event in Events — title, dates, venue and photo. Ask marketing to change those.
            </p>
          </div>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Pick an event to see your flyer.</div>
        )}
      </div>
    </div>
  );
}
