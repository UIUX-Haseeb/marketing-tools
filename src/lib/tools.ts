/**
 * TOOL REGISTRY
 * -------------
 * Every tool in the app is declared here. The dashboard, sidebar and /tools/[slug]
 * route all read from this list, so adding a tool = adding one entry + one component.
 *
 * To add a tool:
 *   1. Create your component in src/tools/<slug>/index.tsx  (default export, can be a client component)
 *   2. Add an entry below with `component: () => import("@/tools/<slug>")`
 *   3. Set `teams` to who should see it. Omit `component` while it's still in progress
 *      and the tool page shows a "coming soon" placeholder.
 */
import type { ComponentType } from "react";
import type { Team } from "@/lib/teams";

export type ToolCategory = "posts";

export interface ToolDef {
  slug: string;
  name: string;
  description: string;
  /** Teams this tool is for (shown as a tag on the home screen; no access control in the demo). */
  teams: Team[];
  category: ToolCategory;
  /** lucide icon name, see src/components/tool-icon.tsx */
  icon: string;
  /** Lazy import of the tool UI. Leave undefined while the tool is being built. */
  component?: () => Promise<{ default: ComponentType }>;
  /** Owner/team member building this tool (shown on the placeholder). */
  owner?: string;
}

export const TOOLS: ToolDef[] = [
  // ── Agents ────────────────────────────────────────────────────────────
  {
    slug: "just-listed",
    name: "Just Listed",
    description: "Create a Just Listed post for a new property.",
    teams: ["AGENTS"],
    category: "posts",
    icon: "House",
    component: () => import("@/tools/listing/just-listed"),
  },
  {
    slug: "just-sold",
    name: "Just Sold",
    description: "Create a Just Sold post for a closed deal.",
    teams: ["AGENTS"],
    category: "posts",
    icon: "BadgeCheck",
    component: () => import("@/tools/listing/just-sold"),
  },

  // ── HR ────────────────────────────────────────────────────────────────
  {
    slug: "onboarding",
    name: "Welcome Aboard",
    description: "Onboarding post for a new joiner — name, designation and photo.",
    teams: ["HR"],
    category: "posts",
    icon: "UserPlus",
    component: () => import("@/tools/onboarding"),
  },
  {
    slug: "birthday",
    name: "Birthday",
    description: "Birthday posts for the month from the employee list — or create one by hand.",
    teams: ["HR", "MARKETING"],
    category: "posts",
    icon: "Cake",
    component: () => import("@/tools/birthday"),
  },
  {
    slug: "baby",
    name: "New Baby",
    description: "It's a Boy / It's a Girl congratulations post.",
    teams: ["HR", "MARKETING"],
    category: "posts",
    icon: "Baby",
    component: () => import("@/tools/baby"),
  },
  {
    slug: "promotion",
    name: "Promotion",
    description: "Congratulations post for a colleague's promotion — name, new designation and photo.",
    teams: ["HR"],
    category: "posts",
    icon: "TrendingUp",
    component: () => import("@/tools/promotion"),
  },
  {
    slug: "marriage",
    name: "Marriage",
    description: "Congratulations post for a colleague's wedding or engagement.",
    teams: ["HR"],
    category: "posts",
    icon: "Heart",
    component: () => import("@/tools/marriage"),
  },
  {
    slug: "condolence",
    name: "Condolence",
    description: "Condolence message for a bereavement.",
    teams: ["HR"],
    category: "posts",
    icon: "Flower2",
    component: () => import("@/tools/condolence"),
  },

];

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}
