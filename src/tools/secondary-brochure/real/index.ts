/**
 * Thirteen company listings from the portal (portal.prov.ae › Listings › Company Listings), copied
 * field for field — ten residential on 16 Oct 2026, three commercial (co-working space, business
 * centre; filtered by property type) on 19 Oct 2026 — portal-listings.json — with up to 14 of their uploaded pictures
 * (the watermarked copies, ≤1600 px) in public/tools/secondary-brochure/real/<reference>/. Picked
 * for spread: rent and sale, studio to five-bed villa, AED 70k to AED 25M, one with a floor plan.
 * Left out on purpose: the agent, owner, unit number and permit records — the brochure's agent
 * comes from the demo employee list.
 *
 * Nothing is tidied in the JSON. The description is free text the agents type, so it is split
 * here: paragraphs → intro, short lines → features, a "Location / Community / Building" heading
 * → the area section; company / RERA / price lines are dropped (the brochure prints those itself).
 */
import type { Listing, Offering, Section } from "../types";
import RAW from "./portal-listings.json";

type Raw = {
  id: string; referenceNo: string; title: string; websiteTitle: string; description: string;
  city: string; community: string; subCommunity: string | null; tower: string | null;
  size: string | null; plotSize: string | null; price: string; currencyCode: string;
  offeringTypeName: string; categoryName: string; developerName: string | null; propertyTypeName: string;
  bedroomName: string; bathroomName: string; furnishingTypeName: string | null; rentFrequencyName: string | null;
  amenityNames: string[]; parking: number | null; cheques: number | null; isExclusive: boolean;
  availabilityDate: string | null; propertyStatusName?: string; photos: string[]; floorplan: string | null;
};

const DIR = "/tools/secondary-brochure/real";

/* ── description → intro / features / area ─────────────────────────────── */

const LEGAL = /^(company name|rera|orn\b|brn\b|permit|trakheesi)/i;
const PRICE = /\b(selling|asking|rent(al)?|sale)\s+price\b|^price\s*:/i;
const CTA = /contact us|book a viewing|arrange a viewing|for (more|further) (information|details)|call us|get in touch|don.t miss/i;
const AREA = /locat|communit|building|neighbou?rhood|about |nearby|access|connectivity|surround/i;
const BULLET = /^\s*(?:[-*•–·]|\d+[.)])\s*/;

const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

function splitDescription(text: string): { intro: string[]; features: string[]; sections: Section[] } {
  const sections: Section[] = [];
  let cur: Section = { title: "", paras: [], items: [] };
  for (const rawLine of text.split(/\r?\n/)) {
    const bulleted = BULLET.test(rawLine);
    const line = clean(rawLine.replace(BULLET, ""));
    if (!line || LEGAL.test(line) || PRICE.test(line)) continue;
    const heading = /:-?$/.test(line) || (/^\*\*.+\*\*:?$/.test(rawLine.trim()) && !bulleted);
    if (heading) {
      if (cur.title || cur.paras.length || cur.items.length) sections.push(cur);
      cur = { title: line.replace(/:-?$/, "").trim(), paras: [], items: [] };
    } else if (bulleted || (line.length <= 64 && !/[.!?]$/.test(line))) {
      cur.items.push(line.replace(/[.;,]$/, ""));
    } else {
      cur.paras.push(line);
    }
  }
  sections.push(cur);

  const untitled = sections.filter((s) => !s.title || !AREA.test(s.title));
  const intro = untitled.flatMap((s) => s.paras).filter((p) => !CTA.test(p));
  // The first short line often repeats the listing title with its separators ("Upgraded I 4- Bedroom I Vacant").
  const features = [...new Set(untitled.flatMap((s) => s.items).filter((i) => !/ [I|] /.test(i) && !CTA.test(i)))];
  return { intro, features, sections: sections.filter((s) => s.title && AREA.test(s.title)) };
}

/* ── the rest of the mapping ───────────────────────────────────────────── */

const num = (s: string | null) => (s == null || s === "" ? null : Math.round(parseFloat(s) * 100) / 100 || null);

/** "Fully Furnished | Ready To Move | Mid Floor", "Type 12 I Lake View I Upgraded" → tags. */
export function titleTags(title: string) {
  return title
    .split(/\s+[|I]\s+|\s*\|\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function toListing(r: Raw): Listing {
  const commercial = /commercial/i.test(r.offeringTypeName);
  const { intro, features, sections } = splitDescription(r.description ?? "");
  const area: Section | null = sections.length
    ? { title: sections[0].title, paras: sections.flatMap((s) => s.paras).filter((p) => !CTA.test(p)), items: sections.flatMap((s) => s.items) }
    : null;
  const folder = `${DIR}/${r.referenceNo}`;
  return {
    id: r.id,
    ref: r.referenceNo,
    title: r.title,
    tags: titleTags(r.title),
    offering: (/rent/i.test(r.offeringTypeName) ? "Rent" : "Sale") as Offering,
    segment: /commercial/i.test(r.offeringTypeName) ? "Commercial" : "Residential",
    offeringName: r.offeringTypeName,
    category: r.categoryName,
    propertyType: r.propertyTypeName.replace(/^Residential\s+/i, ""),
    beds: commercial ? "" : r.bedroomName ?? "",
    baths: commercial ? "" : r.bathroomName ?? "",
    size: num(r.size),
    plot: num(r.plotSize),
    price: parseFloat(r.price) || 0,
    currency: r.currencyCode || "AED",
    rentFrequency: r.rentFrequencyName,
    cheques: r.cheques,
    furnishing: r.furnishingTypeName,
    developer: r.developerName,
    city: r.city,
    community: r.community,
    subCommunity: r.subCommunity,
    tower: r.tower,
    amenities: r.amenityNames ?? [],
    parking: r.parking,
    availability: r.availabilityDate,
    exclusive: !!r.isExclusive,
    status: r.propertyStatusName ?? "Approved",
    photos: r.photos.map((p) => `${folder}/${p}`),
    floorplan: r.floorplan ? `${folder}/${r.floorplan}` : null,
    description: r.description ?? "",
    intro,
    features,
    area: area && (area.paras.length || area.items.length) ? area : null,
  };
}

export const LISTINGS: Listing[] = (RAW as Raw[]).map(toListing);
