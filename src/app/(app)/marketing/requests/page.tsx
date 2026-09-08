"use client";

import { useState } from "react";
import { updateRequestStatus, useRequests } from "@/lib/store";
import type { RequestStatus } from "@/lib/demo/types";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const ORDER: Record<RequestStatus, number> = { NEW: 0, IN_PROGRESS: 1, DONE: 2, REJECTED: 3 };

const TABS: { label: string; value?: RequestStatus }[] = [
  { label: "Open" },
  { label: "New", value: "NEW" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Done", value: "DONE" },
  { label: "Declined", value: "REJECTED" },
];

export default function RequestQueuePage() {
  const all = useRequests();
  const [filter, setFilter] = useState<RequestStatus | undefined>(undefined);

  const requests = all
    .filter((r) => (filter ? r.status === filter : r.status === "NEW" || r.status === "IN_PROGRESS"))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">Request queue</h1>
        <p className="text-muted-foreground">Custom requests from agents and internal teams.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setFilter(t.value)}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", t.value === filter ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-normal">{r.title}</p>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">{r.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.requester} · {r.team} · sent {fmt(r.createdAt)}
                    {r.dueDate && <> · needed by <span className="text-foreground">{fmt(r.dueDate)}</span></>}
                  </p>
                  {r.description && <p className="whitespace-pre-wrap pt-1 text-sm">{r.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {r.status === "NEW" && <Button size="sm" variant="outline" onClick={() => updateRequestStatus(r.id, "IN_PROGRESS")}>Start</Button>}
                  {r.status === "IN_PROGRESS" && <Button size="sm" variant="outline" onClick={() => updateRequestStatus(r.id, "DONE")}>Mark done</Button>}
                  {(r.status === "NEW" || r.status === "IN_PROGRESS") && <Button size="sm" variant="ghost" onClick={() => updateRequestStatus(r.id, "REJECTED")}>Decline</Button>}
                  {(r.status === "DONE" || r.status === "REJECTED") && <Button size="sm" variant="ghost" onClick={() => updateRequestStatus(r.id, "NEW")}>Reopen</Button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
