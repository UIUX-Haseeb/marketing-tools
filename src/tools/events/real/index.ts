/**
 * The events as they are in the portal (portal.prov.ae › Marketing › Events), copied field for
 * field on 16 Oct 2026 — portal-events.json — and the pictures that were uploaded with them
 * (public/tools/events/real/, ≤1600 px). Nothing is tidied: ALL CAPS titles, "TBA" venues, dates
 * typed into the venue, placeholder times, poster images with their own text all stay as they
 * are, because that's what the artwork has to cope with. These are the stage page's events.
 *
 * Mapping: the portal's one "Address" line is split back into address / city / country, the
 * card's text line (the portal's short description) becomes `shortDescription`, the Map /
 * Register / Livestream links go to their fields. No developer is linked in the portal.
 */
import { blankEvent, newArtwork, slugify } from "../data";
import type { EventRecord, EventType } from "../types";
import RAW from "./portal-events.json";

type Raw = {
  id: string; slug: string; type: string; title: string; sub: string; staff: boolean; feat: boolean;
  s: string; e: string; tz?: string; venue: string; addr: string; reg: boolean; links: string[][];
  cName: string; cPhone: string; cEmail: string; created: string; by: string; updated?: string; upBy?: string; pub?: string;
  img: string; about: string;
};

const TYPE: Record<string, EventType> = {
  BRIEFING: "Briefing", "OPEN HOUSE": "Open House", "PROJECT LAUNCH": "Project Launch", WEBINAR: "Webinar",
  "SALES EVENT": "Sales Event", ROADSHOW: "Roadshow", EXHIBITION: "Exhibition",
};
const MON: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Sept: "09", Oct: "10", Nov: "11", Dec: "12" };

/** "19 Oct 2026, 17:00" → "2026-10-19T17:00" */
function iso(s: string) {
  const m = /^(\d{1,2}) (\w+) (\d{4}),? ?(\d{2}:\d{2})?/.exec(s || "");
  return m ? `${m[3]}-${MON[m[2]] ?? "01"}-${m[1].padStart(2, "0")}T${m[4] ?? "00:00"}` : "";
}

/** The portal shows address, city and country as one line; split it back. */
function splitAddress(a: string) {
  const parts = (a || "").split(",").map((s) => s.trim()).filter(Boolean);
  let country = "United Arab Emirates";
  if (parts.length && /emirates|uae|saudi|kingdom/i.test(parts[parts.length - 1])) country = parts.pop()!;
  const city = parts.pop() ?? "";
  return { address1: parts.join(", "), city, country };
}

function toRecord(r: Raw): EventRecord {
  const link = (label: string) => r.links.find((l) => l[0] === label)?.[1] ?? "";
  const { address1, city, country } = splitAddress(r.addr);
  const updated = r.updated ? iso(r.updated) : iso(r.created);
  return {
    ...blankEvent(),
    id: r.id,
    slug: r.slug || slugify(r.title),
    title: r.title,
    types: [TYPE[r.type] ?? "Briefing"],
    status: "Published",
    audience: r.staff ? "Internal (staff only)" : "Public",
    shortDescription: r.sub,
    description: r.about,
    featured: r.feat,
    starts: iso(r.s),
    ends: iso(r.e),
    timezone: r.tz === "UTC" ? "UTC" : "Asia/Dubai",
    venue: r.venue,
    city,
    address1,
    country,
    online: /^online link$/i.test(r.venue),
    mapsUrl: link("Map"),
    registrationUrl: link("Register"),
    livestream: link("Livestream"),
    registrationRequired: r.reg,
    contactName: r.cName,
    contactPhone: r.cPhone,
    contactEmail: r.cEmail,
    created: iso(r.created),
    createdBy: r.by,
    updated,
    updatedBy: r.upBy ?? r.by,
    firstPublished: iso(r.pub ?? r.created),
    artwork: newArtwork(r.img ? `/tools/events/real/${r.img}` : ""),
  };
}

export const REAL_EVENTS: EventRecord[] = (RAW as Raw[]).map(toRecord);
