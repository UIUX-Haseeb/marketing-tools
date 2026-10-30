"use client";

/**
 * "My contact card" for the 9:16 flyer — the person downloading the flyer adds their own name,
 * title, email, phone and photo at the bottom, so the flyer they share brings the leads to them.
 * The card is the Project Booklet's agent card (round headshot, name with the BRN at the right,
 * designation, phone and email). It belongs to the person, not the event: kept in this
 * browser's localStorage and used by every flyer download (Links & media and the Event details header). In the CRM it would be the
 * signed-in user's profile; here a demo employee stands in for "who's signed in".
 */
import { useSyncExternalStore } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";

export type MyCard = {
  /** Put the card on the flyer. */
  on: boolean;
  employeeId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  /** RERA broker registration number; "" = left off. */
  brn: string;
  /** Data URL or path; "" = no photo. */
  photo: string;
};

/** The flyer's view of the card: only when it's switched on and has a name. */
export type FlyerAgent = Omit<MyCard, "on" | "employeeId">;

const KEY = "provtoys-events:my-card";
const OFF: MyCard = { on: false, employeeId: "", name: "", title: "", email: "", phone: "", brn: "", photo: "" };
// On from the start, filled from the signed-in person (the first demo employee), so a downloaded
// flyer carries the card without anyone having to find the switch first.
const START: MyCard = { ...OFF, on: true, ...cardFromEmployee(EMPLOYEES[0].id) };
let cache: MyCard | null = null;
const listeners = new Set<() => void>();

function read(): MyCard {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...OFF, ...(JSON.parse(raw) as Partial<MyCard>) } : START;
  } catch {
    cache = START;
  }
  return cache;
}

export function saveMyCard(p: Partial<MyCard>) {
  cache = { ...read(), ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked — the card still holds until the page reloads.
  }
  listeners.forEach((l) => l());
}

export function useMyCard() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => START,
  );
}

export function flyerAgent(card: MyCard): FlyerAgent | undefined {
  if (!card.on || !card.name.trim()) return undefined;
  const { name, title, email, phone, brn, photo } = card;
  return { name: name.trim(), title: title.trim(), email: email.trim(), phone: phone.trim(), brn: brn.trim(), photo };
}

/**
 * Demo stand-in for the signed-in user's profile. The Employee contract has no phone, email or
 * BRN, so these are the same placeholders as the Project Booklet's (project-booklet/agent.ts).
 */
export function cardFromEmployee(id: string): Partial<MyCard> {
  const e = EMPLOYEES.find((x) => x.id === id);
  if (!e) return { employeeId: "" };
  const email = `${e.fullName.toLowerCase().normalize("NFD").replace(/[^a-z\s]/g, "").trim().split(/\s+/).join(".")}@providentestate.com`;
  return { employeeId: id, name: e.fullName, title: e.designation, email, phone: "+971 50 123 4567", brn: "12345", photo: e.photoUrl ?? "" };
}
