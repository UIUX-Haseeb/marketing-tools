/**
 * Demo data shapes. When the CRM team wires this into their stack, these are the
 * types their data should be mapped onto — nothing else in the app depends on the
 * CRM's own schema.
 */
export type Employee = {
  id: string;
  fullName: string;
  designation: string;
  /** ISO date, YYYY-MM-DD. Null when unknown. */
  dateOfBirth: string | null;
  /** Image URL (any origin the canvas may read — same-origin or CORS-enabled) or null. */
  photoUrl: string | null;
  active: boolean;
};

export type GeneratedPost = {
  id: string;
  tool: string;
  templateId: string;
  subject: string;
  source: "demo" | "manual";
  employeeId?: string;
  format?: string;
  bytes?: number;
  createdAt: string;
};

export function birthMonth(e: Employee): number | null {
  if (!e.dateOfBirth) return null;
  const m = Number(e.dateOfBirth.slice(5, 7));
  return m >= 1 && m <= 12 ? m : null;
}

export function birthDay(e: Employee): number | null {
  if (!e.dateOfBirth) return null;
  const d = Number(e.dateOfBirth.slice(8, 10));
  return d >= 1 && d <= 31 ? d : null;
}
