"use client";

/**
 * The portal's Events page (portal.prov.ae › Marketing › Events), rebuilt to its measurements:
 * stat cards that double as filters, search + type filter, Cards / List, and the Event details
 * pop-out. Cards show the generated thumbnail; the pop-out shows the generated banner.
 *
 * Portal styles copied: navy #2f4960 buttons with 12 px corners, white cards with a 1 px
 * rgba(20,28,48,.12) border and 12 px corners, 11 px uppercase type label, 14 px semibold
 * title, 22 px bold navy date, cream "Published" / teal "Scheduled" pills, icon lines for the
 * date range, venue, registration and contact, "Staff only" / "Featured" badges on the image.
 */
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, ArrowUp, CalendarDays, CheckSquare, Columns3, Expand, Filter, Heart, LayoutGrid, List, Lock, MapPin, Plus, Rows3, RotateCcw, Search, Star, Ticket, User, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScaledArt } from "./artwork";
import { EventDetail, StageChips } from "./event-detail";
import { EventForm } from "./event-form";
import { fmtDate, fmtDay, isPast, isRecurring, isUpcoming, nextOccurrence, placeLine, weekdayList } from "./format";
import { resetEvents, saveEvent, useEvents } from "./store";
import { EVENT_TYPES, type EventRecord, type EventType } from "./types";
import { Drawer, Pill } from "./ui";

type Stat = "all" | "upcoming" | "recurring" | "public";

const isPublic = (e: EventRecord) => e.status === "Published" && e.audience === "Public";
const staffOnly = (e: EventRecord) => e.audience !== "Public";
/** Upcoming by next date, then past ones, most recent first (the portal's "Event date" order). */
const sortKey = (e: EventRecord) => {
  const n = nextOccurrence(e);
  return n ? +n.day : 1e14 - (+new Date(e.starts) || 0);
};
const sameDay = (e: EventRecord) => e.starts.slice(0, 10) === e.ends.slice(0, 10);

const ink = "text-[rgba(20,28,48,0.9)]";
const navy = "text-[#2f4960]";
const btn = "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium tracking-[0.01em] [&_svg]:size-4 transition-colors disabled:pointer-events-none disabled:opacity-50";
const btnPrimary = cn(btn, "bg-[#2f4960] px-5 text-white hover:bg-[#2f4960]/90");
const btnOutline = cn(btn, "border border-[#2f4960] text-[#2f4960] hover:bg-[#2f4960]/5");
const btnQuiet = cn(btn, "border border-[rgba(20,28,48,0.12)] bg-white text-[rgba(20,28,48,0.9)] hover:bg-[#f4f1ec]");

function StatCard({ label, value, help, active, onClick, accent }: { label: string; value: number; help: string; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-3 text-left transition-shadow hover:shadow-[0_2px_8px_rgba(20,28,48,0.12)]",
        active && "border-[#f3793c] shadow-[inset_0_0_0_1px_#f3793c,0_2px_8px_rgba(20,28,48,0.12)]",
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.06em] text-[rgba(20,28,48,0.7)] uppercase">{label}</span>
      <span className={cn("text-xl leading-6 font-bold tracking-[-0.02em]", accent && value > 0 ? "text-[#f3793c]" : navy)}>{value}</span>
      <span className="text-xs text-[rgba(20,28,48,0.6)]">{help}</span>
    </button>
  );
}

function FilterChip({ children, onClear }: { children: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#f4f1ec] px-2.5 text-xs">
      {children}
      <button type="button" onClick={onClear} aria-label={`Remove ${children}`} className="text-muted-foreground hover:text-foreground">
        <XCircle className="size-3.5" />
      </button>
    </span>
  );
}

function Line({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-[rgba(20,28,48,0.7)] [&_svg]:size-3.5 [&_svg]:shrink-0">
      {icon}
      <span className="truncate">{children}</span>
    </p>
  );
}

