/**
 * Request types by requester group (handover Appendix B), with the lead time each one needs and
 * the approvals it triggers. Lead times are the handover's drafts — still to confirm.
 */
import type { Category } from "./types";

/** Lead-time class → working days (drafts: social post [2], flyer [3], large-format or print [5], brochure or multi-page [10]). */
export const LEAD_DAYS = { social: 2, flyer: 3, print: 5, multipage: 10 } as const;
export type LeadClass = keyof typeof LEAD_DAYS;
export const LEAD_LABEL: Record<LeadClass, string> = {
  social: "social post",
  flyer: "flyer",
  print: "large-format or print",
  multipage: "brochure or multi-page",
};

export type RequestType = {
  id: string;
  label: string;
  /** Family (Agents subgroup) — shown as an optgroup. */
  group?: string;
  lead: LeadClass;
  /** Permit number + QR required (Agents › Listings and deals). */
  permit?: boolean;
  /** Developer approval is always needed. */
  developer?: boolean;
  /** An announcement about a person (HR or department head approval). */
  person?: boolean;
};

const LISTINGS = "Listings and deals (permit number and QR required)";

export const CATEGORIES: { id: Category; label: string; help: string }[] = [
  { id: "agents", label: "Agents", help: "Listings, personal branding, clients, events" },
  { id: "hr", label: "HR", help: "People, occasions, recruitment, notices" },
  { id: "procurement", label: "Procurement", help: "Gifts, stationery, signage, print files" },
  { id: "it", label: "IT", help: "Notices, launches, guides, backgrounds" },
  { id: "other", label: "Other admin", help: "Finance, operations, compliance" },
];

