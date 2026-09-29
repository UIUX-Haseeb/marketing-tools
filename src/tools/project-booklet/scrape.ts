/**
 * Project page → ProjectData, for the two sites the saved projects come from: offplan-dubai.com
 * (Dubai) and abudhabipropertyhub.com (Abu Dhabi).
 *
 * Every project page on both sites is the same WordPress template ("pdp-*" classes), so this maps
 * each booklet field to one selector. The content still varies from page to page — highlights
 * come as a list on some projects and as one comma-separated paragraph on others, distances are
 * written "12 minutes – Place" or "Place – 5 Minutes", some pages have no developer section —
 * and the helpers below normalise those differences. Used by scripts/snapshot-projects.mjs,
 * which saves projects (and their pictures) into projects/ for the tool to use; the tool itself
 * doesn't read pages. Plain erasable TypeScript with no local imports, so Node runs it as is.
 */
import { parse, type HTMLElement, type Node } from "node-html-parser";
import type { Distance, Faq, Highlight, Milestone, Pair, ProjectData, Stat, UnitType } from "./types";

/** The sites this reads, and the city each one's projects are in. */
export const SITES = [
  { host: /(^|\.)offplan-dubai\.com$/i, name: "offplan-dubai.com", city: "Dubai" },
  { host: /(^|\.)abudhabipropertyhub\.com$/i, name: "abudhabipropertyhub.com", city: "Abu Dhabi" },
];
export type Site = (typeof SITES)[number];

export const siteOf = (hostname: string): Site | undefined => SITES.find((s) => s.host.test(hostname));

/** Returns the normalised URL, or an error message for the person who pasted it. */
export function checkProjectUrl(raw: string): URL | string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "That doesn’t look like a link. Paste the full address, starting with https://";
  }
  if (!/^https?:$/.test(url.protocol)) return "Paste a web link (https://…).";
  if (!siteOf(url.hostname)) return `Only ${SITES.map((s) => s.name).join(" and ")} project links are supported for now.`;
  url.protocol = "https:";
  url.hash = "";
  return url;
}

export async function fetchProjectHtml(url: URL): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const site = siteOf(url.hostname);
  if (!site || siteOf(new URL(res.url).hostname) !== site) throw new Error(`The link redirected away from ${site?.name ?? "the project site"}.`);
  if (!res.ok) throw new Error(`The project page answered ${res.status}. Check the link and try again.`);
  return res.text();
}

/* ── text helpers ────────────────────────────────────────────────────────── */

const clean = (s: string) =>
  s
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

/** Adds the full stop the site sometimes leaves off. */
const sentence = (s: string) => (s && !/[.!?…:]$/.test(s) ? `${s}.` : s);

/** Element text with <strong>/<b> kept as **bold** and <br> kept as a line break. */
function richText(node: Node): string {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === 3) out += child.text;
    else if (child.nodeType === 1) {
      const el = child as HTMLElement;
      const tag = el.tagName?.toLowerCase();
      if (tag === "br") out += "\n";
      else if (tag === "strong" || tag === "b") out += `**${clean(el.text)}**`;
      else out += richText(el);
    }
  }
  return out;
}

const txt = (el: HTMLElement | null | undefined) => (el ? clean(el.text) : "");

function absolute(src: string, base: string): string {
  if (!src || src.startsWith("data:")) return "";
  try {
    return new URL(src, base).toString();
  } catch {
    return "";
  }
}

const img = (el: HTMLElement | null | undefined, base: string) =>
  el ? absolute(el.getAttribute("data-lazy-src") || el.getAttribute("data-src") || el.getAttribute("src") || "", base) : "";

/** WordPress serves resized copies as name-1024x512.jpg; the booklet wants the original. */
const original = (url: string) => url.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)(?:\?|$))/i, "");

function section(root: HTMLElement, title: string): HTMLElement | null {
  for (const h of root.querySelectorAll("h2.pdp-section__title")) {
    if (clean(h.text).toLowerCase() === title.toLowerCase()) return h.closest("section");
  }
  return null;
}

