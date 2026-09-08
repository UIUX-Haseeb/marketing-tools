import Link from "next/link";
import { ArrowRight, Sparkles, Inbox, Users as UsersIcon } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toolsForUser, type ToolDef } from "@/lib/tools";
import { TEAM_LABELS, isAdmin, isMarketing } from "@/lib/teams";
import { ToolIcon } from "@/components/tool-icon";
import { Badge } from "@/components/ui/badge";

function ToolCard({ tool }: { tool: ToolDef }) {
  const ready = !!tool.component;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col gap-3.5 rounded-xl border bg-card p-5 transition-all duration-200 ${
        ready
          ? "hover:border-foreground/40 hover:shadow-md"
          : "opacity-80 hover:opacity-100 hover:border-foreground/20"
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
            ready
              ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <ToolIcon name={tool.icon} className="size-5" />
        </span>
        {ready ? (
          <Badge variant="success" className="text-xs">
            Ready
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Coming soon
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {tool.name}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {tool.description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <span className="capitalize">{tool.category}</span>
        <span className="flex items-center gap-1 font-medium group-hover:text-foreground">
          {ready ? "Launch" : "Details"} <ArrowRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [myRequestsCount, queueCount, userCount, tools] = await Promise.all([
    prisma.request.count({
      where: { requesterId: user.id, status: { in: ["NEW", "IN_PROGRESS"] } },
    }),
    isMarketing(user)
      ? prisma.request.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } })
      : Promise.resolve(0),
    isAdmin(user) ? prisma.user.count({ where: { active: true } }) : Promise.resolve(0),
    Promise.resolve(toolsForUser(user)),
  ]);

  const posts = tools.filter((t) => t.category === "posts");
  const requests = tools.filter((t) => t.category === "requests");

  const displayName = user.name ? user.name.split(" ")[0] : (user.email ? user.email.split("@")[0] : "there");

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {TEAM_LABELS[user.team]} Team workspace · Provident Estate Marketing Portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {TEAM_LABELS[user.team]}
          </Badge>
          {isAdmin(user) && (
            <Badge variant="outline" className="px-3 py-1 border-primary/40 text-primary font-medium">
              Admin
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/requests"
          className="group rounded-xl border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">My Active Requests</span>
            <Inbox className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{myRequestsCount}</span>
            <span className="text-xs text-muted-foreground">in progress</span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
            View submissions <ArrowRight className="size-3" />
          </p>
        </Link>

        {isMarketing(user) && (
          <Link
            href="/marketing/requests"
            className="group rounded-xl border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Marketing Queue</span>
              <Sparkles className="size-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{queueCount}</span>
              <span className="text-xs text-muted-foreground">open requests</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
              Open queue <ArrowRight className="size-3" />
            </p>
          </Link>
        )}

        {isAdmin(user) && (
          <Link
            href="/admin/users"
            className="group rounded-xl border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">User Directory</span>
              <UsersIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{userCount}</span>
              <span className="text-xs text-muted-foreground">active accounts</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
              Manage users <ArrowRight className="size-3" />
            </p>
          </Link>
        )}
      </div>

      {/* Requests Section */}
      {requests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Marketing Requests
            </h2>
            <span className="text-xs text-muted-foreground">Send custom requirements to Marketing</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}

      {/* Post Generation Tools */}
      {posts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Marketing Post Generators
            </h2>
            <span className="text-xs text-muted-foreground">Available to your team</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}

      {tools.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tools are assigned to your team yet. Ask an Admin to update your team settings in the User Directory.
          </p>
        </div>
      )}
    </div>
  );
}
