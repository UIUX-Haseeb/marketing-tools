import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "My requests" };

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const user = await requireUser();
  const { sent } = await searchParams;
  const requests = await prisma.request.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My requests</h1>
          <p className="text-muted-foreground">Everything you’ve sent to Marketing.</p>
        </div>
        <Button asChild size="sm"><Link href="/tools/custom-request">New request</Link></Button>
      </div>

      {sent && (
        <p className="rounded-lg border border-success/30 bg-success/8 px-3 py-2.5 text-sm text-success">
          Sent — Marketing will pick it up shortly.
        </p>
      )}

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No requests yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Needed by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-muted-foreground">{r.type}</TableCell>
                <TableCell className="text-muted-foreground">{fmt(r.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{r.dueDate ? fmt(r.dueDate) : "—"}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
