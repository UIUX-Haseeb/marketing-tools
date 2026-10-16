/**
 * The event record — the fields of the CRM's Add event form (Details, Schedule, Location,
 * Links & media, Registration, Contact) plus `artwork`, the new part: how the banner and the
 * grid thumbnail are drawn from those fields.
 */

export const EVENT_TYPES = ["Open House", "Project Launch", "Roadshow", "Briefing", "Webinar", "Exhibition", "Sales Event"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const STATUSES = ["Draft", "Published", "Unpublished"] as const;
export type EventStatus = (typeof STATUSES)[number];

export const AUDIENCES = ["Public", "Internal (staff only)"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const TIMEZONES = ["Asia/Dubai", "Asia/Riyadh", "Europe/London", "Asia/Singapore", "UTC"] as const;

/** 0 = Mon … 6 = Sun, as the Schedule tab's "Repeats on" row. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** How a photo sits in its frame: `zoom` 1–3 (the Size slider), `x`/`y` 0–1 (drag). */
export type Adjust = { zoom: number; x: number; y: number };
export const NO_ADJUST: Adjust = { zoom: 1, x: 0.5, y: 0.5 };

export type ArtDesign = "a" | "b" | "c";
export const ART_DESIGNS: { value: ArtDesign; label: string }[] = [
  { value: "a", label: "A · Navy panel" },
  { value: "b", label: "B · Full photo" },
  { value: "c", label: "C · Paper" },
];

export type ArtKind = "banner" | "thumb" | "flyer";
export const ART_SIZES: Record<ArtKind, { w: number; h: number; label: string; use: string }> = {
  banner: { w: 1143, h: 420, label: "Banner", use: "Inside page · 1143 × 420" },
  thumb: { w: 443, h: 243, label: "Thumbnail", use: "Grid card · 443 × 243" },
  flyer: { w: 1080, h: 1920, label: "Flyer", use: "Story flyer 9:16 · 1080 × 1920" },
};

export interface EventArtwork {
  design: ArtDesign;
  /** Picture URL (a library photo, or a blob: upload in this session). Empty = no photo. */
  photo: string;
  /** Per artwork; missing = centred, no zoom (events saved before the flyer have no `flyer`). */
  adjust: Partial<Record<ArtKind, Adjust>>;
  /** Optional lines on the banner. Title, type, date are always shown. */
  show: { subtitle: boolean; time: boolean; location: boolean };
  /**
   * How the photo meets its frame: "fill" crops it to the frame, "whole" shows all of it over a
   * blurred copy of itself (for posters with their own text), "auto" (default) picks "whole" when
   * filling would cut away more than a third of the picture.
   */
  fit?: "auto" | "fill" | "whole";
  /** Titles typed mostly in capitals are set in Title Case on the artwork (default on). */
  tidyCaps?: boolean;
  /**
   * Developer logo, on the types in LOGO_TYPES: "" = the linked developer's logo from the
   * library (if it has one), "none" = no logo, otherwise an uploaded logo (data URL).
   */
  logo?: string;
}

/** Event types whose artwork carries the developer's logo next to Provident's. */
export const LOGO_TYPES: EventType[] = ["Project Launch", "Webinar", "Briefing", "Exhibition", "Open House"];

export interface EventRecord {
  id: string;
  slug: string;
  // Details
  title: string;
  subtitle: string;
  types: EventType[];
  status: EventStatus;
  audience: Audience;
  shortDescription: string;
  description: string;
  featured: boolean;
  cancelled?: boolean;
  // Schedule — local times in the event's timezone, "YYYY-MM-DDTHH:mm"
  starts: string;
  ends: string;
  timezone: string;
  /** Weekdays it runs on inside starts–ends (empty = every day). */
  repeats: number[];
  dailyStart: string;
  dailyEnd: string;
  // Location
  venue: string;
  city: string;
  address1: string;
  address2: string;
  country: string;
  mapsUrl: string;
  developer: string;
  project: string;
  community: string;
  /** Online event (a webinar): the location reads "Online". */
  online: boolean;
  // Links & media
  registrationUrl: string;
  website: string;
  promoVideo: string;
  livestream: string;
  brochure: string;
  mediaLinks: { label: string; url: string }[];
  artwork: EventArtwork;
  // Registration
  registrationRequired: boolean;
  capacity: string;
  // Contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  // Record
  created: string;
  createdBy: string;
  updated: string;
  updatedBy: string;
  firstPublished: string;
}
