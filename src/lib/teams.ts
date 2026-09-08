import type { Team, Role } from "@/generated/prisma/enums";

export type { Team, Role };

export const TEAMS: Team[] = ["AGENTS", "HR", "LND", "MARKETING", "OTHER"];

export const TEAM_LABELS: Record<Team, string> = {
  AGENTS: "Agents",
  HR: "HR",
  LND: "Learning & Development",
  MARKETING: "Marketing",
  OTHER: "Other",
};

export const ROLE_LABELS: Record<Role, string> = {
  MEMBER: "Member",
  ADMIN: "Admin",
};

export function isMarketing(user: { team: Team; role: Role }) {
  return user.team === "MARKETING" || user.role === "ADMIN";
}

export function isAdmin(user: { role: Role }) {
  return user.role === "ADMIN";
}
