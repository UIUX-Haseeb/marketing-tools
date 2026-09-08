import type { MarketingRequest } from "./types";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** Seed requests shown in the queue before anyone submits anything. */
export const DEMO_REQUESTS: MarketingRequest[] = [
  { id: "req-1", type: "video", title: "Reel for Palm Jumeirah penthouse listing", description: "60s vertical reel, drone opener, agent voiceover. Listing PJ-4471.", dueDate: inDays(5), status: "NEW", requester: "Fatima Al Zahra", team: "Agents", createdAt: daysAgo(1) },
  { id: "req-2", type: "campaign-ad", title: "Meta ads set — Dubai Hills townhouses", description: "3 static + 1 story. Use the Q3 offer copy.", dueDate: inDays(9), status: "IN_PROGRESS", requester: "Karim Nasser", team: "Agents", createdAt: daysAgo(3) },
  { id: "req-3", type: "print", title: "Onboarding welcome pack — refresh", description: "Update the cover and the org chart page for the September intake.", dueDate: inDays(14), status: "NEW", requester: "Aisha Khan", team: "HR", createdAt: daysAgo(2) },
  { id: "req-4", type: "presentation", title: "L&D quarterly review deck", description: "Brand the 18-slide deck; charts to follow.", dueDate: null, status: "DONE", requester: "Mariam El Sayed", team: "Learning & Development", createdAt: daysAgo(12) },
  { id: "req-5", type: "social-post", title: "Agent of the month — August", description: "Post + story. Photo attached in shared drive.", dueDate: inDays(2), status: "REJECTED", requester: "Sophie Laurent", team: "Marketing", createdAt: daysAgo(6) },
];
