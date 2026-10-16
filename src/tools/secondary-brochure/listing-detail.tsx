"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * Listing details — the pop-out, laid out like the portal's: reference + Brochure button, a photo
 * mosaic, title and price, place + developer, beds / baths / size boxes, description, amenities
 * and details on the left; the agent and the brochure's cover on the right.
 */
import { Bath, BedDouble, FileText, Hash, LandPlot, MapPin, Ruler } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EMPLOYEES } from "@/lib/demo/employees";
import { agentFrom } from "./agent";
import { Scaled } from "./brochure-studio";
import { money, placeLine, priceTerm, specRows, sqft } from "./format";
import { buildBrochure } from "./pages";
import { defaultSlots, type Listing } from "./types";
import { CopyButton, Panel, Pill, Rows } from "./ui";

function Box({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-3 text-center [&_svg]:size-4 [&_svg]:text-muted-foreground">
      {icon}
      <span className="text-lg leading-tight font-semibold text-[#2f4960]">{value}</span>
      <span className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

export function ListingDetail({ l, agentIndex, onBrochure }: { l: Listing; agentIndex: number; onBrochure: () => void }) {
  const agent = agentFrom(EMPLOYEES[agentIndex % EMPLOYEES.length]);
  const cover = buildBrochure("a", { items: [{ l, slots: defaultSlots(l), qr: null }], agent }).pages[0];
  const more = l.photos.length - 3;
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-6 text-xs">
          <div>
            <p className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">Reference</p>
            <p className="flex items-center gap-1.5 font-medium">
              {l.ref} <CopyButton text={l.ref} label="reference" />
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">Listing ID</p>
            <p className="flex items-center gap-1.5 truncate font-mono text-[11px]">
              {l.id} <CopyButton text={l.id} label="listing ID" />
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onBrochure}>
          <FileText /> Brochure
        </Button>
      </div>

      <div className="grid h-72 grid-cols-[2fr_1fr] gap-2 overflow-hidden rounded-xl">
        <div className="relative">
          <img src={l.photos[0]} alt="" className="size-full object-cover" />
          <span className="absolute top-2 left-2 rounded-full bg-[#28c76f] px-2 py-0.5 text-[11px] font-medium text-white">{l.status}</span>
        </div>
        <div className="grid grid-rows-2 gap-2">
          <img src={l.photos[1] ?? l.photos[0]} alt="" className="size-full object-cover" />
          <div className="relative">
            <img src={l.photos[2] ?? l.photos[0]} alt="" className="size-full object-cover" />
            {more > 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-semibold text-white">+{more}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-2xl leading-tight font-bold tracking-[-0.02em] text-[rgba(20,28,48,0.9)]">{l.title}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {placeLine(l, true)}
            {l.developer && <Pill>{l.developer}</Pill>}
            {l.exclusive && <Pill tone="info">Exclusive</Pill>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-[-0.02em] text-[#2f4960]">{money(l)}</p>
          <p className="text-xs text-muted-foreground">{l.offering === "Rent" ? `Residential rent${priceTerm(l) ? ` · ${priceTerm(l)}` : ""}` : "Residential sale"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <Box icon={<BedDouble />} value={/studio/i.test(l.beds) ? "Studio" : l.beds} label="Bedrooms" />
            <Box icon={<Bath />} value={l.baths} label="Bathrooms" />
            <Box icon={<Ruler />} value={sqft(l.size) || "—"} label="Size" />
            {l.plot && <Box icon={<LandPlot />} value={sqft(l.plot)} label="Plot" />}
          </div>
          <Panel title="Description">
            <p className="px-4 py-3 text-sm leading-relaxed whitespace-pre-line">{l.description}</p>
          </Panel>
          {l.amenities.length > 0 && (
            <Panel title={`Amenities · ${l.amenities.length}`}>
              <div className="flex flex-wrap gap-1.5 px-4 py-3">
                {l.amenities.map((a) => (
                  <Pill key={a}>{a}</Pill>
                ))}
              </div>
            </Panel>
          )}
        </div>
        <div className="space-y-4">
          <Panel title="Agent">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="size-11 shrink-0 overflow-hidden rounded-full bg-secondary">{agent.photo && <img src={agent.photo} alt="" className="size-full object-cover" />}</span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{agent.name}</p>
                <p className="truncate text-xs text-muted-foreground">{agent.position}</p>
              </div>
            </div>
          </Panel>
          <Panel title="Brochure">
            <button type="button" onClick={onBrochure} className="block w-full p-3 text-left">
              <Scaled className="rounded-md">{cover.node}</Scaled>
              <span className="mt-2 block text-xs text-muted-foreground">4:5 PDF made from this listing — this page plus “Ask Us About”. Select several listings on the list to put them in one brochure.</span>
            </button>
          </Panel>
          <Panel title="Details">
            <Rows rows={specRows(l).map((r) => [r.label, r.label === "Reference" ? <span className="inline-flex items-center gap-1"><Hash className="size-3" />{r.value.replace(/^#/, "")}</span> : r.value])} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
