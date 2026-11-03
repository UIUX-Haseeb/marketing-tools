"use client";

/**
 * Requests, flags and the workflow (handover sections 3 and 4), kept in localStorage (this
 * browser only). In the CRM these are the design-requests API, the user's flag counter and the
 * mailer — every status change here records the email it would send in the request's history.
 */
import { useSyncExternalStore } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";
import type { Employee } from "@/lib/demo/types";
import { addWorkingDays, FLAG_LIMIT, isoDay, REPLY_DAYS, REVISION_ROUNDS } from "./rules";
import { SEED } from "./seed";
import type { Attachment, DesignRequest, Flag, HistoryEntry, RequestDraft, Requester, Status } from "./types";

export const MARKETING = "Marketing & Design";
export const MARKETING_EMAIL = "design-requests@provident.demo";
export const DIRECTOR = "Marketing Director";
export const DIRECTOR_EMAIL = "marketing.director@provident.demo";

const KEY = "provtoys-design-requests:v1";

type State = { requests: DesignRequest[]; flags: Record<string, Flag[]>; seq: number };

const seedState = (): State => ({ requests: SEED, flags: { "emp-2": [{ at: "2026-10-20T10:00", reason: "Placeholder copy (“TBC”) in DR-0003", requestRef: "DR-0003" }] }, seq: SEED.length });
const SERVER = seedState();

let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as State) : seedState();
  } catch {
    cache = seedState();
  }
  return cache;
}

function write(s: State) {
  cache = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked — the change still holds until the page reloads.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDesignState = () => useSyncExternalStore(subscribe, read, () => SERVER);

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  write(seedState());
}

// ── People ─────────────────────────────────────────────────────────────

export function departmentOf(designation: string) {
  const d = designation.toLowerCase();
  if (/hr|human/.test(d)) return "HR";
  if (/marketing/.test(d)) return "Marketing";
  if (/learning/.test(d)) return "Learning & Development";
  if (/operations|assistant/.test(d)) return "Operations";
  if (/mortgage/.test(d)) return "Finance";
  if (/managing/.test(d)) return "Management";
  return "Sales";
}

export function requesterFrom(e: Employee): Requester {
  return { id: e.id, name: e.fullName, email: `${e.fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@provident.demo`, department: departmentOf(e.designation) };
}

export const PEOPLE = EMPLOYEES.filter((e) => e.active);

// ── Flags ──────────────────────────────────────────────────────────────

export const flagsOf = (s: State, userId: string) => s.flags[userId] ?? [];
export const isPaused = (s: State, userId: string) => flagsOf(s, userId).length >= FLAG_LIMIT;

function addFlag(s: State, userId: string, reason: string, requestRef?: string): State {
  return { ...s, flags: { ...s.flags, [userId]: [...flagsOf(s, userId), { at: new Date().toISOString(), reason, requestRef }] } };
}

export function reinstate(userId: string) {
  const s = read();
  write({ ...s, flags: { ...s.flags, [userId]: [] } });
}

// ── Requests ───────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

function entry(action: string, by: string, emailed: string[], note?: string): HistoryEntry {
  return { at: now(), by, action, note, emailed };
}

function update(id: string, fn: (r: DesignRequest, s: State) => { r: DesignRequest; s?: State }) {
  const s = read();
  const r = s.requests.find((x) => x.id === id);
  if (!r) return;
  const out = fn(r, s);
  const next = out.s ?? s;
  write({ ...next, requests: next.requests.map((x) => (x.id === id ? { ...out.r, updated: now() } : x)) });
}

/** New request, or a Returned one edited and sent again. */
export function submitRequest(draft: RequestDraft, requester: Requester, existingId?: string): DesignRequest {
  const s = read();
  const urgentApproval = draft.urgent ? ("pending" as const) : undefined;
  const to = [requester.email, MARKETING_EMAIL, ...(draft.urgent ? [DIRECTOR_EMAIL] : [])];
  if (existingId) {
    let saved!: DesignRequest;
    update(existingId, (r) => {
      saved = { ...r, ...draft, status: "Submitted", urgentApproval, replyDue: undefined, reminderSent: false, history: [...r.history, entry("Resubmitted", requester.name, to)] };
      return { r: saved };
    });
    return saved;
  }
  const seq = s.seq + 1;
  const r: DesignRequest = {
    ...draft,
    id: crypto.randomUUID(),
    ref: `DR-${String(seq).padStart(4, "0")}`,
    requester,
    status: "Submitted",
    created: now(),
    updated: now(),
    urgentApproval,
    revisionRounds: 0,
    history: [entry(draft.urgent ? "Submitted as urgent — waiting for the Marketing Director" : "Submitted", requester.name, to)],
  };
  write({ ...s, seq, requests: [r, ...s.requests] });
  return r;
}

const requesterAnd = (r: DesignRequest, ...more: string[]) => [r.requester.email, ...more];

