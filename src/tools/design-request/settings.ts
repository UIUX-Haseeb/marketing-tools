"use client";

/**
 * Design settings — the portal's "Photography settings" for design requests, kept in
 * localStorage (this browser only). Six tabs: Availability (lead times, booking window,
 * daily limit, the working week, reply / revision / flag rules), Request types (the list
 * requesters pick from, per group), Designers (colour, working
 * days, days off), Files (smallest picture, warn or refuse), Documents (extra upload boxes on
 * the form) and Terms & Conditions (version, wording, the tick-box text). rules.ts, the form,
 * the board and the calendar all read from here, so a saved change shows straight away.
 */
import { useSyncExternalStore } from "react";
import { ALL_TYPES, LEAD_DAYS, REQUEST_TYPES, type LeadClass, type RequestType } from "./catalog";
import type { Category } from "./types";
import { DEFAULT_TERMS } from "./terms";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type WorkDay = { on: boolean; from: string; to: string };
export type Designer = { name: string; color: string; days: boolean[]; off: string[] };
export type DocumentRule = { id: string; name: string; help: string; required: boolean; asked: boolean };

export type Settings = {
  lead: Record<LeadClass, number>;
  /** Furthest deadline that can be picked, in days from today. */
  bookUpTo: number;
  /** Most requests due on one day; null for no limit. */
  perDay: number | null;
  /** Mon … Sun. Days that are off don't count as working days. */
  week: WorkDay[];
  replyDays: number;
  revisionRounds: number;
  flagLimit: number;
  designers: Designer[];
  files: { minPx: number; mode: "warn" | "refuse"; briefMin: number };
  documents: DocumentRule[];
  terms: { version: string; savedAt: string; title: string; body: string; ack: string; note: string };
  /** The request types requesters pick from, per group (Agents, HR …). */
  types: Record<Category, RequestType[]>;
};

const WEEKDAY: WorkDay = { on: true, from: "09:00", to: "18:00" };
const OFF: WorkDay = { on: false, from: "09:00", to: "18:00" };
const MON_FRI = [true, true, true, true, true, false, false];

export const DEFAULTS: Settings = {
  lead: { ...LEAD_DAYS },
  bookUpTo: 60,
  perDay: null,
  week: [WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, OFF, OFF],
  replyDays: 2,
  revisionRounds: 2,
  flagLimit: 3,
  designers: [
    { name: "Joanna Cruz", color: "#3b82f6", days: MON_FRI, off: [] },
    { name: "Rami Aziz", color: "#db2777", days: MON_FRI, off: [] },
    { name: "Lina Farouk", color: "#16a34a", days: [true, true, true, true, false, false, false], off: [] },
    { name: "Noor Al Sayegh", color: "#ea580c", days: MON_FRI, off: [] },
  ],
  files: { minPx: 1500, mode: "warn", briefMin: 60 },
  documents: [{ id: "brand-guide", name: "Developer brand guidelines", help: "For co-brand material: the developer's logo pack or guidelines, if they have one.", required: false, asked: false }],
  terms: {
    version: "1.0 · November 2026",
    savedAt: "2026-11-03",
    title: "Design Request: Terms & Conditions",
    body: DEFAULT_TERMS,
    ack: "I’ve read the terms and conditions",
    note: "Each request records the version you accepted.",
  },
  types: REQUEST_TYPES,
};

const KEY = "provtoys-design-settings:v1";
let cache: Settings | null = null;
const listeners = new Set<() => void>();

/** The current settings — safe to call outside React (rules.ts uses it). */
export function settings(): Settings {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache;
}

export function saveSettings(patch: Partial<Settings>) {
  cache = { ...settings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

export function resetSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  cache = DEFAULTS;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSettings = () => useSyncExternalStore(subscribe, settings, () => DEFAULTS);

/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const designerColor = (name?: string) => settings().designers.find((d) => d.name === name)?.color ?? "#9ca3af";

/** Why a designer can't take work due that day, or null. */
export function designerAway(name: string, iso: string): string | null {
  const d = settings().designers.find((x) => x.name === name);
  if (!d) return null;
  if (d.off.includes(iso)) return "day off";
  if (!d.days[weekdayIndex(new Date(`${iso}T12:00`))]) return "doesn’t work that day";
  return null;
}

/**
 * A request type by id — the manager's current list first, then the built-in list, so a request
 * sent with a type that was later removed still shows its name.
 */
export const typeById = (id: string): RequestType | undefined => Object.values(settings().types).flat().find((t) => t.id === id) ?? ALL_TYPES.find((t) => t.id === id);