function EventCard({ e, onOpen }: { e: EventRecord; onOpen: () => void }) {
  const next = nextOccurrence(e);
  const place = placeLine(e);
  return (
    <button type="button" onClick={onOpen} className="group flex flex-col overflow-hidden rounded-xl border border-[rgba(20,28,48,0.12)] bg-white text-left transition-colors hover:border-[#f3793c]">
      <div className="relative">
        <ScaledArt e={e} kind="thumb" rounded={false} />
        <div className="absolute bottom-2 left-2 flex gap-1">
          {staffOnly(e) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[rgba(20,28,48,0.9)]">
              <Lock className="size-3" /> Staff only
            </span>
          )}
          {e.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[rgba(20,28,48,0.9)]">
              <Star className="size-3" /> Featured
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[rgba(20,28,48,0.7)] uppercase">{e.types.join(" · ")}</p>
        <p className={cn("line-clamp-2 text-sm leading-[1.35] font-semibold", ink)}>{e.title}</p>
        <p className={cn("text-[22px] leading-[1.2] font-bold tracking-[-0.02em]", navy)}>{next ? fmtDay(next.day) : fmtDate(e.starts)}</p>
        <div className="flex flex-wrap gap-1">
          <Pill>{e.status}</Pill>
          <StageChips e={e} />
        </div>
        <div className="mt-1 space-y-1 border-t border-[rgba(20,28,48,0.08)] pt-2">
          {e.shortDescription && <p className="truncate text-xs text-[rgba(20,28,48,0.7)]">{e.shortDescription}</p>}
          {!sameDay(e) && (
            <Line icon={<CalendarDays />}>
              {fmtDate(e.starts)} – {fmtDate(e.ends)}
              {e.repeats.length > 0 && ` · ${weekdayList(e.repeats)}`}
            </Line>
          )}
          {place && <Line icon={<MapPin />}>{place}</Line>}
          {e.registrationRequired && <Line icon={<Ticket />}>Registration required</Line>}
          {e.contactName && <Line icon={<User />}>{e.contactName}</Line>}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[rgba(20,28,48,0.08)] pt-2 text-[11px] text-[rgba(20,28,48,0.5)]">
          <span>Created {e.created ? fmtDate(e.created) : "—"}</span>
          {isPast(e) && <span>Past</span>}
        </div>
      </div>
    </button>
  );
}

