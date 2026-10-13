"use client";

/**
 * Event details — the pop-out. Laid out as the CRM's Figma pages:
 * banner, type kicker, title, stage chips + place, next date; then About / Links / Schedule /
 * Location / Registration / Dates on the left and At a glance / Contact / Record on the right.
 * The banner is the generated artwork (no uploaded banner any more).
 */
import { Download, EyeOff, Eye, Loader2, FileText, Globe, Map as MapIcon, MapPin, PencilLine, Radio, Ticket, Video } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logGeneratedPost } from "@/lib/store";
import { Artwork, ScaledArt } from "./artwork";
import { artworkBlob, download } from "./exporter";
import { ART_SIZES } from "./types";
import { fmtDate, fmtDateTime, fmtDay, isPast, nextOccurrence, occurrences, placeLine, timeRange, weekdayList } from "./format";
import type { EventRecord } from "./types";
import { CopyButton, Panel, Pill, Rows } from "./ui";

function LinkChip({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-sm hover:bg-secondary [&_svg]:size-3.5">
      {icon}
      {children}
    </a>
  );
}

/** Downloads the 9:16 flyer, drawn at full size off-screen (it isn't shown on the page). */
function FlyerButton({ e }: { e: EventRecord }) {
  const box = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const { w, h } = ART_SIZES.flyer;
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        title={error ? "The flyer couldn’t be made — try again." : "9:16 story flyer, 1080 × 1920"}
        onClick={async () => {
          const node = box.current?.firstElementChild as HTMLElement | null;
          if (!node) return;
          setBusy(true);
          setError(false);
          try {
            const blob = await artworkBlob(node, w, h, 1);
            download(blob, `${e.slug || "event"}-flyer.png`);
            logGeneratedPost({ tool: "events", templateId: `events-flyer-${e.artwork.design}`, subject: e.title, source: "demo", format: "flyer", bytes: blob.size });
          } catch {
            setError(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Download />} Flyer 9:16
      </Button>
      <div ref={box} aria-hidden style={{ position: "fixed", left: -20000, top: 0, width: w, height: h, pointerEvents: "none" }}>
        <Artwork e={e} kind="flyer" />
      </div>
    </>
  );
}

export function StageChips({ e }: { e: EventRecord }) {
  return (
    <>
      {e.cancelled ? <Pill tone="danger">Cancelled</Pill> : <Pill tone="info">Scheduled</Pill>}
      {isPast(e) && <Pill>Past</Pill>}
    </>
  );
}

export function EventDetail({ e, onEdit, onTogglePublish }: { e: EventRecord; onEdit: () => void; onTogglePublish: () => void }) {
  const next = nextOccurrence(e);
  const days = occurrences(e);
  const published = e.status === "Published";
  const links = [
    e.registrationUrl && <LinkChip key="r" href={e.registrationUrl} icon={<Ticket />}>Register</LinkChip>,
    e.mapsUrl && <LinkChip key="m" href={e.mapsUrl} icon={<MapIcon />}>Map</LinkChip>,
    e.livestream && <LinkChip key="l" href={e.livestream} icon={<Radio />}>Livestream</LinkChip>,
    e.website && <LinkChip key="w" href={e.website} icon={<Globe />}>Website</LinkChip>,
    e.promoVideo && <LinkChip key="v" href={e.promoVideo} icon={<Video />}>Promo video</LinkChip>,
    e.brochure && <LinkChip key="b" href={e.brochure} icon={<FileText />}>Brochure</LinkChip>,
  ].filter(Boolean);

  return (
    <div className="space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="kicker">Public URL key</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm">{e.slug} <CopyButton text={e.slug} label="URL key" /></p>
          </div>
          <div>
            <p className="kicker">Event ID</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-xs">{e.id} <CopyButton text={e.id} label="event ID" /></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FlyerButton e={e} />
          <Button variant="secondary" size="sm" onClick={onTogglePublish}>
            {published ? <><EyeOff /> Unpublish</> : <><Eye /> Publish</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <PencilLine /> Edit
          </Button>
        </div>
      </div>

      <ScaledArt e={e} kind="banner" />

      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div className="min-w-0 max-w-3xl">
          <p className="kicker">{e.types.join(" · ") || "Event"}</p>
          <h1 className="mt-1 text-[28px] leading-[1.05] sm:text-[40px] tracking-[-0.02em] text-foreground/80">{e.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Pill>{e.status}</Pill>
            <StageChips e={e} />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-muted-foreground" /> {placeLine(e) || "No location"}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-h1 text-foreground/80">{next ? fmtDay(next.day) : fmtDate(e.starts)}</p>
          <p className="text-xs text-muted-foreground">{next ? "Next date" : "Starts"}</p>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {e.description && (
            <Panel title="About">
              <p className="px-4 py-3 text-sm leading-relaxed whitespace-pre-line">{e.description}</p>
            </Panel>
          )}
          <Panel title="Links">
            <div className="flex flex-wrap gap-2 px-4 py-3">{links.length ? links : <span className="text-sm text-muted-foreground">No links yet.</span>}</div>
          </Panel>
          <Panel title="Schedule">
            <Rows
              rows={[
                ["Starts", fmtDateTime(e.starts)],
                ["Ends", fmtDateTime(e.ends)],
                ["Timezone", e.timezone],
                ["Repeats", e.repeats.length ? `Every ${weekdayList(e.repeats)}` : "Does not repeat"],
                ...(next ? ([["Next date", `${fmtDay(next.day)}, ${next.from}`]] as [string, string][]) : []),
                ["Last date", days.length ? `${fmtDay(days[days.length - 1].day)}, ${days[days.length - 1].from}` : "—"],
              ]}
            />
          </Panel>
          <Panel title="Location">
            <Rows
              rows={
                e.online
                  ? [["Venue", "Online Link"]]
                  : ([
                      ["Venue", e.venue || "—"],
                      ["Address", [e.address2, e.address1, e.city].filter(Boolean).join(", ") || "—"],
                      ...(e.country && e.country !== "United Arab Emirates" ? [["Country", e.country]] : []),
                      ...(e.project ? [["Project", e.project]] : []),
                      ...(e.developer ? [["Developer", e.developer]] : []),
                    ] as [string, string][])
              }
            />
          </Panel>
          <Panel title="Registration">
            <Rows rows={[["Registration", e.registrationRequired ? "Required" : "Not required"], ...(e.capacity ? ([["Capacity", e.capacity]] as [string, string][]) : [])]} />
          </Panel>
          <Panel title="Dates">
            <ul className="space-y-2 px-4 py-3">
              {days.slice(0, 8).map((o) => (
                <li key={+o.day} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>
                    <span className="block font-normal">{fmtDay(o.day, true)}</span>
                    <span className="text-xs text-muted-foreground">{o.from} – {o.to}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{e.cancelled ? "Cancelled" : ""}</span>
                </li>
              ))}
              {days.length > 8 && <li className="text-xs text-muted-foreground">+{days.length - 8} more dates</li>}
            </ul>
            <p className="px-4 pb-3 text-xs text-muted-foreground">
              {e.repeats.length ? "Recurring" : "Single run"} · {days.length} {days.length === 1 ? "date" : "dates"} · times in {e.timezone} · {timeRange(days[0]?.from ?? "", days[0]?.to ?? "")}
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="At a glance">
            <Rows
              rows={[
                ["Type", e.types.join(", ") || "—"],
                ["Status", <Pill key="s">{e.status}</Pill>],
                ["Stage", e.cancelled ? "Cancelled" : "Scheduled"],
                ["Audience", e.audience],
                ["Public site", published && e.audience === "Public" ? "Visible" : "Hidden"],
                ["First published", e.firstPublished ? fmtDateTime(e.firstPublished) : "—"],
                ["Featured", e.featured ? "Yes" : "No"],
              ]}
            />
          </Panel>
          {(e.contactName || e.contactPhone || e.contactEmail) && (
            <Panel title="Contact">
              <Rows
                rows={[
                  ...(e.contactName ? ([["Name", e.contactName]] as [string, ReactNode][]) : []),
                  ...(e.contactPhone ? ([["Phone", <span key="p" className="inline-flex items-center gap-1.5">{e.contactPhone} <CopyButton text={e.contactPhone} label="phone" /></span>]] as [string, ReactNode][]) : []),
                  ...(e.contactEmail ? ([["Email", e.contactEmail]] as [string, ReactNode][]) : []),
                ]}
              />
            </Panel>
          )}
          <Panel title="Record">
            <Rows
              rows={[
                ["Created", e.created ? fmtDateTime(e.created) : "—"],
                ["Created by", e.createdBy || "—"],
                ["Updated", e.updated ? fmtDateTime(e.updated) : "—"],
                ["Updated by", e.updatedBy || "—"],
              ]}
            />
          </Panel>
          <Panel title="Thumbnail">
            <div className="p-3">
              <ScaledArt e={e} kind="thumb" />
              <p className="mt-2 text-xs text-muted-foreground">As shown on the events grid.</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
