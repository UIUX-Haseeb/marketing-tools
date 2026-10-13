"use client";

/**
 * The CRM's Events stage page (Figma: Stage Page – Main): stat cards that double as filters,
 * search + type filter chips, Cards / List, and the Event details pop-out (Stage Page – Popout).
 * Grid cards show the generated thumbnail; the pop-out shows the generated banner.
 */
import { useMemo, useState } from "react";
import { ArrowDownUp, CheckSquare, Filter, LayoutGrid, List, MapPin, Plus, RotateCcw, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScaledArt } from "./artwork";
import { EventDetail, StageChips } from "./event-detail";
import { EventForm } from "./event-form";
import { fmtDate, fmtDay, isRecurring, isUpcoming, nextOccurrence, placeLine } from "./format";
import { resetEvents, saveEvent, useEvents } from "./store";
import { EVENT_TYPES, type EventRecord, type EventType } from "./types";
import { Drawer, Pill } from "./ui";

type Stat = "all" | "upcoming" | "recurring" | "public";

const isPublic = (e: EventRecord) => e.status === "Published" && e.audience === "Public";
/** Upcoming by next date, then past ones, most recent first. */
const sortKey = (e: EventRecord) => {
  const n = nextOccurrence(e);
  return n ? +n.day : 1e14 - (+new Date(e.starts) || 0);
};

function StatCard({ label, value, help, active, onClick, accent }: { label: string; value: number; help: string; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("rounded-xl border bg-card p-4 text-left transition-colors hover:border-navy-2/60", active && "border-brand ring-1 ring-brand")}>
      <p className="kicker">{label}</p>
      <p className={cn("mt-1.5 text-h1", accent && value > 0 && "text-brand")}>{value}</p>
      <p className="text-xs text-muted-foreground">{help}</p>
    </button>
  );
}

function FilterChip({ children, onClear }: { children: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md bg-muted px-2 text-xs">
      {children}
      <button type="button" onClick={onClear} aria-label={`Remove ${children}`} className="text-muted-foreground hover:text-foreground">
        <XCircle className="size-3.5" />
      </button>
    </span>
  );
}

function EventCard({ e, onOpen }: { e: EventRecord; onOpen: () => void }) {
  const next = nextOccurrence(e);
  return (
    <button type="button" onClick={onOpen} className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-navy-2/60">
      <ScaledArt e={e} kind="thumb" rounded={false} />
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-3 pb-2.5">
        <p className="kicker">{e.types.join(" · ")}</p>
        <p className="line-clamp-2 text-sm font-normal">{e.title}</p>
        <p className="text-h2">{next ? fmtDay(next.day) : fmtDate(e.starts)}</p>
        <div className="flex flex-wrap gap-1.5">
          <Pill>{e.status}</Pill>
          <StageChips e={e} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{placeLine(e) || "No location"}</span>
        </p>
        <p className="border-t pt-2 text-[11px] text-muted-foreground">Created {e.created ? fmtDate(e.created) : "—"}</p>
      </div>
    </button>
  );
}

