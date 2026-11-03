/**
 * Design request data model. In the CRM this is the design-requests API; here it's
 * localStorage (store.ts). Attachments keep their name, size and pixel size only.
 */
export type Category = "agents" | "hr" | "procurement" | "it" | "other";

export const STATUSES = ["Submitted", "Returned", "Confirmed", "In progress", "Delivered", "Revision requested", "Closed"] as const;
export type Status = (typeof STATUSES)[number];

export type Attachment = {
  name: string;
  size: number;
  type: string;
  /** Pixel size for images — used for the low-resolution warning. */
  width?: number;
  height?: number;
};

export type Requester = { id: string; name: string; email: string; department: string };

export type RequestDraft = {
  category: Category | "";
  typeId: string;
  title: string;
  brief: string;

  formats: string[];
  customSize: string;
  usages: string[];
  printQuantity: string;
  bleed: boolean;
  language: string;
  sourceFiles: "yes" | "no" | "";

  copy: string;
  copyFiles: Attachment[];
  assets: Attachment[];
  assetsLink: string;
  reference: string;
  referenceFiles: Attachment[];

  permitNumber: string;
  permitQr: Attachment[];
  developerMaterial: boolean;
  developerApproval: Attachment[];
  aboutPerson: boolean;
  personApproval: Attachment[];
  peopleShown: boolean;
  peopleAgreed: boolean;

  deadline: string;
  urgent: boolean;
  urgentReason: string;

  readTerms: boolean;
  proofread: boolean;
  approvalsAttached: boolean;
};

export type HistoryEntry = {
  at: string;
  by: string;
  /** What happened, e.g. "Returned". */
  action: string;
  note?: string;
  /** Who the email notification went to (simulated). */
  emailed?: string[];
};

export type DesignRequest = RequestDraft & {
  id: string;
  /** Short reference shown on cards, e.g. DR-0012. */
  ref: string;
  requester: Requester;
  status: Status;
  created: string;
  updated: string;
  /** Urgent requests wait for the Marketing Director. */
  urgentApproval?: "pending" | "approved" | "declined";
  /** When Marketing returned it: the reply is due 2 working days later or it auto-closes. */
  replyDue?: string;
  reminderSent?: boolean;
  /** Design work has started at least once (cancelling after this adds a flag). */
  workStarted?: boolean;
  revisionRounds: number;
  deliveredAt?: string;
  delivered?: Attachment[];
  closeReason?: "Completed" | "Cancelled" | "Auto-closed";
  history: HistoryEntry[];
};

export type Flag = { at: string; reason: string; requestRef?: string };
