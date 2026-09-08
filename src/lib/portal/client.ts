/**
 * Real Portal client (portal.prov.ae).
 * TODO once the Portal admin supplies the API docs: adjust the endpoint paths and
 * the field mapping in `toEmployee`. Everything else in the app stays the same.
 */
import type { Employee, PortalClient } from "./types";

type PortalEmployeeRaw = Record<string, unknown>;

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

/** Map one raw CRM record onto our Employee shape. Field names are guesses until the docs arrive. */
function toEmployee(raw: PortalEmployeeRaw): Employee {
  const first = str(raw.first_name ?? raw.firstName);
  const last = str(raw.last_name ?? raw.lastName);
  const fullName = str(raw.full_name ?? raw.fullName ?? raw.name) || `${first} ${last}`.trim();
  const dobRaw = str(raw.date_of_birth ?? raw.dateOfBirth ?? raw.dob ?? raw.birthday);
  const dateOfBirth = /^\d{4}-\d{2}-\d{2}/.test(dobRaw) ? dobRaw.slice(0, 10) : null;
  const photo = raw.photo_url ?? raw.photoUrl ?? raw.avatar ?? raw.photo ?? raw.image;
  const status = str(raw.status ?? raw.employment_status ?? "active").toLowerCase();
  return {
    id: str(raw.id ?? raw.employee_id ?? raw.uuid),
    fullName,
    designation: str(raw.designation ?? raw.job_title ?? raw.jobTitle ?? raw.position ?? raw.title),
    dateOfBirth,
    hasPhoto: !!photo,
    active: raw.active === undefined ? !["inactive", "terminated", "resigned", "left"].includes(status) : !!raw.active,
  };
}

export function createPortalClient(baseUrl: string, apiKey: string): PortalClient {
  const base = baseUrl.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
  const photoUrls = new Map<string, string>();

  async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${base}${path}`, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`Portal ${res.status} on ${path}`);
    return (await res.json()) as T;
  }

  return {
    async listEmployees() {
      // TODO: confirm endpoint + pagination with the Portal admin.
      const data = await fetchJson<PortalEmployeeRaw[] | { data: PortalEmployeeRaw[] }>("/api/employees");
      const rows = Array.isArray(data) ? data : data.data;
      const out: Employee[] = [];
      for (const raw of rows) {
        const e = toEmployee(raw);
        const photo = raw.photo_url ?? raw.photoUrl ?? raw.avatar ?? raw.photo ?? raw.image;
        if (typeof photo === "string" && photo) photoUrls.set(e.id, photo.startsWith("http") ? photo : `${base}${photo}`);
        if (e.id && e.fullName) out.push(e);
      }
      return out;
    },
    async getPhoto(id) {
      let url = photoUrls.get(id);
      if (!url) {
        await this.listEmployees();
        url = photoUrls.get(id);
      }
      if (!url) return null;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) return null;
      return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "image/jpeg" };
    },
  };
}
