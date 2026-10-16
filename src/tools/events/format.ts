/**
 * Dates, times and the short lines the artwork prints. Event times are local to the event's
 * timezone ("YYYY-MM-DDTHH:mm"), so they're shown as stored — no conversion.
 */
import { WEEKDAYS, type EventRecord } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Parts = { y: number; m: number; d: number; hh: number; mm: number };

export function parse(s: string): Parts | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s || "");
  if (!r) return null;
  return { y: +r[1], m: +r[2], d: +r[3], hh: +(r[4] ?? 0), mm: +(r[5] ?? 0) };
}
const dayOnly = (p: Parts) => new Date(p.y, p.m - 1, p.d);
/** 0 = Mon … 6 = Sun */
const weekday = (d: Date) => (d.getDay() + 6) % 7;
const pad = (n: number) => String(n).padStart(2, "0");

export function fmtDate(s: string) {
  const p = parse(s);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : "—";
}
export function fmtDateTime(s: string) {
  const p = parse(s);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}, ${pad(p.hh)}:${pad(p.mm)}` : "—";
}
export const timeOf = (s: string) => (parse(s) ? s.slice(11, 16) : "");

/** "19:00" → { t: "7", ap: "PM" }; "19:30" → { t: "7:30", ap: "PM" } */
function t12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return { t: m ? `${hr}:${pad(m)}` : String(hr), ap };
}

/** "19:00","22:00" → "7 – 10 PM"; "09:00","19:45" → "9 AM – 7:45 PM"; an end of 00:00 reads "Midnight". */
export function timeRange(from: string, to: string) {
  if (!from) return "";
  const a = t12(from);
  if (!to || to === from) return `${a.t} ${a.ap}`;
  // an end at midnight is how the portal says "until close" — "9 AM – Midnight" reads oddly
  if (to === "00:00") return `From ${a.t} ${a.ap}`;
  const b = t12(to);
  return a.ap === b.ap ? `${a.t} – ${b.t} ${b.ap}` : `${a.t} ${a.ap} – ${b.t} ${b.ap}`;
}

/**
 * The run's last calendar day. An end at 00:00 after a real start time means "until midnight",
 * so it belongs to the day before (Wadeem: 1 Oct 09:00 → 2 Oct 00:00 is 1 Oct). When the start
 * is 00:00 too, only dates were entered and the end day counts (Object 1: 28 → 30 Sep 00:00 is
 * 28–30 Sep, as its poster says).
 */
function lastDay(e: EventRecord) {
  const s = parse(e.starts);
  const n = parse(e.ends);
  if (!s || !n) return null;
  const end = dayOnly(n);
  const datesOnly = s.hh === 0 && s.mm === 0;
  if (n.hh === 0 && n.mm === 0 && end > dayOnly(s) && !datesOnly) end.setDate(end.getDate() - 1);
  return end;
}

/**
 * Portal events often carry a placeholder time — 00:00, 00:15–01:30, 00:00–23:45 — when nobody
 * knew the real one. Nothing starts between midnight and 6 AM, so those times are left off the
 * artwork rather than printed.
 */
export const isPlaceholderTime = (hhmm: string) => !hhmm || +hhmm.slice(0, 2) < 6;

/** Daily window: the Schedule tab's daily times, else the start/end times. */
export function dailyWindow(e: EventRecord) {
  return { from: e.dailyStart || timeOf(e.starts), to: e.dailyEnd || timeOf(e.ends) };
}

/** Every day the event actually runs (repeats = only those weekdays), with its window. */
export function occurrences(e: EventRecord) {
  const s = parse(e.starts);
  const last = lastDay(e);
  if (!s || !last) return [];
  const { from, to } = dailyWindow(e);
  const out: { day: Date; from: string; to: string }[] = [];
  for (const d = dayOnly(s); d <= last && out.length < 400; d.setDate(d.getDate() + 1)) {
    if (e.repeats.length && !e.repeats.includes(weekday(d))) continue;
    out.push({ day: new Date(d), from, to });
  }
  return out;
}

function endOf(o: { day: Date; to: string }) {
  const [h, m] = (o.to || "23:59").split(":").map(Number);
  const d = new Date(o.day);
  if (o.to === "00:00") d.setDate(d.getDate() + 1);
  else d.setHours(h, m);
  return d;
}

export function nextOccurrence(e: EventRecord, now = new Date()) {
  return occurrences(e).find((o) => endOf(o) >= now) ?? null;
}
export const isPast = (e: EventRecord, now = new Date()) => !!parse(e.ends) && !nextOccurrence(e, now);
export const isUpcoming = (e: EventRecord, now = new Date()) => !e.cancelled && !!nextOccurrence(e, now);
export const isRecurring = (e: EventRecord) => e.repeats.length > 0;

export function fmtDay(d: Date, long = false) {
  return long ? `${DAY_NAMES[weekday(d)].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Sat & Sun", "Mon, Wed & Fri" */
export function weekdayList(days: number[]) {
  const names = [...days].sort().map((d) => WEEKDAYS[d]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0] ?? "";
}

/** The date block on the artwork. `big` is the numeral line, `sub` the month/year, `note` the weekday(s). */
export function artDate(e: EventRecord) {
  const s = parse(e.starts);
  const last = lastDay(e);
  if (!s || !last) return null;
  const first = dayOnly(s);
  const M = (d: Date) => MONTHS[d.getMonth()].toUpperCase();
  const sameDay = +first === +last;
  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const days = (last.getTime() - first.getTime()) / 86400000 + 1;
  let big: string;
  let sub: string;
  let long = false;
  if (sameDay) {
    big = String(first.getDate());
    sub = `${M(first)} ${first.getFullYear()}`;
  } else if (sameMonth) {
    big = `${first.getDate()}–${last.getDate()}`;
    sub = `${M(first)} ${first.getFullYear()}`;
  } else {
    big = `${first.getDate()} ${M(first)} – ${last.getDate()} ${M(last)}`;
    sub = String(last.getFullYear());
    long = true;
  }
  let note: string;
  if (e.repeats.length) note = `Every ${weekdayList(e.repeats)}`;
  else if (sameDay) note = DAY_NAMES[weekday(first)];
  else if (days === 2) note = `${DAY_NAMES[weekday(first)].slice(0, 3)} & ${DAY_NAMES[weekday(last)].slice(0, 3)}`;
  else note = `${DAY_NAMES[weekday(first)].slice(0, 3)} – ${DAY_NAMES[weekday(last)].slice(0, 3)}`;
  const { from, to } = dailyWindow(e);
  if (tentative(e.title)) note = "Date to be confirmed";
  // "Europe/London" → "London time"; zones without a city ("UTC", which the portal has) read as themselves
  const tz = e.timezone && e.timezone !== "Asia/Dubai" ? ` ${(e.timezone.split("/")[1] ?? e.timezone).replace(/_/g, " ")} time` : "";
  return { big, sub, note, long, time: from && !isPlaceholderTime(from) ? `${timeRange(from, to)}${tz}` : "" };
}

const TBA = /^(tba|tbc|tbd|to be (announced|confirmed)|n\/?a|-+)$/i;

/**
 * "EMAAR Dubai Hills Sales Center · Dubai"; online events read "Online". Real venues include
 * "TBA" (→ "Venue to be announced") and "ONLINE BOOKING!!!" (→ "Online").
 */
export function placeLine(e: EventRecord) {
  const venue = e.venue.trim();
  if (e.online || /\bonline\b/i.test(venue)) return "Online";
  if (TBA.test(venue)) return "Venue to be announced";
  const city = e.city && !venue.toLowerCase().includes(e.city.toLowerCase()) ? e.city : "";
  return [venue, city].filter(Boolean).join(" · ");
}

/** "(TENTATIVE DATE)" / "(Tentative dates)" in a title. */
const TENTATIVE = /\s*[(\[]\s*tentative dates?\s*[)\]]\s*/i;
export const tentative = (title: string) => TENTATIVE.test(title);

/** Acronyms that stay in capitals when a title is tidied: anything with a digit (Q4, 20/80), no vowels (JVT, TH), or listed. */
const ACRONYMS = new Set(["EOI", "ADGM", "UAE", "VIP", "MGS", "ALA", "ORA", "ADIB", "ADREC", "DIFC", "JLT", "JVC", "DHE", "KSA", "USA", "UK", "HQ", "RSVP", "UHNWI", "AED", "SZR", "MBR"]);
const keepCaps = (w: string) => /\d/.test(w) || !/[AEIOUY]/.test(w) || ACRONYMS.has(w) || /^[A-Z]+&[A-Z]+$/.test(w);
const SMALL = new Set(["a", "an", "the", "of", "in", "on", "at", "by", "for", "to", "and", "or", "with"]);

/**
 * The title as it goes on the artwork: "(TENTATIVE DATE)" moved out (the date block says it),
 * trailing commas / dashes / pipes trimmed, and — when `tidyCaps` is on and the title is typed
 * mostly in capitals, as most portal titles are — set in Title Case, short acronyms kept.
 */
export function artTitle(e: EventRecord) {
  let t = e.title.replace(TENTATIVE, " ").replace(/\s{2,}/g, " ").trim().replace(/[\s,;:|\-–—]+$/, "");
  const letters = t.replace(/[^A-Za-z]/g, "");
  const upper = t.replace(/[^A-Z]/g, "").length;
  if ((e.artwork.tidyCaps ?? true) && letters.length > 3 && upper / letters.length > 0.7) {
    let start = true; // first word, or first after "|", "–", "-", ":" — always capitalised
    t = t
      .split(/(\s+)/)
      .map((w) => {
        if (/^\s+$/.test(w)) return w;
        if (!/[A-Za-z]/.test(w)) {
          if (/^[|–—\-:]+$/.test(w)) start = true;
          return w;
        }
        const core = w.replace(/[^A-Za-z0-9&]/g, "");
        const first = start;
        start = /[:|]$/.test(w);
        if (core === core.toUpperCase() && keepCaps(core)) return w;
        if (core !== core.toUpperCase()) return w; // a mixed-case word was typed that way on purpose
        const lower = w.toLowerCase();
        if (!first && SMALL.has(lower.replace(/[^a-z]/g, ""))) return lower;
        return lower.replace(/(^|[-/(“"'’])([a-z])/g, (_m, p: string, ch: string) => p + ch.toUpperCase());
      })
      .join("");
  }
  return t;
}

/** "https://teams.microsoft.com/l/meetup-join/…" → "teams.microsoft.com" — long links keep only the site. */
export function shortLink(url: string) {
  const bare = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return bare.length > 42 ? bare.split("/")[0] : bare;
}

/** Short date for the thumbnail: "14 OCT", "23–24 OCT", "17 OCT – 1 NOV". */
export function shortDate(e: EventRecord) {
  const a = artDate(e);
  if (!a) return "";
  return a.long ? a.big : `${a.big} ${a.sub.split(" ")[0]}`;
}
