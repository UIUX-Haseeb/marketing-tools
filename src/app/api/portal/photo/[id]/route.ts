import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { portal } from "@/lib/portal";

/** GET /api/portal/photo/:id → the employee's profile photo, proxied so the canvas can read it same-origin. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  try {
    const photo = await portal().getPhoto(id);
    if (!photo) return new NextResponse("No photo", { status: 404 });
    return new NextResponse(photo.bytes, {
      headers: { "Content-Type": photo.contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    console.error("Portal photo failed:", err);
    return new NextResponse("Portal error", { status: 502 });
  }
}