/** Paragraphs split on <br>, dropping short list-like fragments with no sentence in them. */
function paragraphs(scope: HTMLElement | null, selector: string): string[] {
  if (!scope) return [];
  return scope
    .querySelectorAll(selector)
    .flatMap((p) => richText(p).split("\n"))
    .map(clean)
    .filter((p) => p.length > 0 && (p.length >= 60 || /[.!?]$/.test(p)));
}

/* ── field parsers ───────────────────────────────────────────────────────── */

function parseHighlights(scope: HTMLElement | null): Highlight[] {
  if (!scope) return [];
  const items = scope.querySelectorAll(".pdp-highlights-list li");
  if (items.length) {
    return items
      .map((li) => {
        const strong = li.querySelector("strong, b");
        // Some pages put the dash inside the bold title ("Title –"); it belongs to neither part.
        if (strong) return { title: txt(strong).replace(/[\s–—:\-]+$/, ""), text: sentence(clean(li.text.replace(strong.text, "")).replace(/^[–—:\-\s]+/, "")) };
        // No bold title: "Title – text" / "Title: text", else the whole line is the highlight.
        const line = txt(li);
        const m = line.match(/^(.{2,70}?)\s+[–—-]\s+(.+)$/) ?? line.match(/^([^:]{2,70}):\s+(.+)$/);
        return m ? { title: m[1].trim(), text: sentence(m[2].trim()) } : { title: "", text: sentence(line) };
      })
      .filter((h) => h.title || h.text);
  }
  // Paragraph form: "Title: text., Title: text." / "Sentence., Sentence." / "Title, Title, Title"
  const raw = clean(scope.querySelector(".pdp-highlights-list")?.text ?? "");
  if (!raw) return [];
  const parts = /\.,\s+/.test(raw) ? raw.split(/(?<=\.),\s+/) : raw.split(/,\s+/);
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^([^:]{2,70}):\s+(.+)$/);
      if (m) return { title: m[1].trim(), text: sentence(m[2].trim()) };
      return p.length <= 70 && !/\.$/.test(p) ? { title: p, text: "" } : { title: "", text: sentence(p) };
    });
}

/** The site cuts long developer descriptions with "…"; end on the last full sentence instead. */
function wholeSentences(t: string): string {
  if (!/(?:…|\.\.\.)$/.test(t)) return t;
  const cut = t.replace(/\s*(?:…|\.\.\.)$/, "");
  if (/[.!?]$/.test(cut)) return cut;
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > cut.length * 0.4 ? cut.slice(0, end + 1) : `${cut}…`;
}

function parseDistance(t: string): Distance | null {
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:minutes?|mins?)\b/i);
  if (!m) return null;
  const place = clean(t.replace(m[0], "")).replace(/^[\s–—\-:|,]+|[\s–—\-:|,]+$/g, "");
  return place ? { time: m[1], place } : null;
}

function parseMilestone(step: HTMLElement): Milestone {
  const sub = txt(step.querySelector(".pdp-payment-step__sub"));
  return {
    label: txt(step.querySelector(".pdp-payment-step__title")),
    share: sub.match(/\d+(?:\.\d+)?\s*%/)?.[0].replace(/\s+/g, "") ?? "",
    amount: sub.match(/\(([^)]*)\)/)?.[1]?.trim() ?? "",
  };
}

/** "Explore Floorplans": one accordion item per unit type; area and price are there on some pages. */
function parseUnitTypes(root: HTMLElement): UnitType[] {
  return root
    .querySelectorAll(".floorplan-accordion-item")
    .map((item) => {
      const meta = (re: RegExp) => txt(item.querySelectorAll(".floorplan-meta").find((m) => re.test(txt(m.querySelector(".floorplan-meta-label"))))?.querySelector(".floorplan-meta-value"));
      return { name: txt(item.querySelector(".floorplan-unit-title")) || txt(item.querySelector(".floorplan-header-label")), area: meta(/area|size/i), price: meta(/price/i) };
    })
    .filter((u) => u.name);
}

function parseFaqs(root: HTMLElement): Faq[] {
  return root
    .querySelectorAll(".pdp-faq-item")
    .map((item) => ({ question: txt(item.querySelector(".pdp-faq-question")), answer: txt(item.querySelector(".pdp-faq-answer")) }))
    .filter((f) => f.question && f.answer);
}

