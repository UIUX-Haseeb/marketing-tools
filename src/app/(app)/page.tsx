import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toolsForUser, type ToolDef } from "@/lib/tools";
import { TEAM_LABELS, isMarketing } from "@/lib/teams";
import { ToolIcon } from "@/components/tool-icon";
import { Mascot } from "@/components/mascot";

function ToolCard({ tool }: { tool: ToolDef }) {
  const ready = !!tool.component;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-navy-2/60"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
          <ToolIcon name={tool.icon} className="size-[18px]" strokeWidth={1.75} />
        </span>
        {ready ? (
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        ) : (
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">Coming soon</span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-normal">{tool.name}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>
    </Link>
  );
}

function Section({ kicker, title, tools }: { kicker: string; title: string; tools: ToolDef[] }) {
  if (tools.length === 0) return null;
  return (
    <section className="space-y-4">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1 text-h2 font-normal">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const tools = toolsForUser(user);
  const posts = tools.filter((t) => t.category === "posts");
  const requests = tools.filter((t) => t.category === "requests");

  let openMine = 0;
  let openQueue = 0;
  try {
    if (process.env.DATABASE_URL) {
      [openMine, openQueue] = await Promise.all([
        prisma.request.count({ where: { requesterId: user.id, status: { in: ["NEW", "IN_PROGRESS"] } } }),
        isMarketing(user) ? prisma.request.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }) : Promise.resolve(0),
      ]);
    }
  } catch (err) {
    console.error("Dashboard counts unavailable:", err);
  }

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">{TEAM_LABELS[user.team]}</p>
          <h1 className="mt-2 text-display font-normal">
            {firstName ? <>Hello, {firstName}</> : <>Hello</>}
            <span className="text-brand">.</span>
          </h1>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/requests" className="group">
            <p className="text-h2 font-normal tabular-nums">{openMine}</p>
            <p className="text-muted-foreground group-hover:text-foreground">Open requests</p>
          </Link>
          {isMarketing(user) && (
            <Link href="/marketing/requests" className="group">
              <p className="text-h2 font-normal tabular-nums">{openQueue}</p>
              <p className="text-muted-foreground group-hover:text-foreground">In the queue</p>
            </Link>
          )}
        </div>
      </header>

      <Section kicker="Create" title="Posts" tools={posts} />
      <Section kicker="Ask Marketing" title="Requests" tools={requests} />

      {tools.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Mascot size={160} />
          <p className="text-sm text-muted-foreground">No tools are assigned to your team yet. Ask Marketing to update your team.</p>
        </div>
      )}
    </div>
  );
}
