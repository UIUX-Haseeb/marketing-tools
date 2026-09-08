/**
 * Employee record as the app needs it. The Portal adapter maps the CRM's own
 * field names onto this shape so tools never depend on the CRM's schema.
 */
export type Employee = {
  id: string;
  fullName: string;
  designation: string;
  /** ISO date, YYYY-MM-DD. Null when the CRM has no DOB. */
  dateOfBirth: string | null;
  /** True when the CRM has a profile photo. Fetch it via /api/portal/photo/[id]. */
  hasPhoto: boolean;
  active: boolean;
};

export interface PortalClient {
  /** All active employees (the list is small enough to fetch whole and filter locally). */
  listEmployees(): Promise<Employee[]>;
  /** Raw photo bytes + content type, or null when there is none. */
  getPhoto(id: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null>;
}

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
