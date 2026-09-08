import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/auth";
import { toolsForUser, type ToolDef } from "@/lib/tools";
import { TEAM_LABELS } from "@/lib/teams";
import { ToolIcon } from "@/components/tool-icon";
import { Badge } from "@/components/ui/badge";

function ToolCard({ tool }: { tool: ToolDef }) {
  const ready = !!tool.component;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
          <ToolIcon name={tool.icon} className="size-4" />
        </span>
        {!ready && <Badge variant="outline">Coming soon</Badge>}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{tool.name}</p>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </div>
      <span className="mt-auto flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
        Open <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const tools = toolsForUser(user);
  const posts = tools.filter((t) => t.category === "posts");
  const requests = tools.filter((t) => t.category === "requests");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-muted-foreground">Tools available to the {TEAM_LABELS[user.team]} team.</p>
      </div>

      {posts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Create a post</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      )}

      {requests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ask Marketing</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      )}

      {tools.length === 0 && (
        <p className="text-sm text-muted-foreground">No tools are assigned to your team yet. Ask Marketing to update your team.</p>
      )}
    </div>
  );
}
