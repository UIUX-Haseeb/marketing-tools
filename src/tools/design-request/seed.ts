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

/** A filled-in listing ad request for testing without typing (terms left unticked). */
export function sampleDraft(): RequestDraft {
  return {
    ...blankDraft(),
    category: "agents",
    typeId: "ag-paid-ads",
    title: "Meta ad — 2BR in Marina Gate 1",
    brief: "Meta ad creatives, feed and story, for a 2-bedroom apartment in Marina Gate 1, high floor with full marina view. Use the living room photo as the hero.",
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
const karim: Requester = { id: "emp-6", name: "Karim Nasser", email: "karim.nasser@provident.demo", department: "Sales" };
const daniel: Requester = { id: "emp-8", name: "Daniel Okafor", email: "daniel.okafor@provident.demo", department: "Sales" };

/** Seed dates are relative to today so the board always looks current. */
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoDay(d);
};
const at = (offset: number) => `${day(offset)}T09:30:00.000Z`;
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

const step = (offset: number, action: string, emailTo: string, note?: string, by = "Marketing & Design") => ({ at: at(offset), by, action, note, emailed: [emailTo] });

export const SEED: DesignRequest[] = [
  req({
    ref: "DR-0001", requester: aisha, status: "Delivered", category: "hr", typeId: "hr-new-joiner", created: at(-8), designer: "Joanna Cruz",
    title: "Welcome post — three new joiners", brief: "Welcome post for the three consultants joining the Marina office next week, one card each in the Welcome Aboard style.",
    formats: ["Feed post"], usages: ["LinkedIn", "Instagram"], copy: "Welcome aboard, Daniel, Hamza and Chloe!", aboutPerson: true, peopleShown: true, peopleAgreed: true,
    personApproval: [{ name: "hr-approval.pdf", size: 82_000, type: "application/pdf" }], assets: [{ name: "headshots.zip", size: 14_200_000, type: "application/zip" }],
    deadline: day(-1), workStarted: true, deliveredAt: new Date().toISOString(), delivered: [{ name: "welcome-aboard-x3.zip", size: 6_400_000, type: "application/zip" }],
    history: [
      { at: at(-8), by: "Aisha Khan", action: "Submitted", emailed: ["aisha.khan@provident.demo", MKT] },
      step(-7, "Confirmed — assigned to Joanna Cruz", "aisha.khan@provident.demo"),
      step(-4, "Design work started", "aisha.khan@provident.demo"),
      step(0, "Delivered", "aisha.khan@provident.demo"),
    ],
  }),
  req({
    ref: "DR-0002", requester: priya, status: "In progress", category: "other", typeId: "ot-operations", created: at(-6), designer: "Rami Aziz",
    title: "Meeting room signs — 4th floor", brief: "Door signs for the six meeting rooms on the 4th floor after the move. Same size as the current acrylic plates, room names below.",
    formats: ["Custom"], customSize: "300 × 100 mm", usages: ["Print"], printQuantity: "6", bleed: true, copy: "Burj · Marina · Creek · Palm · Hatta · Liwa", assetsLink: "https://drive.google.com/drive/folders/office-move",
    deadline: day(3), workStarted: true,
    history: [
      { at: at(-6), by: "Priya Nair", action: "Submitted", emailed: ["priya.nair@provident.demo", MKT] },
      step(-5, "Confirmed — assigned to Rami Aziz", "priya.nair@provident.demo"),
      step(-1, "Design work started", "priya.nair@provident.demo"),
    ],
  }),
  req({
    ref: "DR-0003", requester: omar, status: "Returned", category: "agents", typeId: "ag-invitation", created: at(-2),
    title: "Investor evening — Creek Horizon", brief: "Invitation for an investor evening presenting Creek Horizon tower 2, with the date, venue, dress code and an RSVP link. Email and WhatsApp versions.",
    formats: ["A4", "Story"], usages: ["Email", "WhatsApp"], copy: "Creek Horizon Investor Evening · Thursday 7 PM · Venue: TBC · RSVP to Omar Haddad", assetsLink: "https://drive.google.com/drive/folders/creek-horizon",
    deadline: day(8),
    replyDue: addWorkingDays(new Date(), 1).toISOString(),
    history: [
      { at: at(-2), by: "Omar Haddad", action: "Submitted", emailed: ["omar.haddad@provident.demo", MKT] },
      step(-1, "Returned — flagged as placeholder or incomplete", "omar.haddad@provident.demo", "The venue says TBC and there's no RSVP link. Please send the confirmed venue and the RSVP link."),
    ],
  }),
  req({
    ref: "DR-0004", requester: fatima, status: "Submitted", category: "agents", typeId: "ag-greetings", created: at(-1),
    title: "National Day greeting for clients", brief: "UAE National Day greeting card for my clients, a feed post and a WhatsApp version, with my name and photo at the bottom in the brand style.",
    formats: ["Feed post", "Story"], usages: ["Instagram", "WhatsApp"], language: "Both", copy: "Happy 55th UAE National Day · From Fatima Al Zahra and the Provident family", assets: [{ name: "portrait.jpg", size: 3_100_000, type: "image/jpeg", width: 3000, height: 4000 }],
    deadline: day(2), urgent: true, urgentReason: "Has to go out before the National Day weekend", urgentApproval: "pending",
  }),
  req({
    ref: "DR-0005", requester: aisha, status: "Confirmed", category: "hr", typeId: "hr-invitations", created: at(-3), designer: "Lina Farouk",
    title: "Annual party invitation", brief: "Invitation for the annual party on 12 December at the Address Sky View, with dress code and RSVP link. Email and a WhatsApp version.",
    formats: ["A4", "Story"], usages: ["Email", "WhatsApp"], language: "Both", copy: "Provident Annual Party · Friday 12 December · 7 PM · Address Sky View · Dress code: Black tie · RSVP by 1 December", assetsLink: "https://drive.google.com/drive/folders/annual-party",
    deadline: day(6),
    history: [
      { at: at(-3), by: "Aisha Khan", action: "Submitted", emailed: ["aisha.khan@provident.demo", MKT] },
      step(-2, "Confirmed — assigned to Lina Farouk", "aisha.khan@provident.demo"),
    ],
  }),
  req({
    ref: "DR-0006", requester: priya, status: "Closed", closeReason: "Completed", category: "other", typeId: "ot-compliance", created: at(-20), designer: "Joanna Cruz",
    title: "Permit notice poster — reception", brief: "A3 poster for reception explaining that every property ad carries its DLD permit number and QR code, for walk-in clients.",
    formats: ["Poster"], usages: ["Print"], printQuantity: "2", copy: "Every Provident advertisement carries a valid DLD permit. Scan the QR code to check it.", assetsLink: "https://drive.google.com/drive/folders/compliance",
    deadline: day(-12), workStarted: true, deliveredAt: at(-13), delivered: [{ name: "permit-poster-a3.pdf", size: 2_200_000, type: "application/pdf" }],
  }),
  req({
    ref: "DR-0007", requester: karim, status: "Revision requested", category: "agents", typeId: "ag-paid-ads", created: at(-5), designer: "Noor Al Sayegh",
    title: "Meta ads — Palm villa", brief: "Meta ad creatives, feed and story, for a 5-bedroom signature villa on the Palm, beach-facing. Use the pool photo as the hero image.",
    formats: ["Feed post", "Story"], usages: ["Instagram"], copy: "Signature Villa, Palm Jumeirah · 5 Bedrooms · Private beach · AED 48,000,000", permitNumber: "7019920114",
    permitQr: [{ name: "permit-qr.png", size: 12_000, type: "image/png", width: 600, height: 600 }], assetsLink: "https://drive.google.com/drive/folders/palm-villa",
    deadline: day(1), workStarted: true, revisionRounds: 1, deliveredAt: at(-1), delivered: [{ name: "meta-ads-palm-v1.zip", size: 4_100_000, type: "application/zip" }],
    history: [
      { at: at(-5), by: "Karim Nasser", action: "Submitted", emailed: ["karim.nasser@provident.demo", MKT] },
      step(-4, "Confirmed — assigned to Noor Al Sayegh", "karim.nasser@provident.demo"),
      step(-3, "Design work started", "karim.nasser@provident.demo"),
      step(-1, "Delivered", "karim.nasser@provident.demo"),
      step(0, "Revision 1 of 2 requested", MKT, "1. Use the sunset pool photo instead\n2. The price should read AED 48M", "Karim Nasser"),
    ],
  }),
  req({
    ref: "DR-0008", requester: daniel, status: "Submitted", category: "agents", typeId: "ag-open-house", created: at(0),
    title: "Open house — Downtown 2BR", brief: "Open house post for Saturday at Burj Royale, 2BR on a high floor with Burj Khalifa view. Times 11 AM to 3 PM, RSVP to my WhatsApp.",
    formats: ["Feed post"], usages: ["Instagram"], copy: "OPEN HOUSE · Burj Royale, Downtown · Saturday 11 AM – 3 PM · RSVP +971 50 000 0001", permitNumber: "7120033891",
    permitQr: [{ name: "qr-burj-royale.png", size: 10_000, type: "image/png", width: 600, height: 600 }], assets: [{ name: "living-room.jpg", size: 900_000, type: "image/jpeg", width: 1200, height: 800 }],
    deadline: day(4),
  }),
  req({
    ref: "DR-0009", requester: omar, status: "Closed", closeReason: "Cancelled", category: "agents", typeId: "ag-board", created: at(-9),
    title: "For Sale board — JVC townhouse", brief: "For Sale board for the 3BR townhouse in JVC district 12. The owner took it off the market, so this is no longer needed.",
    formats: ["Custom"], customSize: "120 × 80 cm", usages: ["Print"], printQuantity: "1", bleed: true, copy: "FOR SALE · Provident Real Estate · Call Omar Haddad +971 50 000 0002", permitNumber: "7004417720", deadline: day(-4),
    history: [
      { at: at(-9), by: "Omar Haddad", action: "Submitted", emailed: ["omar.haddad@provident.demo", MKT] },
      step(-8, "Cancelled (no flag)", "omar.haddad@provident.demo", undefined, "Omar Haddad"),
    ],
  }),
];
