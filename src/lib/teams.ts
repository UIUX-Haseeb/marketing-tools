/** Teams that use the tools. Used only to label tools on the home screen — there is no login. */
export type Team = "AGENTS" | "HR" | "LND" | "MARKETING" | "OTHER";

export const TEAMS: Team[] = ["AGENTS", "HR", "LND", "MARKETING", "OTHER"];

export const TEAM_LABELS: Record<Team, string> = {
  AGENTS: "Agents",
  HR: "HR",
  LND: "Learning & Development",
  MARKETING: "Marketing",
  OTHER: "Other",
};
