"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The portal's Company Listings page (portal.prov.ae › Listings › Company Listings), rebuilt for
 * staging the brochure: stat cards that double as filters, a pill search, List / Cards, and the
 * Listing details pop-out. Tick listings (or "Select" all shown) and press **Brochure** to make one
 * brochure from all of them; a listing's own Brochure button makes one for that listing.
 *
 * Portal styles as in the Events tool: navy #2f4960 buttons with 12 px corners, white cards with a
 * 1 px rgba(20,28,48,.12) border, 11 px uppercase labels, status pills (Approved / Draft / Rejected).
 */
import { useMemo, useState, type ReactNode } from "react";
import { Bath, BedDouble, CheckSquare, FileText, Heart, LayoutGrid, List, MapPin, Ruler, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrochureStudio } from "./brochure-studio";
import { money, placeLine, sqft } from "./format";
import { ListingDetail } from "./listing-detail";
import { LISTINGS } from "./real";
import type { Listing } from "./types";
import { Drawer } from "./ui";

type Stat = "all" | "Sale" | "Rent" | "Commercial";

const ink = "text-[rgba(20,28,48,0.9)]";
const navy = "text-[#2f4960]";
const btn = "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium tracking-[0.01em] [&_svg]:size-4 transition-colors disabled:pointer-events-none disabled:opacity-50";
const btnPrimary = cn(btn, "bg-[#2f4960] px-5 text-white hover:bg-[#2f4960]/90");
const btnOutline = cn(btn, "border border-[#2f4960] text-[#2f4960] hover:bg-[#2f4960]/5");

/** Each listing gets a demo agent so the pop-out and brochure have someone on them. */
const agentIndex = (l: Listing) => LISTINGS.indexOf(l);

function StatCard({ label, value, help, active, onClick }: { label: string; value: ReactNode; help: string; active: boolean; onClick: () => void }) {
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
      <span className={cn("text-xl leading-6 font-bold tracking-[-0.02em]", navy)}>{value}</span>
      <span className="text-xs text-[rgba(20,28,48,0.6)]">{help}</span>
    </button>
  );
}

/** Status pill in the portal's colours: Approved green, Draft amber, Rejected red. */
const STATUS: Record<string, string> = {
  Approved: "bg-[rgba(40,199,111,0.14)] text-[#28c76f]",
  Draft: "bg-[rgba(255,159,67,0.16)] text-[#ff9f43]",
  Rejected: "bg-[rgba(234,84,85,0.14)] text-[#ea5455]",
};
function Status({ s }: { s: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[s] ?? STATUS.Approved)}>{s}</span>;
}

