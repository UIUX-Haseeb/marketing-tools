import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { portal, portalIsMock, birthMonth } from "@/lib/portal";

/** GET /api/portal/employees?months=1,2  → employees with a birthday in those months (all if omitted). */
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(user.team === "HR" || user.team === "MARKETING" || user.role === "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const months = new URL(req.url).searchParams
    .get("months")
    ?.split(",")
    .map(Number)
    .filter((m) => m >= 1 && m <= 12);

  try {
    const all = await portal().listEmployees();
    const active = all.filter((e) => e.active);
    const rows = months?.length ? active.filter((e) => months.includes(birthMonth(e) ?? -1)) : active;
    return NextResponse.json({ employees: rows, source: portalIsMock() ? "mock" : "portal" });
  } catch (err) {
    console.error("Portal employees failed:", err);
    return NextResponse.json({ error: "Could not reach the Portal. Try again in a moment." }, { status: 502 });
  }
}
