/**
 * Demo requests (one or more in every status) and the blank / sample drafts the form opens with.
 */
import { addWorkingDays, isoDay } from "./rules";
import type { DesignRequest, Requester, RequestDraft } from "./types";

export function blankDraft(): RequestDraft {
  return {
    category: "", typeId: "", title: "", brief: "",
    formats: [], customSize: "", usages: [], printQuantity: "", bleed: false, language: "", sourceFiles: "",
    copy: "", copyFiles: [], assets: [], assetsLink: "", reference: "", referenceFiles: [],
    permitNumber: "", permitQr: [], developerMaterial: false, developerApproval: [], aboutPerson: false, personApproval: [], peopleShown: false, peopleAgreed: false,
    deadline: "", urgent: false, urgentReason: "",
    readTerms: false, proofread: false, approvalsAttached: false,
  };
}

/** A filled-in Just Listed request for testing without typing (terms left unticked). */
export function sampleDraft(): RequestDraft {
  return {
    ...blankDraft(),
    category: "agents",
    typeId: "ag-just-listed",
    title: "Just Listed — 2BR in Marina Gate 1",
    brief: "Just Listed post and story for a 2-bedroom apartment in Marina Gate 1, high floor with full marina view. Use the living room photo as the hero.",
    formats: ["Feed post", "Story"],
    usages: ["Instagram", "WhatsApp"],
    language: "English",
    sourceFiles: "no",
    copy: "JUST LISTED\nMarina Gate 1, Dubai Marina\n2 Bedrooms · 1,250 sq ft · Full marina view\nAED 3,400,000\nCall Fatima Al Zahra · +971 50 000 0000",
    assetsLink: "https://drive.google.com/drive/folders/marina-gate-1",
    permitNumber: "7114992033",
    permitQr: [{ name: "permit-qr-7114992033.png", size: 18_400, type: "image/png", width: 600, height: 600 }],
    deadline: isoDay(addWorkingDays(new Date(), 3)),
  };
}

const fatima: Requester = { id: "emp-1", name: "Fatima Al Zahra", email: "fatima.al.zahra@provident.demo", department: "Sales" };
const omar: Requester = { id: "emp-2", name: "Omar Haddad", email: "omar.haddad@provident.demo", department: "Sales" };
const aisha: Requester = { id: "emp-7", name: "Aisha Khan", email: "aisha.khan@provident.demo", department: "HR" };
const priya: Requester = { id: "emp-15", name: "Priya Nair", email: "priya.nair@provident.demo", department: "Operations" };

const at = (d: string) => `${d}T09:30:00.000Z`;
const MKT = "design-requests@provident.demo";

function req(p: Partial<DesignRequest> & Pick<DesignRequest, "ref" | "requester" | "status" | "category" | "typeId" | "title" | "brief" | "created">): DesignRequest {
  return {
    ...blankDraft(),
    language: "English",
    sourceFiles: "no",
    readTerms: true,
    proofread: true,
    approvalsAttached: true,
    id: p.ref,
    updated: p.created,
    revisionRounds: 0,
    history: [{ at: p.created, by: p.requester.name, action: "Submitted", emailed: [p.requester.email, MKT] }],
    ...p,
  };
}

