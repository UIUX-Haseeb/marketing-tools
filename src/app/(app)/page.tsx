import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TOOLS, type ToolDef } from "@/lib/tools";
import { TEAM_LABELS } from "@/lib/teams";
import { ToolIcon } from "@/components/tool-icon";
import { MascotLoop } from "@/components/mascot";

function ToolCard({ tool }: { tool: ToolDef }) {
  const ready = !!tool.component;
  const forAll = tool.teams.length >= 4;
  return (
    <Link href={`/tools/${tool.slug}`} className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-navy-2/60">
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
      <p className="mt-auto text-[11px] text-muted-foreground">{forAll ? "Everyone" : tool.teams.map((t) => TEAM_LABELS[t]).join(" · ")}</p>
    </Link>
  );
}

function Section({ kicker, title, tools }: { kicker: string; title: string; tools: ToolDef[] }) {
  if (tools.length === 0) return null;
  return (
    <section className="space-y-4">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1 text-h2">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </div>
    </section>
  );
}

export default function HomePage() {
  const posts = TOOLS.filter((t) => t.category === "posts");
  const requests = TOOLS.filter((t) => t.category === "requests");

  return (
    <div className="space-y-12">
      {/* Hero */}
      <header className="grid items-center gap-6 rounded-2xl bg-navy p-6 text-paper sm:grid-cols-[auto_1fr] sm:p-8">
        <MascotLoop className="w-40 sm:w-48" />
        <div className="space-y-3">
          <p className="kicker text-sidebar-muted">Prov Toys</p>
          <h1 className="text-display">
            Marketing tools for the whole team<span className="text-brand">.</span>
          </h1>
          <p className="max-w-md text-sidebar-muted">Create on-brand posts in minutes, or send Marketing exactly what you need.</p>
        </div>
      </header>

      <Section kicker="Create" title="Posts" tools={posts} />
      <Section kicker="Ask Marketing" title="Requests" tools={requests} />
    </div>
  );
}
