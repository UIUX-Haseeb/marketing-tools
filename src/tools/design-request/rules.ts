/**
 * The rules the form and the workflow enforce (handover sections 2 and 3): placeholder
 * rejection, lead times in working days, which approvals a request needs, step validation.
 */
import { LEAD_LABEL, typeById } from "./catalog";
import { settings, weekdayIndex } from "./settings";
import type { Attachment, RequestDraft } from "./types";

// Revision rounds, the flag limit, reply days, the smallest picture and the shortest brief
// are in Settings (settings.ts) — read them with settings().

/** A working day for Marketing & Design (Settings › Availability; Sat and Sun off by default). */
const isWorkingDay = (d: Date) => settings().week[weekdayIndex(d)].on;

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) left--;
  }
  return d;
}

export const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const fmtDay = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtStamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Earliest deadline allowed for a request type (today + its lead time in working days). */
export function earliestDeadline(typeId: string, today = new Date()): { date: string; days: number; label: string } | null {
  const t = typeById(typeId);
  if (!t) return null;
  const days = settings().lead[t.lead];
  return { date: isoDay(addWorkingDays(today, days)), days, label: LEAD_LABEL[t.lead] };
}

const PLACEHOLDERS = [
  /\btb[cad]\b/i,
  /\bn\s*\/\s*a\b/i,
  /^\s*na\s*$/i,
  /will (send|share|provide|update|confirm)[\w\s]*later/i,
  /\b(to follow|coming soon)\s*\.?\s*$/i,
  /lorem ipsum/i,
  /\bx{3,}\b/i,
  /^[\s\-–—.?!_]*$/,
];

/** The placeholder in a text ("TBC", "N/A", "will send later"…), or null. */
export function findPlaceholder(text: string): string | null {
  for (const re of PLACEHOLDERS) {
    const m = text.match(re);
    if (m) return m[0].trim() || "an empty answer";
  }
  return null;
}

export const isLowRes = (a: Attachment) => !!a.width && !!a.height && Math.max(a.width, a.height) < settings().files.minPx;

/** Which approvals this draft needs. */
export function needs(d: RequestDraft) {
  const t = typeById(d.typeId);
  return {
    permit: d.category === "agents" && !!t?.permit,
    developer: !!t?.developer || d.developerMaterial,
    person: !!t?.person || d.aboutPerson,
    people: d.peopleShown,
    print: d.usages.includes("Print"),
    custom: d.formats.includes("Custom"),
  };
}