export const SEED: DesignRequest[] = [
  req({
    ref: "DR-0001", requester: aisha, status: "Delivered", category: "hr", typeId: "hr-new-joiner", created: at("2026-10-26"),
    title: "Welcome post — three new joiners, November", brief: "Welcome post for the three consultants joining the Marina office on 3 November, one card each in the Welcome Aboard style.",
    formats: ["Feed post"], usages: ["LinkedIn", "Instagram"], copy: "Welcome aboard, Daniel, Hamza and Chloe!", aboutPerson: true, peopleShown: true, peopleAgreed: true,
    personApproval: [{ name: "hr-approval.pdf", size: 82_000, type: "application/pdf" }], assets: [{ name: "headshots.zip", size: 14_200_000, type: "application/zip" }],
    deadline: "2026-10-30", workStarted: true, deliveredAt: new Date().toISOString(), delivered: [{ name: "welcome-aboard-x3.zip", size: 6_400_000, type: "application/zip" }],
  }),
  req({
    ref: "DR-0002", requester: priya, status: "In progress", category: "other", typeId: "ot-operations", created: at("2026-10-27"),
    title: "Meeting room signs — 4th floor", brief: "Door signs for the six meeting rooms on the 4th floor after the move. Same size as the current acrylic plates, room names below.",
    formats: ["Custom"], customSize: "300 × 100 mm", usages: ["Print"], printQuantity: "6", bleed: true, copy: "Burj · Marina · Creek · Palm · Hatta · Liwa", assetsLink: "https://drive.google.com/drive/folders/office-move",
    deadline: "2026-11-10", workStarted: true,
  }),
  req({
    ref: "DR-0003", requester: omar, status: "Returned", category: "agents", typeId: "ag-one-pager", created: at("2026-10-29"),
    title: "Fact sheet — Creek Horizon 3BR", brief: "One-page fact sheet for a 3BR in Creek Horizon tower 2 for an investor meeting, with the payment plan and floor plan.",
    formats: ["A4"], usages: ["Email", "Print"], printQuantity: "20", copy: "Price: TBC", assetsLink: "https://drive.google.com/drive/folders/creek-horizon",
    permitNumber: "6633018211", permitQr: [{ name: "qr.png", size: 9_000, type: "image/png", width: 400, height: 400 }], deadline: "2026-11-14",
    replyDue: addWorkingDays(new Date(), 1).toISOString(),
    history: [
      { at: at("2026-10-29"), by: "Omar Haddad", action: "Submitted", emailed: ["omar.haddad@provident.demo", MKT] },
      { at: at("2026-10-30"), by: "Marketing & Design", action: "Returned — flagged as placeholder or incomplete", note: "The price says TBC and there's no floor plan in the Drive folder. Please send the final price and the floor plan.", emailed: ["omar.haddad@provident.demo"] },
    ],
  }),
  req({
    ref: "DR-0004", requester: fatima, status: "Submitted", category: "agents", typeId: "ag-milestone", created: at("2026-11-02"),
    title: "AED 50M milestone post", brief: "Post celebrating AED 50M in closed sales this year, in the Sales Achievement look, with my portrait and the two headline numbers.",
    formats: ["Feed post", "Story"], usages: ["Instagram", "LinkedIn"], copy: "AED 50M closed in 2026 · 38 transactions", assets: [{ name: "portrait.jpg", size: 3_100_000, type: "image/jpeg", width: 3000, height: 4000 }],
    deadline: "2026-11-07", urgent: true, urgentReason: "Award evening on 7 November", urgentApproval: "pending",
  }),
  req({
    ref: "DR-0005", requester: aisha, status: "Confirmed", category: "hr", typeId: "hr-invitations", created: at("2026-10-31"),
    title: "Annual party invitation", brief: "Invitation for the annual party on 12 December at the Address Sky View, with dress code and RSVP link. Email and a WhatsApp version.",
    formats: ["A4", "Story"], usages: ["Email", "WhatsApp"], language: "Both", copy: "Provident Annual Party · Friday 12 December · 7 PM · Address Sky View · Dress code: Black tie · RSVP by 1 December", assetsLink: "https://drive.google.com/drive/folders/annual-party",
    deadline: "2026-11-17",
  }),
  req({
    ref: "DR-0006", requester: priya, status: "Closed", closeReason: "Completed", category: "other", typeId: "ot-compliance", created: at("2026-10-14"),
    title: "Permit notice poster — reception", brief: "A3 poster for reception explaining that every property ad carries its DLD permit number and QR code, for walk-in clients.",
    formats: ["Poster"], usages: ["Print"], printQuantity: "2", copy: "Every Provident advertisement carries a valid DLD permit. Scan the QR code to check it.", assetsLink: "https://drive.google.com/drive/folders/compliance",
    deadline: "2026-10-21", workStarted: true, deliveredAt: at("2026-10-20"),
  }),
];