/** Marketing sends it back with a note; the requester has 2 working days to reply. */
export function returnRequest(id: string, note: string, flag: boolean) {
  update(id, (r, s) => ({
    r: {
      ...r,
      status: "Returned",
      replyDue: addWorkingDays(new Date(), REPLY_DAYS).toISOString(),
      reminderSent: false,
      history: [...r.history, entry(flag ? "Returned — flagged as placeholder or incomplete" : "Returned", MARKETING, requesterAnd(r), note)],
    },
    s: flag ? addFlag(s, r.requester.id, `Placeholder or incomplete submission (${r.ref})`, r.ref) : s,
  }));
}

export function decideUrgent(id: string, approve: boolean, note?: string) {
  update(id, (r) => ({
    r: {
      ...r,
      urgentApproval: approve ? "approved" : "declined",
      urgent: approve,
      history: [...r.history, entry(approve ? "Urgent approved" : "Urgent declined — handled first come, first served", DIRECTOR, requesterAnd(r, MARKETING_EMAIL), note)],
    },
  }));
}

/** Plain status moves: Confirm, Start, Deliver, Close. */
export function move(id: string, status: Status, opts: { note?: string; delivered?: Attachment[] } = {}) {
  update(id, (r) => {
    const label: Record<string, string> = { Confirmed: "Confirmed — scheduled", "In progress": "Design work started", Delivered: "Delivered", Closed: "Closed — completed" };
    const next: DesignRequest = { ...r, status, history: [...r.history, entry(label[status] ?? status, MARKETING, requesterAnd(r), opts.note)] };
    if (status === "In progress") next.workStarted = true;
    if (status === "Delivered") {
      next.deliveredAt = now();
      next.delivered = [...(r.delivered ?? []), ...(opts.delivered ?? [])];
    }
    if (status === "Closed") next.closeReason = "Completed";
    return { r: next };
  });
}

/** One consolidated feedback list, within 2 working days of delivery, up to the included rounds. */
export function requestRevision(id: string, notes: string) {
  update(id, (r) => ({
    r: {
      ...r,
      status: "Revision requested",
      revisionRounds: r.revisionRounds + 1,
      history: [...r.history, entry(`Revision ${r.revisionRounds + 1} of ${REVISION_ROUNDS} requested`, r.requester.name, [MARKETING_EMAIL, r.requester.email], notes)],
    },
  }));
}

export function revisionWindow(r: DesignRequest) {
  if (!r.deliveredAt) return null;
  const until = addWorkingDays(new Date(r.deliveredAt), REPLY_DAYS);
  return { until, open: new Date() <= until && r.revisionRounds < REVISION_ROUNDS };
}

/** Cancelling before design work starts is free; after it starts it adds a flag. */
export function cancelRequest(id: string, by: string) {
  update(id, (r, s) => {
    const late = !!r.workStarted;
    return {
      r: { ...r, status: "Closed", closeReason: "Cancelled", history: [...r.history, entry(late ? "Cancelled after design work started — flagged" : "Cancelled (no flag)", by, requesterAnd(r, MARKETING_EMAIL))] },
      s: late ? addFlag(s, r.requester.id, `Cancelled after design work started (${r.ref})`, r.ref) : s,
    };
  });
}

export function sendReminder(id: string) {
  update(id, (r) => ({
    r: { ...r, reminderSent: true, history: [...r.history, entry(`Reminder — reply by ${r.replyDue ? isoDay(new Date(r.replyDue)) : "the due date"} or the request closes`, "Portal", requesterAnd(r))] },
  }));
}

/** Auto-close a returned request whose reply is overdue, and flag the requester. */
function autoClose(r: DesignRequest, s: State): { r: DesignRequest; s: State } {
  return {
    r: { ...r, status: "Closed", closeReason: "Auto-closed", history: [...r.history, entry(`Auto-closed — no reply within ${REPLY_DAYS} working days, flagged`, "Portal", requesterAnd(r, MARKETING_EMAIL))] },
    s: addFlag(s, r.requester.id, `No reply within ${REPLY_DAYS} working days (${r.ref})`, r.ref),
  };
}

/** Runs on load: closes overdue returned requests, sends the reminder in the last working day. */
export function runTimers() {
  let s = read();
  let changed = false;
  const t = new Date();
  for (const r of s.requests) {
    if (r.status !== "Returned" || !r.replyDue) continue;
    const due = new Date(r.replyDue);
    if (t > due) {
      const out = autoClose(r, s);
      s = { ...out.s, requests: out.s.requests.map((x) => (x.id === r.id ? out.r : x)) };
      changed = true;
    } else if (!r.reminderSent && +due - +t < 24 * 3600 * 1000) {
      sendReminder(r.id);
      s = read();
    }
  }
  if (changed) write(s);
}

/** Demo: pretend the 2 working days have passed. */
export function expireReply(id: string) {
  update(id, (r, s) => autoClose(r, s));
}
