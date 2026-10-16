/**
 * Demo photo library for the artwork picker — stands in for the CRM's project media. Pictures
 * are same-origin files (public/tools/events/photos/) so html-to-image can draw them into a download.
 * When the event's Location → Project matches, that project's photos are offered first.
 */
export type LibraryPhoto = { src: string; label: string; project: string };

export const PHOTOS: LibraryPhoto[] = [
  { src: "/tools/events/photos/archive-01.jpg", label: "The Archive", project: "The Archive" },
  { src: "/tools/events/photos/archive-03.jpg", label: "The Archive · interior", project: "The Archive" },
  { src: "/tools/events/photos/spectre-hero.jpg", label: "Binghatti Spectre", project: "Binghatti Spectre" },
  { src: "/tools/events/photos/spectre-02.jpg", label: "Binghatti Spectre · facade", project: "Binghatti Spectre" },
  { src: "/tools/events/photos/wadeem-01.jpg", label: "Wadeem Gardens", project: "Wadeem Gardens" },
  { src: "/tools/events/photos/wadeem-03.jpg", label: "Wadeem Gardens · villas", project: "Wadeem Gardens" },
  { src: "/tools/events/photos/yasriva-01.jpg", label: "Yas Riva Reserve", project: "Yas Riva Reserve" },
  { src: "/tools/events/photos/yasriva-04.jpg", label: "Yas Riva Reserve · pool", project: "Yas Riva Reserve" },
  { src: "/tools/events/photos/talay-01.jpg", label: "Talay Marsa", project: "Talay Marsa" },
  { src: "/tools/events/photos/talay-05.jpg", label: "Talay Marsa · beach", project: "Talay Marsa" },
  { src: "/tools/events/photos/samana-01.jpg", label: "Samana Business Hub", project: "Samana Business Hub" },
  { src: "/tools/events/photos/samana-hero.jpg", label: "Samana Business Hub · wide", project: "Samana Business Hub" },
];

export const PROJECTS = Array.from(new Set(PHOTOS.map((p) => p.project)));
export const DEVELOPERS = ["Emaar", "Beyond", "Meeras", "Imtiaz", "Azizi", "Aldar", "Modon", "Binghatti", "Samana", "Native Properties"];

/**
 * Demo developer-logo library (public/tools/events/developers/<key>-white|navy.svg, recoloured from
 * the brand files so they print white on navy and navy on paper). In the CRM: the developer
 * record's logo.
 */
export const DEVELOPER_LOGOS: Record<string, string> = { Emaar: "emaar", Beyond: "beyond", Imtiaz: "imtiaz", Meeras: "meeras" };
export const developerLogoSrc = (key: string, tone: "white" | "navy") => `/tools/events/developers/${key}-${tone}.svg`;

/**
 * The portal links no developer to its events, but the developer is usually in the title
 * ("THE OASIS BY EMAAR", "KORE BY IMTIAZ", "BEYOND BRIEFING"). Returns the library developer
 * named in the text as a whole word, if any.
 */
export function developerInText(text: string) {
  return Object.keys(DEVELOPER_LOGOS).find((d) => new RegExp(`(^|[^a-z])${d}([^a-z]|$)`, "i").test(text)) ?? "";
}
export const COMMUNITIES = ["Dubai Hills Estate", "Jumeirah Village Triangle", "The Greens", "Al Jaddaf", "Dubailand", "Hudayriyat Island", "Yas Island", "Saadiyat Island", "Jebel Ali", "Muwaileh"];
export const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "United Kingdom", "Singapore"];

/** Library photos with the event's project first. */
export function photosFor(project: string) {
  return [...PHOTOS.filter((p) => p.project === project), ...PHOTOS.filter((p) => p.project !== project)];
}
