"use client";

/**
 * Event list: the real portal events (real/) plus whatever is added or edited here, kept in
 * localStorage (this browser only). In the CRM this is the events API.
 */
import { useSyncExternalStore } from "react";
import { REAL_EVENTS as SEED_EVENTS } from "./real";
import type { EventRecord } from "./types";

// v2: the seed became the real portal events (v1 lists held the demo ones)
const KEY = "provtoys-events:v2";
let cache: EventRecord[] | null = null;
const listeners = new Set<() => void>();

function read(): EventRecord[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as EventRecord[]) : null;
    // Seed events added since the list was saved join it.
    cache = saved ? [...saved, ...SEED_EVENTS.filter((s) => !saved.some((e) => e.id === s.id))] : SEED_EVENTS;
  } catch {
    cache = SEED_EVENTS;
  }
  return cache;
}

function write(list: EventRecord[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked — the change still holds until the page reloads.
  }
  listeners.forEach((l) => l());
}

export function useEvents() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => SEED_EVENTS,
  );
}

export function saveEvent(e: EventRecord) {
  const list = read();
  write(list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? e : x)) : [e, ...list]);
}

export function resetEvents() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  write(SEED_EVENTS);
}
