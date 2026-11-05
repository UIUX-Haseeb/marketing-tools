/**
 * The card record the studio receives for a person — the same row the portal's
 * GET /marketing/tools/business-card returns. Demo: derived from the employee list, since the
 * shared `Employee` type carries no contact details. Swap `cardRecord()` for the real lookup.
 */
import type { Employee } from "@/lib/demo/types";

export interface CardRecord {
  fullName: string;
  /** Printed as the job title; locked on the card. Null hides the line. */
  position: string | null;
  /** RERA broker number; locked on the card. Null (most staff) hides the line. */
  brn: string | null;
  phone: string | null;
  email: string | null;
}

/** Only agents carry a BRN. */
const HAS_BRN = /consultant|specialist|leasing|sales/i;

export function cardRecord(e: Employee): CardRecord {
  const n = Number(e.id.replace(/\D/g, "")) || 1;
  const slug = e.fullName.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/);
  return {
    fullName: e.fullName,
    position: e.designation || null,
    brn: HAS_BRN.test(e.designation) ? String(40000 + n * 1373).slice(0, 5) : null,
    phone: `+971 5${n % 6} ${String(100 + ((n * 37) % 900))} ${String(1000 + ((n * 4241) % 9000))}`,
    email: `${slug[0]}.${slug[slug.length - 1]}@providentestate.com`,
  };
}
