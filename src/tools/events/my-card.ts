"use client";

/**
 * "My contact card" for the 9:16 flyer — the person downloading the flyer adds their own name,
 * title, email, phone and photo at the bottom, so the flyer they share brings the leads to them.
 * It belongs to the person, not the event: kept in this browser's localStorage and used by every
 * flyer download (Links & media and the Event details header). In the CRM it would be the
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
  /** Data URL or path; "" = no photo. */
  photo: string;
  /** The photo is a cut-out (transparent background) — it stands out of the card's top edge. */
  cutout: boolean;
};

/** The flyer's view of the card: only when it's switched on and has a name. */
export type FlyerAgent = Omit<MyCard, "on" | "employeeId">;

const KEY = "provtoys-events:my-card";
const OFF: MyCard = { on: false, employeeId: "", name: "", title: "", email: "", phone: "", photo: "", cutout: false };
let cache: MyCard | null = null;
const listeners = new Set<() => void>();

function read(): MyCard {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...OFF, ...(JSON.parse(raw) as Partial<MyCard>) } : OFF;
  } catch {
    cache = OFF;
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
    () => OFF,
  );
}

export function flyerAgent(card: MyCard): FlyerAgent | undefined {
  if (!card.on || !card.name.trim()) return undefined;
  const { name, title, email, phone, photo, cutout } = card;
  return { name: name.trim(), title: title.trim(), email: email.trim(), phone: phone.trim(), photo, cutout };
}

/** Demo stand-in for the signed-in user's profile (the Employee contract has no email / phone). */
export function cardFromEmployee(id: string): Partial<MyCard> {
  const e = EMPLOYEES.find((x) => x.id === id);
  if (!e) return { employeeId: "" };
  const [first, ...rest] = e.fullName.toLowerCase().split(/\s+/);
  const n = Number(id.replace(/\D/g, "")) || 1;
  return {
    employeeId: id,
    name: e.fullName,
    title: e.designation,
    email: `${first}.${rest.at(-1) ?? ""}@providentestate.com`.replace(/\.@/, "@"),
    phone: `+971 50 ${String(100 + n * 37).slice(-3)} ${String(4000 + n * 263).slice(-4)}`,
    photo: e.photoUrl ?? "",
    cutout: false,
  };
}

/** True when the image has see-through pixels along its edges (a cut-out portrait). */
export function hasTransparentEdges(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const w = 64;
        const h = Math.max(1, Math.round((64 * im.naturalHeight) / im.naturalWidth));
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const g = cv.getContext("2d")!;
        g.drawImage(im, 0, 0, w, h);
        const px = g.getImageData(0, 0, w, h).data;
        let clear = 0;
        let edge = 0;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            if (x > 1 && x < w - 2 && y > 1) continue; // top row and sides only — a cut-out often touches the bottom
            edge++;
            if (px[(y * w + x) * 4 + 3] < 32) clear++;
          }
        resolve(clear / edge > 0.4);
      } catch {
        resolve(false);
      }
    };
    im.onerror = () => resolve(false);
    im.src = src;
  });
}
