/**
 * The agent, from the Prov Toys demo employee list. The list has no phone, email or BRN —
 * those are placeholders until the CRM supplies them.
 */
import type { Employee } from "@/lib/demo/types";
import type { Agent } from "./types";

const emailFor = (name: string) =>
  `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".")}@providentestate.com`;

export function agentFrom(e: Employee): Agent {
  return { employeeId: e.id, name: e.fullName, position: e.designation, photo: e.photoUrl, zoom: 1, mobile: "+971 50 123 4567", email: emailFor(e.fullName), brn: "12345" };
}
