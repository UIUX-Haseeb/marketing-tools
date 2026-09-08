"use server";

import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";

const LogPost = z.object({
  tool: z.string().min(1).max(40),
  templateId: z.string().min(1).max(80),
  subject: z.string().min(1).max(120),
  source: z.enum(["portal", "manual"]),
  employeeId: z.string().max(80).optional(),
  format: z.enum(["png", "jpg"]).optional(),
  bytes: z.number().int().nonnegative().optional(),
});
export type LogPostInput = z.input<typeof LogPost>;

/** Record that a post was generated. Never throws — logging must not block a download. */
export async function logGeneratedPost(input: LogPostInput) {
  try {
    const user = await requireUser();
    const data = LogPost.parse(input);
    if (!process.env.DATABASE_URL) return;
    await prisma.generatedPost.create({ data: { ...data, userId: user.id } });
  } catch (err) {
    console.error("logGeneratedPost failed:", err);
  }
}