function Check({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <input type="checkbox" checked={on} onChange={onChange} onClick={(e) => e.stopPropagation()} aria-label={label} className="size-3.5 accent-[#2f4960]" />;
}

function ListingCard({ l, on, onToggle, onOpen }: { l: Listing; on: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-colors", on ? "border-[#f3793c]" : "border-[rgba(20,28,48,0.12)] hover:border-[#f3793c]")}>
      <button type="button" onClick={onOpen} className="text-left">
        <div className="relative aspect-[4/3]">
          <img src={l.photos[0]} alt="" className="size-full object-cover" loading="lazy" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium">{l.offering === "Rent" ? "For rent" : "For sale"}</span>
        </div>
        <div className="space-y-1 px-2.5 pt-2.5 pb-2.5">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[rgba(20,28,48,0.7)] uppercase">{l.propertyType} · {l.ref}</p>
          <p className={cn("line-clamp-2 text-sm leading-[1.35] font-semibold", ink)}>{l.title}</p>
          <p className={cn("text-[20px] leading-[1.2] font-bold tracking-[-0.02em]", navy)}>{money(l)}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-[rgba(20,28,48,0.7)]">
            <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{placeLine(l)}</span>
          </p>
          <p className="flex gap-3 border-t border-[rgba(20,28,48,0.08)] pt-2 text-xs text-[rgba(20,28,48,0.7)] [&_svg]:size-3.5">
            {l.beds && <span className="inline-flex items-center gap-1"><BedDouble /> {l.beds}</span>}
            {l.baths && <span className="inline-flex items-center gap-1"><Bath /> {l.baths}</span>}
            <span className="inline-flex items-center gap-1"><Ruler /> {sqft(l.size)}</span>
          </p>
        </div>
      </button>
      <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-md bg-white/95">
        <Check on={on} onChange={onToggle} label={`Select ${l.ref}`} />
      </span>
    </div>
  );
}

function ListingTable({ rows, picked, onToggle, onToggleAll, onOpen }: { rows: Listing[]; picked: Set<string>; onToggle: (id: string) => void; onToggleAll: () => void; onOpen: (id: string) => void }) {
  const all = rows.length > 0 && rows.every((l) => picked.has(l.id));
  return (
    <div className="overflow-x-auto rounded-lg border border-[rgba(20,28,48,0.12)]">
      <table className="w-full text-[13px]">
        <thead className="bg-[#faf8f4]">
          <tr className="text-left text-[11px] font-semibold tracking-[0.06em] text-[rgba(20,28,48,0.7)] uppercase [&_th]:px-3 [&_th]:py-2.5 [&_th]:whitespace-nowrap">
            <th className="w-8"><Check on={all} onChange={onToggleAll} label="Select all shown" /></th>
            <th>Listing</th>
            <th>Status</th>
            <th>Price</th>
            <th>Type</th>
            <th>Offering</th>
            <th>Beds</th>
            <th>Baths</th>
            <th>BUA (sqft)</th>
            <th>Plot (sqft)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(20,28,48,0.08)]">
          {rows.map((l) => (
            <tr key={l.id} onClick={() => onOpen(l.id)} className={cn("cursor-pointer hover:bg-[#faf8f4] [&_td]:px-3 [&_td]:py-2", picked.has(l.id) ? "bg-[#fff6f0]" : "bg-white", ink)}>
              <td><Check on={picked.has(l.id)} onChange={() => onToggle(l.id)} label={`Select ${l.ref}`} /></td>
              <td className="max-w-80">
                <span className="flex items-center gap-2.5">
                  <img src={l.photos[0]} alt="" className="h-8 w-12 shrink-0 rounded object-cover" loading="lazy" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.title}</span>
                    <span className="block text-[11px] text-[rgba(20,28,48,0.55)]">{l.ref}</span>
                  </span>
                </span>
              </td>
              <td><Status s={l.status} /></td>
              <td className="whitespace-nowrap">{money(l)}</td>
              <td>{l.propertyType}</td>
              <td className="whitespace-nowrap">{l.offeringName}</td>
              <td>{l.beds || "—"}</td>
              <td>{l.baths || "—"}</td>
              <td>{l.size ? Math.round(l.size).toLocaleString("en-US") : "—"}</td>
              <td>{l.plot ? Math.round(l.plot).toLocaleString("en-US") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StagePage() {
  const [stat, setStat] = useState<Stat>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "cards">("list");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [brochure, setBrochure] = useState<Listing[] | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LISTINGS.filter((l) => (stat === "all" ? true : stat === "Commercial" ? l.segment === "Commercial" : l.offering === stat)).filter(
      (l) => !needle || [l.title, l.ref, l.community, l.subCommunity, l.tower, l.propertyType].join(" ").toLowerCase().includes(needle),
    );
  }, [stat, q]);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };
  const allShown = shown.length > 0 && shown.every((l) => picked.has(l.id));
  const toggleAll = () => {
    const next = new Set(picked);
    shown.forEach((l) => (allShown ? next.delete(l.id) : next.add(l.id)));
    setPicked(next);
  };
  const pickedList = LISTINGS.filter((l) => picked.has(l.id));
  const open = LISTINGS.find((l) => l.id === openId) ?? null;
  const sale = LISTINGS.filter((l) => l.offering === "Sale").length;

  return (
    <div className={cn("space-y-3", ink)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={cn("flex items-center gap-2 text-2xl font-bold tracking-[-0.02em]", navy)}>
            <Heart className="size-5 text-[rgba(20,28,48,0.5)]" /> Company Listings
          </h2>
          <p className="text-xs text-[rgba(20,28,48,0.6)]">
            {shown.length} listings · portal snapshot, 16 & 19 Oct 2026{(stat !== "all" || q) && " · filtered"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnOutline} onClick={toggleAll}>
            <CheckSquare /> {allShown ? "Clear selection" : "Select"}
          </button>
          <div className="inline-flex h-9 items-center rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-0.5">
            {(["list", "cards"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={cn("inline-flex h-full items-center gap-1.5 rounded-[10px] px-3 text-xs capitalize [&_svg]:size-3.5", view === v ? "bg-[#f4f1ec] font-medium" : "text-[rgba(20,28,48,0.6)]")}>
                {v === "cards" ? <LayoutGrid /> : <List />} {v}
              </button>
            ))}
          </div>
          <button type="button" className={btnPrimary} disabled={!picked.size} onClick={() => setBrochure(pickedList)} title={picked.size ? "One brochure from the selected listings" : "Tick listings first"}>
            <FileText /> Brochure{picked.size > 0 && ` (${picked.size})`}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Listings" value={LISTINGS.length} help="All statuses" active={stat === "all"} onClick={() => setStat("all")} />
        <StatCard label="Sales / Rental" value={`${sale} / ${LISTINGS.length - sale}`} help="Click for sales" active={stat === "Sale"} onClick={() => setStat(stat === "Sale" ? "all" : "Sale")} />
        <StatCard label="Rental" value={LISTINGS.length - sale} help="Residential and commercial" active={stat === "Rent"} onClick={() => setStat(stat === "Rent" ? "all" : "Rent")} />
        <StatCard label="Commercial" value={LISTINGS.filter((l) => l.segment === "Commercial").length} help="Offices, co-working, business centres" active={stat === "Commercial"} onClick={() => setStat(stat === "Commercial" ? "all" : "Commercial")} />
      </div>

      <div className="rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-9 w-full items-center rounded-full border border-[rgba(20,28,48,0.12)] px-3 sm:w-80">
            <Search className="size-4 shrink-0 text-[rgba(20,28,48,0.5)]" />
            <input aria-label="Search listings" placeholder="Search by title or reference…" value={q} onChange={(e) => setQ(e.target.value)} className="h-full w-full bg-transparent px-2 text-sm outline-none placeholder:text-[rgba(20,28,48,0.45)]" />
          </label>
          {stat !== "all" && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#f4f1ec] px-2.5 text-xs">
              {stat === "Commercial" ? "Segment: Commercial" : `Offering: ${stat}`}
              <button type="button" onClick={() => setStat("all")} aria-label="Remove filter" className="text-muted-foreground hover:text-foreground">
                <XCircle className="size-3.5" />
              </button>
            </span>
          )}
          {picked.size > 0 && (
            <span className="ml-auto text-xs text-[rgba(20,28,48,0.7)]">
              {picked.size} selected ·{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => setPicked(new Set())}>
                clear
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(20,28,48,0.12)] bg-white p-3">
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-[rgba(20,28,48,0.6)]">No listings match.</p>
        ) : view === "list" ? (
          <ListingTable rows={shown} picked={picked} onToggle={toggle} onToggleAll={toggleAll} onOpen={setOpenId} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((l) => (
              <ListingCard key={l.id} l={l} on={picked.has(l.id)} onToggle={() => toggle(l.id)} onOpen={() => setOpenId(l.id)} />
            ))}
          </div>
        )}
      </div>

      {open && (
        <Drawer title="Listing details" onClose={() => setOpenId(null)}>
          <ListingDetail l={open} agentIndex={agentIndex(open)} onBrochure={() => setBrochure([open])} />
        </Drawer>
      )}
      {brochure && <BrochureStudio listings={brochure} initialAgent={agentIndex(brochure[0])} onClose={() => setBrochure(null)} />}
    </div>
  );
}
