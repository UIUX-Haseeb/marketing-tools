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
  if (to === "00:00") return `${a.t} ${a.ap} – Midnight`;
  const b = t12(to);
  return a.ap === b.ap ? `${a.t} – ${b.t} ${b.ap}` : `${a.t} ${a.ap} – ${b.t} ${b.ap}`;
}

/** The run's last calendar day — an end at 00:00 the next day still belongs to the day before. */
function lastDay(e: EventRecord) {
  const s = parse(e.starts);
  const n = parse(e.ends);
  if (!s || !n) return null;
  const end = dayOnly(n);
  if (n.hh === 0 && n.mm === 0 && end > dayOnly(s)) end.setDate(end.getDate() - 1);
  return end;
}

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
  const tz = e.timezone && e.timezone !== "Asia/Dubai" ? ` ${e.timezone.split("/")[1].replace("_", " ")} time` : "";
  return { big, sub, note, long, time: from ? `${timeRange(from, to)}${tz}` : "" };
}

/** "EMAAR Dubai Hills Sales Center · Dubai"; online events read "Online". */
export function placeLine(e: EventRecord) {
  if (e.online) return "Online";
  const city = e.city && !e.venue.toLowerCase().includes(e.city.toLowerCase()) ? e.city : "";
  return [e.venue, city].filter(Boolean).join(" · ");
}

/** Short date for the thumbnail: "14 OCT", "23–24 OCT", "17 OCT – 1 NOV". */
export function shortDate(e: EventRecord) {
  const a = artDate(e);
  if (!a) return "";
  return a.long ? a.big : `${a.big} ${a.sub.split(" ")[0]}`;
}
