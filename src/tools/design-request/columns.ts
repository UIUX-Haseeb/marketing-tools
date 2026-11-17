/**
 * The board's columns, in the portal's Photoshoot Requests style: one per status, with Closed
 * split into Completed and Cancelled like the portal. Each column has its own colour, and the
 * moves a card can make by dragging it (the same moves as the buttons in its pop-out).
 */
import type { DesignRequest, Status } from "./types";

export type Column = Exclude<Status, "Closed"> | "Completed" | "Cancelled";
export type Role = "requester" | "marketing";

export const COLUMNS: { id: Column; color: string }[] = [
  { id: "Submitted", color: "#22a6c0" },
  { id: "Returned", color: "#d9921f" },
  { id: "Confirmed", color: "#7c5cf2" },
  { id: "In progress", color: "#ef7d32" },
  { id: "Delivered", color: "#1e9ed6" },
  { id: "Revision requested", color: "#d6487a" },
  { id: "Completed", color: "#2f9e5f" },
  { id: "Cancelled", color: "#6b7280" },
];

export const colorOf = (c: Column) => COLUMNS.find((x) => x.id === c)!.color;

export const columnOf = (r: DesignRequest): Column => (r.status === "Closed" ? (r.closeReason === "Completed" ? "Completed" : "Cancelled") : r.status);

/** What dropping a card on a column does. "assign" / "return" / … open a dialog first. */
export type Move = "assign" | "return" | "start" | "deliver" | "complete" | "revision" | "cancel" | "edit";

export function moveTo(r: DesignRequest, to: Column, role: Role): Move | null {
  const from = columnOf(r);
  if (from === to || from === "Completed" || from === "Cancelled") return null;
  if (to === "Cancelled" && ["Submitted", "Returned", "Confirmed", "In progress"].includes(from)) return "cancel";
  if (role === "marketing") {
    if (from === "Submitted" && to === "Confirmed") return r.urgentApproval === "pending" ? null : "assign";
    if (from === "Submitted" && to === "Returned") return "return";
    if (from === "Confirmed" && to === "In progress") return "start";
    if ((from === "In progress" || from === "Revision requested") && to === "Delivered") return "deliver";
    if (from === "Delivered" && to === "Completed") return "complete";
  } else {
    if (from === "Returned" && to === "Submitted") return "edit";
    if (from === "Delivered" && to === "Revision requested") return "revision";
    if (from === "Delivered" && to === "Completed") return "complete";
  }
  return null;
}

/** The "How it works" panel above the board. */
export const HOW_IT_WORKS: [Column, string][] = [
  ["Submitted", "A new request waits here, seen by Marketing only. Check the brief, the copy and the approvals. If something is missing, open the card and choose “Return with a note”. An urgent request waits for the Marketing Director first."],
  ["Returned", "The requester fixes the request and sends it again, and it comes back to Submitted. With no reply in 2 working days it closes by itself and adds a flag."],
  ["Confirmed", "Marketing drags the card here and picks the designer. That schedules the work: the request is locked from now on, and the requester gets the confirmation."],
  ["In progress", "When the designer starts, drag the card here. Cancelling from now on adds a flag to the requester."],
  ["Delivered", "When the design is ready, drag the card here and upload the files. The requester has 2 working days to send one list of changes (2 rounds included) — the card moves to Revision requested — or to accept it."],
  ["Completed", "The requester accepts the design, or Marketing drags the card here. That is the end."],
];
