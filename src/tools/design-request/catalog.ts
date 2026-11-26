/**
 * Requester groups, the shape of a request type (lead time + the approvals it triggers) and the
 * lead-time classes. Lead times are the handover's drafts — still to confirm.
 */
import type { Category } from "./types";

/** Lead-time class → working days (drafts: social post [2], flyer [3], large-format or print [5], brochure or multi-page [10]). */
export const LEAD_DAYS = { social: 2, flyer: 3, print: 5, multipage: 10 } as const;
export type LeadClass = keyof typeof LEAD_DAYS;
export const LEAD_LABEL: Record<LeadClass, string> = {
  social: "social post",
  flyer: "flyer",
  print: "large-format or print",
  multipage: "brochure or multi-page",
};

export type RequestType = {
  id: string;
  label: string;
  /** Heading it sits under in the requester's dropdown (an optgroup). */
  group?: string;
  lead: LeadClass;
  /** Permit number + QR required. */
  permit?: boolean;
  /** Developer approval is always needed. */
  developer?: boolean;
  /** An announcement about a person (HR or department head approval). */
  person?: boolean;
};

export const CATEGORIES: { id: Category; label: string; help: string }[] = [
  { id: "agents", label: "Agents", help: "Listing ads and boards, client invitations and greetings, events" },
  { id: "hr", label: "HR", help: "People, occasions, recruitment, notices" },
  { id: "procurement", label: "Procurement", help: "Gifts, stationery, signage, print files" },
  { id: "it", label: "IT", help: "Notices, launches, guides, backgrounds" },
  { id: "other", label: "Other admin", help: "Finance, operations, compliance" },
];

/**
 * No built-in request types: managers add their own, in the form builder's "Used for" or in
 * Settings › Request types (stored in settings.ts `types`).
 */
export const REQUEST_TYPES: Record<Category, RequestType[]> = { agents: [], hr: [], procurement: [], it: [], other: [] };

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

export const FORMATS = ["Feed post", "Story", "A4", "Poster", "Roll-up", "Screen", "Custom"] as const;
export const USAGES = ["Instagram", "WhatsApp", "LinkedIn", "Email", "Print", "Event screen"] as const;
export const LANGUAGES = ["English", "Arabic", "Both"] as const;
