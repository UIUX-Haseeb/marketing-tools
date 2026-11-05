/**
 * The agent's contact page — what the e-card's QR opens (/card/<id>), like the portal's: the person
 * comes from the employee record, and anything the agent edited on the card rides along in the URL
 * (short keys, only what differs from the record) so the QR stays coarse. A photo can't fit in a
 * URL, so the page always shows the record's profile photo. In the CRM the id would be the agent's
 * real profile; here it's a demo employee.
 */
import { EMPLOYEES } from "@/lib/demo/employees";
import { cardRecord } from "@/tools/_shared/card-record";

export interface Contact {
  /** Employee id, or "card" for a card made for nobody on the list. */
  id: string;
  name: string;
  title: string;
  brn: string;
  phone: string;
  email: string;
  /** Profile photo (path or data URL); "" = none. */
  photo: string;
}

export const COMPANY = "Provident Real Estate";
export const OFFICE = { street: "Business Park 4 Building, Dubai Hills Estate", city: "Dubai", country: "United Arab Emirates" };
export const WEBSITE = "https://www.providentestate.com";
export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Provident Real Estate, Business Park 4, Dubai Hills Estate, Dubai")}`;

/** Provident's own channels, as linked from providentestate.com. */
export const SOCIALS = [
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/providentestate" },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/providentestate" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/providentestate" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@Providentestate" },
  { id: "x", label: "X", url: "https://twitter.com/providentagents" },
  { id: "telegram", label: "Telegram", url: "https://t.me/dubaipropertynews" },
] as const;

const KEYS = { name: "n", title: "t", brn: "b", phone: "m", email: "e" } as const;
type Field = keyof typeof KEYS;
const FIELDS = Object.keys(KEYS) as Field[];

export const digits = (phone: string) => phone.replace(/[^\d+]/g, "");

/** The contact as the employee record has it, or null for an unknown id. */
export function recordContact(id: string): Contact | null {
  const e = EMPLOYEES.find((x) => x.id === id);
  if (!e) return null;
  const r = cardRecord(e);
  return { id, name: r.fullName, title: r.position ?? "", brn: r.brn ?? "", phone: r.phone ?? "", email: r.email ?? "", photo: e.photoUrl ?? "" };
}

/** /card/<id>?… — the record's id plus only the fields the agent changed. */
export function contactPath(c: Contact): string {
  const base = recordContact(c.id);
  const q = new URLSearchParams();
  for (const f of FIELDS) {
    const v = c[f].trim();
    if (v !== (base?.[f] ?? "")) q.set(KEYS[f], v);
  }
  const s = q.toString();
  return `/card/${base ? c.id : "card"}${s ? `?${s}` : ""}`;
}

/** The page's contact: the record, with the URL's edits on top. Null when there's nobody to show. */
export function contactFromParams(id: string, params: Record<string, string | string[] | undefined>): Contact | null {
  const base = recordContact(id) ?? { id: "card", name: "", title: "", brn: "", phone: "", email: "", photo: "" };
  const c = { ...base };
  for (const f of FIELDS) {
    const v = params[KEYS[f]];
    if (typeof v === "string") c[f] = v.slice(0, 120);
  }
  return c.name.trim() ? c : null;
}