export const STEPS = [
  { id: "request", label: "Request" },
  { id: "format", label: "Format" },
  { id: "content", label: "Content" },
  { id: "approvals", label: "Approvals" },
  { id: "timing", label: "Timing" },
  { id: "terms", label: "Terms" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

export type Errors = Partial<Record<string, string>>;

/** Field → its step, so Send can jump to the first problem. */
export const FIELD_STEP: Record<string, StepId> = {
  category: "request", typeId: "request", title: "request", brief: "request",
  formats: "format", customSize: "format", usages: "format", printQuantity: "format", language: "format", sourceFiles: "format",
  copy: "content", assets: "content",
  permitNumber: "approvals", permitQr: "approvals", developerApproval: "approvals", personApproval: "approvals", peopleAgreed: "approvals",
  deadline: "timing", urgentReason: "timing",
  terms: "terms",
};

function noPlaceholder(text: string, what: string): string | undefined {
  const p = findPlaceholder(text);
  return p ? `“${p}” looks like a placeholder. Send the real ${what} — placeholders are flagged.` : undefined;
}

/** Furthest deadline that can be picked (Settings › Availability › Book up to). */
export function latestDeadline(today = new Date()) {
  const d = new Date(today);
  d.setDate(d.getDate() + settings().bookUpTo);
  return isoDay(d);
}

/** `dueOn` counts the other requests already due on a day, for the daily limit. */
export function validate(d: RequestDraft, today = new Date(), dueOn: (iso: string) => number = () => 0): Errors {
  const e: Errors = {};
  const n = needs(d);

  if (!d.category) e.category = "Pick who the request is for.";
  if (!d.typeId) e.typeId = "Pick a request type.";
  if (!d.title.trim()) e.title = "Give it a short title.";
  if (!d.brief.trim()) e.brief = "Tell us what you need.";
  else e.brief = noPlaceholder(d.brief, "brief") ?? (d.brief.trim().length < settings().files.briefMin ? `A bit more, please — at least ${settings().files.briefMin} characters (${d.brief.trim().length} so far).` : undefined);

  if (!d.formats.length) e.formats = "Pick at least one format.";
  if (n.custom && !d.customSize.trim()) e.customSize = "Give the custom size, e.g. 1200 × 628 px or 3 × 2 m.";
  if (!d.usages.length) e.usages = "Where will it be used?";
  if (n.print && !(Number(d.printQuantity) > 0)) e.printQuantity = "How many will be printed?";
  if (!d.language) e.language = "Pick a language.";
  if (!d.sourceFiles) e.sourceFiles = "Do you need the editable source files?";

  if (!d.copy.trim() && !d.copyFiles.length) e.copy = "Add the final copy, or attach it.";
  else if (d.copy.trim()) e.copy = noPlaceholder(d.copy, "copy");
  if (!d.assets.length && !d.assetsLink.trim()) e.assets = "Attach the photos, logos, renders or floor plans — or paste a Drive link.";
  else if (d.assetsLink.trim() && !/^https?:\/\/\S+\.\S+/.test(d.assetsLink.trim())) e.assets = "That doesn't look like a link. Paste the full Drive link (https://…).";

  if (n.permit) {
    if (!d.permitNumber.trim()) e.permitNumber = "Property and project ads need the permit number.";
    else e.permitNumber = noPlaceholder(d.permitNumber, "permit number");
    if (!d.permitQr.length) e.permitQr = "Attach the permit QR code.";
  }
  if (n.developer && !d.developerApproval.length) e.developerApproval = "Attach the developer's written approval.";
  if (n.person && !d.personApproval.length) e.personApproval = "Attach the HR or department head approval.";
  if (n.people && !d.peopleAgreed) e.peopleAgreed = "Everyone shown needs to have agreed.";
  for (const doc of settings().documents) if (doc.asked && doc.required && !d.docs?.[doc.id]?.length) e[`doc:${doc.id}`] = `Attach the ${doc.name.toLowerCase()}.`;

  const min = earliestDeadline(d.typeId, today);
  if (!d.deadline) e.deadline = "When do you need it?";
  else if (min && d.deadline < min.date) e.deadline = `A ${min.label} needs ${min.days} working days — the earliest date is ${fmtDay(min.date)}.`;
  else if (d.deadline > latestDeadline(today)) e.deadline = `Deadlines can be booked up to ${settings().bookUpTo} days ahead — the latest is ${fmtDay(latestDeadline(today))}.`;
  else if (!isWorkingDay(new Date(`${d.deadline}T12:00`))) e.deadline = "Pick a working day — Marketing & Design is off that day.";
  else if (settings().perDay && dueOn(d.deadline) >= settings().perDay!) e.deadline = `${fmtDay(d.deadline)} is full (${settings().perDay} requests a day). Pick another date.`;
  if (d.urgent && !d.urgentReason.trim()) e.urgentReason = "Say why it's urgent — the Marketing Director approves urgent requests.";

  if (!d.readTerms || !d.proofread || !d.approvalsAttached) e.terms = "Tick all three to send.";

  for (const k of Object.keys(e)) if (!e[k]) delete e[k];
  return e;
}

export const stepErrors = (errors: Errors, step: StepId) => Object.keys(errors).filter((k) => (k.startsWith("doc:") ? "approvals" : FIELD_STEP[k]) === step);
