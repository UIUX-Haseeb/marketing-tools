/** Teams the tools are made for. Used only to tag tools on the home screen — there is no login here. */
export type Team = "AGENTS" | "HR" | "LND" | "MARKETING" | "OTHER";

export const TEAM_LABELS: Record<Team, string> = {
  AGENTS: "Agents",
  HR: "HR",
  LND: "Learning & Development",
  MARKETING: "Marketing",
  OTHER: "Other",
};
