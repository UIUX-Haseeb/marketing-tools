"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, TEAMS } from "@/lib/teams";
import type { Team, Role } from "@/lib/teams";

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new Error("Admins only");
  return user;
}

const domain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "providentestate.com").toLowerCase();

const AddUser = z.object({
  email: z.email().transform((e) => e.toLowerCase()).refine((e) => e.endsWith(`@${domain}`), `Must be an @${domain} address`),
  name: z.string().max(100).optional(),
  team: z.enum(TEAMS as [Team, ...Team[]]),
  role: z.enum(["MEMBER", "ADMIN"]),
});

export async function addUser(formData: FormData) {
  await requireAdmin();
  const data = AddUser.parse({
    email: formData.get("email"),
    name: String(formData.get("name") || "") || undefined,
    team: formData.get("team"),
    role: formData.get("role") ?? "MEMBER",
  });
  await prisma.user.upsert({
    where: { email: data.email },
    update: { team: data.team, role: data.role, active: true, ...(data.name ? { name: data.name } : {}) },
    create: data,
  });
  revalidatePath("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const team = formData.get("team") as Team;
  const role = formData.get("role") as Role;
  if (id === admin.id && role !== "ADMIN") throw new Error("You can't remove your own admin role");
  await prisma.user.update({ where: { id }, data: { team, role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(id: string) {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("You can't deactivate yourself");
  const u = await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/admin/users");
}
