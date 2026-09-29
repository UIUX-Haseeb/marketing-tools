/**
 * The local project database (stands in for the CRM's projects), in two sources: Dubai Offplan (offplan-dubai.com)
 * and Abu Dhabi Offplan (abudhabipropertyhub.com). Each JSON is one project page as the parser
 * (scrape.ts) read it, with every picture copied to public/tools/project-booklet/projects/<id>/ and
 * `sources` saying where each copy came from. Made by `npm run snapshot` — re-run it rather than
 * editing the JSON. The lists below are the order the Source choice and the project dropdown show.
 */
import type { ProjectData } from "../types";
import binghattiSpectre from "./binghatti-spectre-al-jaddaf.json";
import samanaBusinessHub from "./samana-business-hub-samana-developers-jebel-ali.json";
import talayMarsa from "./talay-marsa-aldar-properties-al-saadiyat-island.json";
import theArchive from "./the-archive-imtiaz-developments-dubailand.json";
import wadeemGardens from "./wadeem-gardens-modon-properties-hudayriyat-island.json";
import yasRivaReserve from "./yas-riva-reserve-aldar-proerties-yas-island.json";

export type SourceId = "dubai" | "abu-dhabi";

type SavedRecord = {
  id: string;
  /** YYYY-MM-DD */
  savedOn: string;
  /** Saved file name → the site's original picture. */
  sources: Record<string, string>;
  data: ProjectData;
};

export type SavedProject = SavedRecord & { source: SourceId };

/** Where the saved projects come from: the Source choice above the project dropdown. */
export const SOURCES: { id: SourceId; label: string; site: string; projects: SavedRecord[] }[] = [
  { id: "dubai", label: "Dubai Offplan", site: "offplan-dubai.com", projects: [binghattiSpectre, theArchive, samanaBusinessHub] },
  { id: "abu-dhabi", label: "Abu Dhabi Offplan", site: "abudhabipropertyhub.com", projects: [wadeemGardens, yasRivaReserve, talayMarsa] },
];

export const PROJECTS: SavedProject[] = SOURCES.flatMap((s) => s.projects.map((p) => ({ ...p, source: s.id })));
