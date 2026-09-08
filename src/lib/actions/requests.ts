"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isMarketing } from "@/lib/teams";
import type { RequestStatus } from "@/generated/prisma/enums";

/**
 * Generic "send a request to Marketing" action. Any tool can call this:
 *   await createRequest({ type: "just-listed-video", title, description, payload: {...} })
 */
const CreateRequest = z.object({
  type: z.string().min(1).max(60),
  title: z.string().min(3, "Give it a short title").max(120),
  description: z.string().max(4000).optional(),
  dueDate: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type CreateRequestInput = z.input<typeof CreateRequest>;

export async function createRequest(input: CreateRequestInput) {
  const user = await requireUser();
  const data = CreateRequest.parse(input);
  const req = await prisma.request.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      payload: data.payload as object | undefined,
      requesterId: user.id,
    },
  });
  revalidatePath("/requests");
  revalidatePath("/marketing/requests");
  return req.id;
}

/** Form-action wrapper used by the Custom Request tool. */
export async function submitCustomRequest(formData: FormData) {
  await createRequest({
    type: String(formData.get("kind") || "custom"),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    dueDate: String(formData.get("dueDate") || "") || undefined,
    payload: { about: String(formData.get("about") || "") || undefined },
  });
  redirect("/requests?sent=1");
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  const user = await requireUser();
  if (!isMarketing(user)) throw new Error("Not allowed");
  await prisma.request.update({
    where: { id },
    data: { status, assigneeId: status === "IN_PROGRESS" ? user.id : undefined },
  });
  revalidatePath("/requests");
  revalidatePath("/marketing/requests");
}