export const REQUEST_TYPES: Record<Category, RequestType[]> = {
  agents: [
    { id: "ag-just-listed", group: LISTINGS, label: "Just Listed, Open House and Just Sold posts, stories and carousels", lead: "social", permit: true },
    { id: "ag-one-pager", group: LISTINGS, label: "Property one-pager, brochure or fact sheet", lead: "multipage", permit: true },
    { id: "ag-off-plan", group: LISTINGS, label: "Off-plan launch creatives built from developer material (needs developer approval)", lead: "flyer", permit: true, developer: true },
    { id: "ag-pvh", group: LISTINGS, label: "PVH vacation home listing posts", lead: "social", permit: true },
    { id: "ag-paid-ads", group: LISTINGS, label: "Paid ad creatives (Meta ads, banners) for a specific listing or project", lead: "social", permit: true },
    { id: "ag-board", group: LISTINGS, label: "For Sale / To Let board artwork", lead: "print", permit: true },
    { id: "ag-business-card", group: "Personal branding", label: "Business card", lead: "print" },
    { id: "ag-signature", group: "Personal branding", label: "Email signature", lead: "flyer" },
    { id: "ag-intro", group: "Personal branding", label: "Agent intro or “meet your agent” post", lead: "social" },
    { id: "ag-milestone", group: "Personal branding", label: "Milestone, award or achievement post", lead: "social" },
    { id: "ag-testimonial", group: "Personal branding", label: "Testimonial graphic", lead: "social" },
    { id: "ag-reel-cover", group: "Personal branding", label: "Reel cover or video thumbnail", lead: "social" },
    { id: "ag-market-update", group: "Client and market communication", label: "Market update infographic or report carousel", lead: "flyer" },
    { id: "ag-invitation", group: "Client and market communication", label: "Investor evening or launch preview invitation", lead: "flyer" },
    { id: "ag-whatsapp", group: "Client and market communication", label: "WhatsApp broadcast creative", lead: "social" },
    { id: "ag-deck-cover", group: "Client and market communication", label: "Client presentation or pitch deck cover", lead: "flyer" },
    { id: "ag-floor-plan", group: "Client and market communication", label: "Floor plan layout", lead: "flyer" },
    { id: "ag-greetings", group: "Client and market communication", label: "Greeting cards for clients (Eid, Ramadan, National Day, New Year)", lead: "social" },
    { id: "ag-roadshow", group: "Events", label: "Roadshow or exhibition roll-ups, backdrops and booth graphics", lead: "print" },
    { id: "ag-open-house", group: "Events", label: "Open house flyers and signage", lead: "flyer" },
  ],
  hr: [
    { id: "hr-birthday", label: "Birthday and work anniversary cards", lead: "social", person: true },
    { id: "hr-new-joiner", label: "New joiner welcome post", lead: "social", person: true },
    { id: "hr-promotion", label: "Promotion announcement", lead: "social", person: true },
    { id: "hr-top-agents", label: "Top Agents of the Month, awards and recognition posts or certificates", lead: "flyer", person: true },
    { id: "hr-invitations", label: "Event invitations: town hall, team building, iftar, annual party", lead: "flyer" },
    { id: "hr-greetings", label: "Occasion greetings: Eid, Ramadan, National Day, Women’s Day, Mother’s Day", lead: "social" },
    { id: "hr-recruitment", label: "Recruitment: job openings, LinkedIn hiring posts, agent recruitment campaign", lead: "social" },
    { id: "hr-posters", label: "Policy and notice posters: leave, dress code, code of conduct, working hours", lead: "flyer" },
    { id: "hr-training", label: "Training and orientation: workshop flyers, onboarding deck, welcome pack", lead: "multipage" },
    { id: "hr-id-cards", label: "Staff ID cards and lanyards", lead: "print" },
    { id: "hr-org-charts", label: "Org charts", lead: "flyer" },
    { id: "hr-sensitive", label: "Sensitive announcements such as condolences (needs HR or senior approval first)", lead: "social", person: true },
  ],
  procurement: [
    { id: "pr-gifts", label: "Corporate gift artwork: diaries, notebooks, mugs, pens, tote bags, calendars", lead: "print" },
    { id: "pr-packaging", label: "Hamper or gift packaging, stickers and cards", lead: "print" },
    { id: "pr-stationery", label: "Stationery: letterhead, envelopes, folders, notepads, compliment slips", lead: "print" },
    { id: "pr-uniforms", label: "Uniforms and polo shirts", lead: "print" },
    { id: "pr-signage", label: "Office and event signage artwork, ready for the printer", lead: "print" },
    { id: "pr-vehicle", label: "Vehicle branding or wraps", lead: "print" },
    { id: "pr-exhibition", label: "Exhibition stand and roll-up print files", lead: "print" },
    { id: "pr-print-check", label: "Vendor print specs and artwork checks before a print run", lead: "flyer" },
  ],
  it: [
    { id: "it-signature", label: "Email signature rollout (the master template)", lead: "flyer" },
    { id: "it-phishing", label: "Phishing and cybersecurity awareness posters", lead: "flyer" },
    { id: "it-downtime", label: "System downtime and maintenance notices", lead: "social" },
    { id: "it-launch", label: "Portal, CRM or new-tool launch announcements", lead: "social" },
    { id: "it-guides", label: "How-to guides and training one-pagers (for example, how to use the design request form)", lead: "multipage" },
    { id: "it-banners", label: "Portal banners, icons and intranet graphics", lead: "flyer" },
    { id: "it-backgrounds", label: "Teams or Zoom backgrounds, wallpapers and screensavers", lead: "social" },
    { id: "it-wifi", label: "Wi-Fi and access instruction signs, QR posters", lead: "flyer" },
  ],
  other: [
    { id: "ot-finance", label: "Finance: invoice and receipt templates, payment instruction notices", lead: "flyer" },
    { id: "ot-operations", label: "Operations and office management: meeting room signs, wayfinding, office move notices, event setups", lead: "print" },
    { id: "ot-compliance", label: "Compliance and legal: disclaimer footers, permit notice posters", lead: "flyer" },
  ],
};

export const ALL_TYPES = Object.values(REQUEST_TYPES).flat();
export const typeById = (id: string) => ALL_TYPES.find((t) => t.id === id);
export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

export const FORMATS = ["Feed post", "Story", "A4", "Poster", "Roll-up", "Screen", "Custom"] as const;
export const USAGES = ["Instagram", "WhatsApp", "LinkedIn", "Email", "Print", "Event screen"] as const;
export const LANGUAGES = ["English", "Arabic", "Both"] as const;
