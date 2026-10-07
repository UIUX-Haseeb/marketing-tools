/**
 * PRIMARY source for Just Sold: an off-plan project sold by the developer. The project comes
 * from the same saved project database the Project Booklet uses (`project-booklet/projects`,
 * which stands in for the CRM's projects); this file turns one project + one of its unit types
 * into the listing fields. Every field stays editable after it is filled.
 */
import { PROJECTS, SOURCES, type SavedProject } from "@/tools/project-booklet/projects";
import type { ProjectData } from "@/tools/project-booklet/types";
import { LISTING_LIMITS } from "./listing";

export { PROJECTS as PRIMARY_PROJECTS, SOURCES as PRIMARY_SOURCES };
export type { SavedProject };

export type PrimaryUnit = { label: string; bedrooms: string; propertyType: string; price: string };

const detail = (d: ProjectData, label: string) => d.details.find((x) => x.label.toLowerCase() === label.toLowerCase())?.value.trim() ?? "";
const KINDS = ["Penthouse", "Townhouse", "Duplex", "Apartment", "Villa", "Office", "Retail Unit", "Unit"];

/** "Apartments" / "Office, Retail Units" → "Apartment" / "Office". */
function singularType(text: string) {
  const first = text.split(",")[0].trim();
  for (const k of KINDS) if (new RegExp(`\\b${k}s?\\b`, "i").test(first)) return k;
  return first.replace(/s$/i, "");
}

/** The project's unit types as listing fields; the project itself if it lists none. */
export function unitsOf(d: ProjectData): PrimaryUnit[] {
  const fallbackType = singularType(detail(d, "Property Types")) || "Apartment";
  const startingPrice = detail(d, "Starting Price");
  const units = d.unitTypes
    .map((u) => {
      const bed = u.name.match(/(\d+)\s*-?\s*Bed/i)?.[1] ?? "";
      const studio = /studio/i.test(u.name);
      const kind = KINDS.find((k) => new RegExp(`\\b${k}s?\\b`, "i").test(u.name));
      return {
        label: u.price.startsWith("AED") ? `${u.name} · ${u.price}` : u.name,
        bedrooms: bed,
        propertyType: studio ? `Studio ${kind ?? fallbackType}` : kind ?? fallbackType,
        price: u.price.startsWith("AED") ? u.price : startingPrice,
      };
    })
    .filter((u) => !/type$/i.test(u.label.split(" · ")[0]));
  return units.length ? units : [{ label: "Whole project", bedrooms: "", propertyType: fallbackType, price: startingPrice }];
}

/** "Binghatti Spectre, Al Jaddaf" — or "{name}, {city}" when that would be over the field limit. */
export function locationOf(d: ProjectData) {
  const full = `${d.name}, ${d.location}`;
  return full.length <= LISTING_LIMITS.location ? full : `${d.name}, ${d.city}`;
}

/** Every project picture that can be the post photo: gallery first (portrait-friendly), then the hero banner. */
export function picturesOf(d: ProjectData) {
  return [...new Set([...d.gallery, d.heroImage].filter(Boolean))];
}
