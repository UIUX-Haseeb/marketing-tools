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

/** No forms to start with — managers build their own in the form builder. */
const SEED: CustomForm[] = [];

const KEY = "provtoys-design-forms:v3";
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
