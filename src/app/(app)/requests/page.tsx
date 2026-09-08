"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRequests } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SentNote() {
  const sent = useSearchParams().get("sent");
  if (!sent) return null;
  return <p className="rounded-lg border border-success/30 bg-success/8 px-3 py-2.5 text-sm text-success">Sent — Marketing will pick it up shortly.</p>;
}

export default function MyRequestsPage() {
  const requests = useRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1">My requests</h1>
          <p className="text-muted-foreground">Everything sent to Marketing from this browser.</p>
        </div>
        <Button asChild size="sm"><Link href="/tools/custom-request">New request</Link></Button>
      </div>

      <Suspense><SentNote /></Suspense>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Mascot size={140} />
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Needed by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-normal">{r.title}</TableCell>
                <TableCell className="text-muted-foreground">{r.requester}</TableCell>
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
