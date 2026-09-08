import { notFound } from "next/navigation";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isMarketing, TEAM_LABELS } from "@/lib/teams";
import { updateRequestStatus } from "@/lib/actions/requests";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { RequestStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Request queue" };

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function RequestQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  if (!isMarketing(user)) notFound();

  const { status } = await searchParams;
  const filter = (["NEW", "IN_PROGRESS", "DONE", "REJECTED"] as RequestStatus[]).includes(status as RequestStatus)
    ? (status as RequestStatus)
    : undefined;

  const requests = await prisma.request.findMany({
    where: filter ? { status: filter } : { status: { in: ["NEW", "IN_PROGRESS"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { requester: true, assignee: true },
    take: 200,
  });

  const tabs: { label: string; value?: string }[] = [
    { label: "Open" },
    { label: "New", value: "NEW" },
    { label: "In progress", value: "IN_PROGRESS" },
    { label: "Done", value: "DONE" },
    { label: "Declined", value: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Request queue</h1>
        <p className="text-muted-foreground">Custom requests from agents and internal teams.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
          const active = t.value === filter;
          return (
            <a
              key={t.label}
              href={t.value ? `?status=${t.value}` : "?"}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${active ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </a>
          );
        })}
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
                    <p className="font-medium">{r.title}</p>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">{r.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.requester.name ?? r.requester.email} · {TEAM_LABELS[r.requester.team]} · sent {fmt(r.createdAt)}
                    {r.dueDate && <> · needed by <span className="font-medium text-foreground">{fmt(r.dueDate)}</span></>}
                    {r.assignee && <> · {r.assignee.name ?? r.assignee.email}</>}
                  </p>
                  {r.description && <p className="whitespace-pre-wrap pt-1 text-sm">{r.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {r.status === "NEW" && <StatusButton id={r.id} to="IN_PROGRESS" label="Start" />}
                  {r.status === "IN_PROGRESS" && <StatusButton id={r.id} to="DONE" label="Mark done" />}
                  {(r.status === "NEW" || r.status === "IN_PROGRESS") && <StatusButton id={r.id} to="REJECTED" label="Decline" variant="ghost" />}
                  {(r.status === "DONE" || r.status === "REJECTED") && <StatusButton id={r.id} to="NEW" label="Reopen" variant="ghost" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusButton({ id, to, label, variant = "outline" }: { id: string; to: RequestStatus; label: string; variant?: "outline" | "ghost" }) {
  return (
    <form action={updateRequestStatus.bind(null, id, to)}>
      <Button type="submit" size="sm" variant={variant}>{label}</Button>
    </form>
  );
}
