import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser, signOut } from "@/auth";
import { TEAM_LABELS, isAdmin, isMarketing } from "@/lib/teams";
import { SidebarNav, type NavItem } from "@/components/sidebar";
import { Logo } from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const nav: NavItem[] = [
    { href: "/", label: "Tools", icon: "grid" },
    { href: "/requests", label: "My requests", icon: "list" },
  ];
  if (isMarketing(user)) nav.push({ href: "/marketing/requests", label: "Request queue", icon: "inbox" });
  if (isAdmin(user)) nav.push({ href: "/admin/users", label: "Users", icon: "users" });
  if (isAdmin(user)) nav.push({ href: "/styleguide", label: "Style guide", icon: "palette" });

  const initials = (user.name ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link href="/" className="mb-8 flex items-center px-1.5 pt-1">
          <Logo tone="light" height={20} />
        </Link>
        <SidebarNav items={nav} />

        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-2.5 px-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-sidebar-muted">
                {TEAM_LABELS[user.team]}
                {isAdmin(user) && " · Admin"}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <Link href="/"><Logo tone="light" height={18} /></Link>
          <nav className="flex gap-4 text-sm text-sidebar-muted">
            {nav.slice(0, 3).map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
