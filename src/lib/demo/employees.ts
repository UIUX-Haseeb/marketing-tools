/**
 * DEMO EMPLOYEES — stands in for the CRM. Replace `listEmployees()` with the real
 * source when integrating; keep the `Employee` shape.
 * Photos are generated SVG portraits (initials on a brand colour) as data URLs.
 */
import type { Employee } from "./types";

const PEOPLE: Array<[string, string, string | null, boolean]> = [
  ["Fatima Al Zahra", "Senior Property Consultant", "1991-01-14", true],
  ["Omar Haddad", "Property Consultant", "1988-01-27", true],
  ["Layla Mansour", "Head of Leasing", "1985-02-03", true],
  ["Yusuf Rahman", "Sales Director", "1979-02-19", false],
  ["Noor Al Sayegh", "Marketing Executive", "1996-03-08", true],
  ["Karim Nasser", "Senior Property Consultant", "1990-03-22", true],
  ["Aisha Khan", "HR Business Partner", "1993-04-11", true],
  ["Daniel Okafor", "Property Consultant", "1994-05-05", true],
  ["Mariam El Sayed", "Learning & Development Lead", "1987-06-30", true],
  ["Rashid Al Maktoum", "Off-Plan Specialist", "1992-07-17", true],
  ["Sophie Laurent", "Client Relations Manager", "1989-08-09", true],
  ["Hamza Siddiqui", "Property Consultant", "1995-09-08", true],
  ["Elena Petrova", "Senior Property Consultant", "1986-09-21", true],
  ["Tariq Bin Saeed", "Mortgage Advisor", "1984-10-02", false],
  ["Priya Nair", "Operations Manager", "1990-11-25", true],
  ["Ahmed Al Farsi", "Managing Partner", "1978-12-12", true],
  ["Chloe Bennett", "Property Consultant", "1997-12-31", true],
  ["Zainab Hussain", "Executive Assistant", null, true],
];

const PALETTE = ["#1A2942", "#2F4960", "#1C6E8C", "#B0905C", "#54687E"];

function portraitDataUrl(fullName: string, i: number) {
  const initials = fullName.split(/\s+/).slice(0, 2).map((s) => s[0]).join("");
  const bg = PALETTE[i % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="${bg}"/><circle cx="500" cy="380" r="170" fill="#FAF8F4" fill-opacity="0.18"/><ellipse cx="500" cy="900" rx="330" ry="290" fill="#FAF8F4" fill-opacity="0.18"/><text x="500" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="600" fill="#FAF8F4" fill-opacity="0.9">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const EMPLOYEES: Employee[] = PEOPLE.map(([fullName, designation, dateOfBirth, hasPhoto], i) => ({
  id: `emp-${i + 1}`,
  fullName,
  designation,
  dateOfBirth,
  photoUrl: hasPhoto ? portraitDataUrl(fullName, i) : null,
  active: true,
}));

/** All active employees. Swap the body of this function for the real CRM call. */
export async function listEmployees(): Promise<Employee[]> {
  await new Promise((r) => setTimeout(r, 200)); // feel like a fetch
  return EMPLOYEES.filter((e) => e.active);
}