export function StagePage() {
  const events = useEvents();
  const [stat, setStat] = useState<Stat>("all");
  const [types, setTypes] = useState<EventType[]>([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [asc, setAsc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ edit?: EventRecord } | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events
      .filter((e) => (stat === "upcoming" ? isUpcoming(e) : stat === "recurring" ? isRecurring(e) : stat === "public" ? isPublic(e) : true))
      .filter((e) => !types.length || e.types.some((t) => types.includes(t)))
      .filter((e) => !needle || [e.title, e.subtitle, e.venue, e.city, e.types.join(" ")].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => (asc ? sortKey(a) - sortKey(b) : sortKey(b) - sortKey(a)));
  }, [events, stat, types, q, asc]);

  const open = events.find((e) => e.id === openId) ?? null;
  const filtered = stat !== "all" || types.length > 0 || !!q;
  const filterCount = types.length + (stat !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* the tool page already shows the name — just the count here */}
        <div>
          <p className="text-xs text-muted-foreground">
            {shown.length} {shown.length === 1 ? "event" : "events"}
            {filtered && " · filtered"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <CheckSquare /> Select
          </Button>
          <div className="inline-flex rounded-lg border bg-card p-0.5">
            {(["cards", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs capitalize [&_svg]:size-3.5", view === v ? "bg-muted" : "text-muted-foreground")}>
                {v === "cards" ? <LayoutGrid /> : <List />} {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setForm({})}>
            <Plus /> Add event
          </Button>
          <Button variant="outline" size="sm" onClick={resetEvents} title="Put the demo events back as they were">
            <RotateCcw /> Reset demo
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events" value={events.length} help="All events" active={stat === "all" && filtered === false} onClick={() => setStat("all")} />
        <StatCard label="Upcoming" value={events.filter((e) => isUpcoming(e)).length} help="Still have a date ahead" active={stat === "upcoming"} onClick={() => setStat(stat === "upcoming" ? "all" : "upcoming")} />
        <StatCard label="Recurring" value={events.filter(isRecurring).length} help="Repeat on chosen days" active={stat === "recurring"} onClick={() => setStat(stat === "recurring" ? "all" : "recurring")} />
        <StatCard label="Public" value={events.filter(isPublic).length} help="Status is public" active={stat === "public"} onClick={() => setStat(stat === "public" ? "all" : "public")} accent />
      </div>

      <div className="relative rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search events" placeholder="Search events…" value={q} onChange={(ev) => setQ(ev.target.value)} className="pl-9" />
          </div>
          {types.map((t) => <FilterChip key={t} onClear={() => setTypes(types.filter((x) => x !== t))}>{`Type: ${t}`}</FilterChip>)}
          {stat !== "all" && <FilterChip onClear={() => setStat("all")}>{`${stat[0].toUpperCase()}${stat.slice(1)}: Yes`}</FilterChip>}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <Filter /> Filters {filterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground">{filterCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setTypes([]); setStat("all"); setQ(""); }} disabled={!filtered}>
              Clear all
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAsc((a) => !a)} title={asc ? "Soonest first" : "Latest first"}>
              <ArrowDownUp /> Event date
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
            <span className="mr-1 self-center text-xs text-muted-foreground">Type</span>
            {EVENT_TYPES.map((t) => {
              const on = types.includes(t);
              const n = events.filter((e) => e.types.includes(t)).length;
              return (
                <button key={t} type="button" onClick={() => setTypes(on ? types.filter((x) => x !== t) : [...types, t])} aria-pressed={on} className={cn("h-7 rounded-md border px-2.5 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  {t} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-3">
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No events match these filters.</p>
        ) : view === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => <EventCard key={e.id} e={e} onOpen={() => setOpenId(e.id)} />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground [&_th]:px-2 [&_th]:py-2 [&_th]:font-light">
                  <th className="w-32" />
                  <th>Event</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t">
                {shown.map((e) => {
                  const next = nextOccurrence(e);
                  return (
                    <tr key={e.id} onClick={() => setOpenId(e.id)} className="cursor-pointer hover:bg-secondary/60 [&_td]:px-2 [&_td]:py-2">
                      <td><ScaledArt e={e} kind="thumb" className="w-28" /></td>
                      <td className="max-w-64"><span className="line-clamp-2 font-normal">{e.title}</span></td>
                      <td className="text-muted-foreground">{e.types.join(", ")}</td>
                      <td className="whitespace-nowrap">{next ? fmtDay(next.day) : fmtDate(e.starts)}</td>
                      <td className="max-w-48 truncate text-muted-foreground">{placeLine(e)}</td>
                      <td><span className="flex flex-wrap gap-1"><Pill>{e.status}</Pill><StageChips e={e} /></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-end gap-6 px-1 text-xs text-muted-foreground">
          <span>Rows per page: 50</span>
          <span>1–{shown.length} of {shown.length}</span>
        </div>
      </div>

      {open && (
        <Drawer title="Event details" onClose={() => setOpenId(null)}>
          <EventDetail e={open} onEdit={() => setForm({ edit: open })} onTogglePublish={() => saveEvent({ ...open, status: open.status === "Published" ? "Unpublished" : "Published" })} />
        </Drawer>
      )}
      {form && (
        <EventForm
          initial={form.edit}
          onClose={() => setForm(null)}
          onSaved={(e) => {
            setForm(null);
            setOpenId(e.id);
          }}
        />
      )}
    </div>
  );
}