/* ── page → data ─────────────────────────────────────────────────────────── */

export function parseProjectHtml(html: string, url: string): ProjectData {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });

  const site = siteOf(new URL(url).hostname);
  const hero = root.querySelector(".pdp-hero");
  const name = txt(hero?.querySelector(".pdp-hero__title"));
  if (!name) throw new Error(`That page doesn’t look like a project page${site ? ` from ${site.name}` : ""}.`);

  const pair = (el: HTMLElement, l: string, v: string): Pair => ({ label: txt(el.querySelector(l)), value: txt(el.querySelector(v)) });
  const details = root.querySelectorAll(".pdp-detail").map((el) => pair(el, ".pdp-detail__label", ".pdp-detail__value"));
  const detail = (label: string) => details.find((d) => d.label.toLowerCase() === label.toLowerCase())?.value ?? "";

  const overview = section(root, "Project Overview");
  const highlights = section(root, "Project Highlights");
  const amenities = section(root, "Amenities");
  const location = section(root, "Location & Connectivity");
  const investment = root.querySelector(".pdp-investment");
  const developer = root.querySelector(".pdp-developer");
  const area = root.querySelector(".pdp-area");

  const gallery = Array.from(
    new Set(root.querySelectorAll(".pdp-gallery-section [data-full]").map((el) => original(new URL(el.getAttribute("data-full") ?? "", url).toString()))),
  ).filter(Boolean);

  const stats: Stat[] = (investment?.querySelectorAll(".pdp-stat") ?? []).map((el) => ({
    value: txt(el.querySelector(".pdp-stat__value")),
    label: txt(el.querySelector(".pdp-stat__label")),
  }));

  return {
    url,
    name,
    developer: txt(hero?.querySelector(".pdp-hero__developer a")) || txt(hero?.querySelector(".pdp-hero__developer")).replace(/^by\s+/i, "") || detail("Developer"),
    location: detail("Location"),
    city: site?.city ?? "",
    heroImage: img(hero?.querySelector(".pdp-hero__media img"), url),
    heroStats: (hero?.querySelectorAll(".pdp-hero__stat") ?? []).map((el) => pair(el, ".pdp-hero__stat-label", ".pdp-hero__stat-value")),
    overview: paragraphs(overview, ".section-content > p"),
    highlights: parseHighlights(highlights),
    details,
    gallery,
    amenitiesIntro: txt(amenities?.querySelector(".pdp-section__subtitle")),
    // Names only — a few pages put a whole sentence in an amenity card.
    amenities: (amenities?.querySelectorAll(".amenity-name") ?? []).map(txt).filter((a) => a && a.length <= 60 && !/[.!?]$/.test(a)),
    payment: root.querySelectorAll(".pdp-payment-step").map(parseMilestone).filter((m) => m.label || m.share),
    paymentNote: txt(root.querySelector(".pdp-payment-note")),
    locationText: paragraphs(location, ".section-content > p"),
    mapImage: img(location?.querySelector(".location-map-image, .pdp-location-map img"), url),
    distances: (location?.querySelectorAll(".section-content li") ?? []).map((li) => parseDistance(txt(li))).filter((d): d is Distance => !!d),
    investmentIntro: txt(investment?.querySelector(".pdp-section__subtitle")),
    investmentStats: stats.filter((s) => s.value),
    marketTitle: txt(investment?.querySelector(".pdp-investment__context-title")),
    marketContext: (investment?.querySelectorAll(".pdp-investment__list li") ?? []).map(txt).filter(Boolean),
    financing: root.querySelectorAll(".pdp-financing__grid li").map(txt).filter(Boolean),
    developerLogo: img(developer?.querySelector(".pdp-developer__logo"), url),
    developerText: wholeSentences(txt(developer?.querySelector(".pdp-developer__desc"))),
    developerImage: img(developer?.querySelector(".pdp-developer__media img"), url),
    unitTypes: parseUnitTypes(root),
    areaTitle: txt(area?.querySelector(".pdp-area__title")),
    areaText: txt(area?.querySelector(".pdp-area__desc")),
    areaImage: img(area?.querySelector(".pdp-area__bg"), url),
    faqs: parseFaqs(root),
    thumbnail: absolute(root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "", url),
  };
}
