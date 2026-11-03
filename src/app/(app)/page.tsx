import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TOOLS, type ToolDef } from "@/lib/tools";
import { TEAM_LABELS, type Team } from "@/lib/teams";
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

/** Teams that have at least one tool, in TEAM_LABELS order. */
const TEAMS = (Object.keys(TEAM_LABELS) as Team[]).filter((team) => TOOLS.some((t) => t.teams.includes(team)));

function TeamFilter({ active }: { active?: Team }) {
  const options: { label: string; href: string; on: boolean }[] = [
    { label: "All", href: "/", on: !active },
    ...TEAMS.map((team) => ({ label: TEAM_LABELS[team], href: `/?team=${team.toLowerCase()}`, on: active === team })),
  ];
  return (
    <nav aria-label="Filter tools by team" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted-foreground">Who it&apos;s for</span>
      {options.map((o) => (
        <Link
          key={o.label}
          href={o.href}
          scroll={false}
          aria-current={o.on ? "page" : undefined}
          className={
            o.on
              ? "rounded-full border border-navy bg-navy px-3 py-1 text-sm text-paper"
              : "rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-navy-2/60 hover:text-foreground"
          }
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { team } = await searchParams;
  const active = TEAMS.find((t) => t === team?.toUpperCase());
  const tools = active ? TOOLS.filter((t) => t.teams.includes(active)) : TOOLS;
  const posts = tools.filter((t) => t.category === "posts");
  const booklets = tools.filter((t) => t.category === "booklets");
  const events = tools.filter((t) => t.category === "events");
  const kits = tools.filter((t) => t.category === "kits");
  const requests = tools.filter((t) => t.category === "requests");

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
          <p className="max-w-md text-sidebar-muted">Create on-brand posts and brochures in minutes.</p>
        </div>
      </header>

      <TeamFilter active={active} />

      <Section kicker="Create" title="Posts" tools={posts} />
      <Section kicker="Create" title="Booklets" tools={booklets} />
      <Section kicker="Manage" title="Events" tools={events} />
      <Section kicker="Download" title="Kits" tools={kits} />
      <Section kicker="Ask" title="Requests" tools={requests} />
    </div>
  );
}
