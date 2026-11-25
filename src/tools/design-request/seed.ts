/**
 * The blank draft the request form opens with. The board starts empty — no demo requests.
 */
import type { RequestDraft } from "./types";

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