function EventTable({ rows, onOpen }: { rows: EventRecord[]; onOpen: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2 text-xs text-[rgba(20,28,48,0.7)]">
        <span>
          <b className="font-semibold text-[rgba(20,28,48,0.9)]">{rows.length} events</b> · sorted by Next date <ArrowUp className="inline size-3" />
        </span>
        <span className="flex items-center gap-4 [&_svg]:size-3.5">
          <span className="inline-flex items-center gap-1"><Columns3 /> Columns</span>
          <span className="inline-flex items-center gap-1"><Rows3 /> Density</span>
          <span className="inline-flex items-center gap-1"><Expand /> Expand</span>
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[rgba(20,28,48,0.12)]">
        <table className="w-full text-[13px]">
          <thead className="bg-[#faf8f4]">
            <tr className="text-left text-[11px] font-semibold tracking-[0.06em] text-[rgba(20,28,48,0.7)] uppercase [&_th]:px-3 [&_th]:py-2.5 [&_th]:whitespace-nowrap">
              <th className="w-8"><input type="checkbox" aria-label="Select all" className="size-3.5" disabled /></th>
              <th>Event</th>
              <th>Status</th>
              <th>Type</th>
              <th>Next date</th>
              <th>Runs</th>
              <th>Repeats</th>
              <th>Venue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,28,48,0.08)]">
            {rows.map((e) => {
              const next = nextOccurrence(e);
              return (
                <tr key={e.id} onClick={() => onOpen(e.id)} className={cn("cursor-pointer bg-white hover:bg-[#faf8f4] [&_td]:px-3 [&_td]:py-2", ink)}>
                  <td onClick={(ev) => ev.stopPropagation()}><input type="checkbox" aria-label={`Select ${e.title}`} className="size-3.5" /></td>
                  <td className="max-w-72">
                    <span className="flex items-center gap-2.5">
                      <span className="w-12 shrink-0 overflow-hidden rounded"><ScaledArt e={e} kind="thumb" rounded={false} /></span>
                      <span className="truncate font-semibold">{e.title}</span>
                    </span>
                  </td>
                  <td><Pill>{e.status}</Pill></td>
                  <td className="whitespace-nowrap">{e.types.join(", ")}</td>
                  <td className="whitespace-nowrap">{next ? `${fmtDay(next.day)}, ${next.from}` : <span className="inline-flex items-center gap-1.5">— <Pill>Past</Pill></span>}</td>
                  <td className="whitespace-nowrap">{fmtDate(e.starts)} → {fmtDate(e.ends)}</td>
                  <td className="whitespace-nowrap">{e.repeats.length ? weekdayList(e.repeats) : "One-off"}</td>
                  <td className="max-w-56 truncate">{e.venue || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
      .filter((e) => !needle || [e.title, e.subtitle, e.shortDescription, e.venue, e.city, e.types.join(" ")].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => (asc ? sortKey(a) - sortKey(b) : sortKey(b) - sortKey(a)));
  }, [events, stat, types, q, asc]);

  const open = events.find((e) => e.id === openId) ?? null;
  const filtered = stat !== "all" || types.length > 0 || !!q;
  const filterCount = types.length + (stat !== "all" ? 1 : 0);

  return (
    <div className={cn("space-y-3", ink)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={cn("flex items-center gap-2 text-2xl font-bold tracking-[-0.02em]", navy)}>
            <Heart className="size-5 text-[rgba(20,28,48,0.5)]" /> Events
          </h2>
          <p className="text-xs text-[rgba(20,28,48,0.6)]">
            {shown.length} {shown.length === 1 ? "event" : "events"}
            {filtered && " · filtered"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnOutline} disabled>
            <CheckSquare /> Select
          </button>
          <div className="inline-flex h-9 items-center rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-0.5">
            {(["cards", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={cn("inline-flex h-full items-center gap-1.5 rounded-[10px] px-3 text-xs capitalize [&_svg]:size-3.5", view === v ? "bg-[#f4f1ec] font-medium" : "text-[rgba(20,28,48,0.6)]")}>
                {v === "cards" ? <LayoutGrid /> : <List />} {v}
              </button>
            ))}
          </div>
          <button type="button" className={btnPrimary} onClick={() => setForm({})}>
            <Plus /> Add event
          </button>
          <button type="button" className={btnOutline} onClick={resetEvents} title="Put the portal events back as they were">
            <RotateCcw /> Reset
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events" value={events.length} help="All events" active={stat === "all" && !filtered} onClick={() => setStat("all")} />
        <StatCard label="Upcoming" value={events.filter((e) => isUpcoming(e)).length} help="Still have a date ahead" active={stat === "upcoming"} onClick={() => setStat(stat === "upcoming" ? "all" : "upcoming")} />
        <StatCard label="Recurring" value={events.filter(isRecurring).length} help="Repeat on chosen days" active={stat === "recurring"} onClick={() => setStat(stat === "recurring" ? "all" : "recurring")} />
        <StatCard label="Public" value={events.filter(isPublic).length} help="Status is public" active={stat === "public"} onClick={() => setStat(stat === "public" ? "all" : "public")} accent />
      </div>

      <div className="rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-9 w-full items-center rounded-full border border-[rgba(20,28,48,0.12)] px-3 sm:w-72">
            <Search className="size-4 shrink-0 text-[rgba(20,28,48,0.5)]" />
            <input aria-label="Search events" placeholder="Search events…" value={q} onChange={(ev) => setQ(ev.target.value)} className="h-full w-full bg-transparent px-2 text-sm outline-none placeholder:text-[rgba(20,28,48,0.45)]" />
          </label>
          {types.map((t) => <FilterChip key={t} onClear={() => setTypes(types.filter((x) => x !== t))}>{`Type: ${t}`}</FilterChip>)}
          {stat !== "all" && <FilterChip onClear={() => setStat("all")}>{`${stat[0].toUpperCase()}${stat.slice(1)}: Yes`}</FilterChip>}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className={btnQuiet} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <Filter /> Filters {filterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-[#f3793c] text-[10px] text-white">{filterCount}</span>}
            </button>
            <button type="button" className={cn(btn, "px-2 text-[rgba(20,28,48,0.6)] hover:text-[rgba(20,28,48,0.9)]")} onClick={() => { setTypes([]); setStat("all"); setQ(""); }} disabled={!filtered}>
              Clear all
            </button>
            <button type="button" className={btnQuiet} onClick={() => setAsc((a) => !a)} title={asc ? "Soonest first" : "Latest first"}>
              <ArrowDownUp /> Event date
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[rgba(20,28,48,0.08)] pt-3">
            <span className="mr-1 self-center text-xs text-[rgba(20,28,48,0.6)]">Type</span>
            {EVENT_TYPES.map((t) => {
              const on = types.includes(t);
              const n = events.filter((e) => e.types.includes(t)).length;
              return (
                <button key={t} type="button" onClick={() => setTypes(on ? types.filter((x) => x !== t) : [...types, t])} aria-pressed={on} className={cn("h-7 rounded-full border px-3 text-xs", on ? "border-[#2f4960] bg-[#2f4960] text-white" : "border-[rgba(20,28,48,0.12)] hover:bg-[#f4f1ec]")}>
                  {t} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-3">
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-[rgba(20,28,48,0.6)]">No events match these filters.</p>
        ) : view === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => <EventCard key={e.id} e={e} onOpen={() => setOpenId(e.id)} />)}
          </div>
        ) : (
          <EventTable rows={shown} onOpen={setOpenId} />
        )}
        <div className="mt-3 flex items-center justify-end gap-6 px-1 text-xs text-[rgba(20,28,48,0.7)]">
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
