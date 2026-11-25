"use client";

/**
 * Custom forms — the manager's form builder. A form is a list of questions attached to one or
 * more request types; when a requester picks one of those types, the request form gains a
 * "Details" step with these questions. Kept in localStorage (this browser only), like the
 * settings. A request keeps a copy of the form it was sent with, so editing or deleting a form
 * later never changes requests already sent.
 */
import { useSyncExternalStore } from "react";
import type { Attachment } from "./types";

export const FIELD_KINDS = {
  short: "Short answer",
  long: "Paragraph",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  choice: "Multiple choice",
  checkbox: "Tick-box",
  link: "Link",
  file: "File upload",
  heading: "Section heading",
} as const;
export type FieldKind = keyof typeof FIELD_KINDS;

export type FormField = {
  id: string;
  kind: FieldKind;
  label: string;
  help: string;
  required: boolean;
  /** Dropdown and multiple-choice answers. */
  options: string[];
};

export type CustomForm = {
  id: string;
  name: string;
  description: string;
  /** Request types that use this form. A type belongs to one form at most. */
  typeIds: string[];
  fields: FormField[];
  updated: string;
};

export type Answer = string | string[] | boolean | Attachment[];

/** What a sent request keeps: the form as it was, so later edits don't change it. */
export type FormSnapshot = Pick<CustomForm, "id" | "name" | "fields">;

export const hasOptions = (k: FieldKind) => k === "select" || k === "choice";

const f = (id: string, kind: FieldKind, label: string, opts: Partial<FormField> = {}): FormField => ({ id, kind, label, help: "", required: false, options: [], ...opts });

const SEED: CustomForm[] = [
  {
    id: "paid-ads",
    name: "Paid ad brief",
    description: "What the Meta or banner ad has to do, and where it sends people.",
    typeIds: ["ag-paid-ads"],
    updated: "2026-11-20",
    fields: [
      f("objective", "select", "Ad objective", { required: true, options: ["Leads", "Traffic to the listing", "Awareness"] }),
      f("sizes", "choice", "Ad sizes", { required: true, options: ["1080 × 1080", "1080 × 1350", "1080 × 1920", "1200 × 628", "300 × 250"] }),
      f("headline", "short", "Headline", { required: true, help: "Up to 40 characters reads best on Meta." }),
      f("cta", "select", "Call to action", { options: ["Learn more", "Contact us", "Book a viewing", "Send WhatsApp message"] }),
      f("landing", "link", "Landing page or listing link", { required: true }),
      f("start", "date", "Campaign start date"),
    ],
  },
  {
    id: "sale-rent-signs",
    name: "Sale / Rent signage",
    description: "The sign, what goes on it, and where it’s put up.",
    typeIds: ["ag-board"],
    updated: "2026-11-25",
    fields: [
      f("sign", "heading", "The sign"),
      f("purpose", "select", "For sale or for rent?", { required: true, options: ["For Sale", "For Rent", "For Sale or Rent"] }),
      f("format", "select", "Sign type", { required: true, options: ["Pole or stake board", "Window poster", "Balcony banner", "Building hoarding"] }),
      f("size", "select", "Size", { required: true, options: ["60 × 90 cm", "90 × 120 cm", "120 × 180 cm", "Other — I’ll give it in the brief"] }),
      f("quantity", "number", "How many signs?", { required: true }),
      f("content", "heading", "What goes on it"),
      f("property", "short", "Building or community name", { required: true, help: "e.g. Marina Gate 1, Arabian Ranches 2" }),
      f("unit", "short", "Property type and bedrooms", { help: "e.g. 3BR townhouse. Leave empty to keep the sign general." }),
      f("contact", "short", "Agent name and mobile on the sign", { required: true }),
      f("price", "checkbox", "Show the price on the sign"),
      f("install", "heading", "Where it goes"),
      f("address", "long", "Where the sign will be put up", { required: true, help: "Address, unit and the exact spot (gate, balcony, window)." }),
      f("map", "link", "Google Maps link"),
      f("installBy", "date", "Needed up by"),
      f("spot", "file", "Photo of the spot", { help: "Helps us size the sign and check it can be read from the street." }),
      f("consent", "checkbox", "The owner or building management has agreed to the sign going up", { required: true }),
    ],
  },
  {
    id: "open-house",
    name: "Open house details",
    description: "The when and where printed on the flyer and signs.",
    typeIds: ["ag-open-house"],
    updated: "2026-11-20",
    fields: [
      f("when", "heading", "When"),
      f("date", "date", "Open house date", { required: true }),
      f("hours", "short", "Hours", { required: true, help: "e.g. 11 AM – 3 PM" }),
      f("where", "heading", "Where"),
      f("address", "long", "Address and unit number", { required: true }),
      f("map", "link", "Google Maps link"),
      f("signs", "number", "How many direction signs?", { help: "Leave empty if you only need the flyer." }),
      f("parking", "checkbox", "Visitor parking is available"),
    ],
  },
  {
    id: "new-joiner",
    name: "New joiner",
    description: "Who is joining, so the welcome post is right the first time.",
    typeIds: ["hr-new-joiner"],
    updated: "2026-11-20",
    fields: [
      f("names", "long", "Full names, as they should appear", { required: true, help: "One per line." }),
      f("roles", "long", "Job titles, in the same order", { required: true }),
      f("start", "date", "Start date", { required: true }),
      f("photos", "file", "Headshots", { required: true, help: "Plain background, at least 1500 px." }),
    ],
  },
];

const KEY = "provtoys-design-forms:v2";
let cache: CustomForm[] | null = null;
const listeners = new Set<() => void>();

export function forms(): CustomForm[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CustomForm[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

function write(next: CustomForm[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useForms = () => useSyncExternalStore(subscribe, forms, () => SEED);

/** The form a request type uses, if any. */
export const formFor = (typeId: string) => forms().find((x) => x.typeIds.includes(typeId));

/** Save a form. Its request types are taken off any other form, since a type uses one form. */
export function saveForm(form: CustomForm) {
  const saved = { ...form, updated: new Date().toISOString() };
  const others = forms()
    .filter((x) => x.id !== form.id)
    .map((x) => ({ ...x, typeIds: x.typeIds.filter((t) => !form.typeIds.includes(t)) }));
  const at = forms().findIndex((x) => x.id === form.id);
  const next = [...others];
  next.splice(at < 0 ? next.length : at, 0, saved);
  write(next);
}

export const deleteForm = (id: string) => write(forms().filter((x) => x.id !== id));

export function resetForms() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  cache = SEED;
  listeners.forEach((l) => l());
}

export const newId = () => Math.random().toString(36).slice(2, 9);

/** Whether a question has been answered. */
export function answered(field: FormField, a: Answer | undefined) {
  if (field.kind === "checkbox") return a === true;
  if (Array.isArray(a)) return a.length > 0;
  return typeof a === "string" && a.trim() !== "";
}
