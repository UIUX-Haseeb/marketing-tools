import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser, signOut } from "@/auth";
import { TEAM_LABELS, isAdmin, isMarketing } from "@/lib/teams";
import { SidebarNav, type NavItem } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const nav: NavItem[] = [
    { href: "/", label: "Tools", icon: "grid" },
    { href: "/requests", label: "My requests", icon: "list" },
  ];
  if (isMarketing(user)) nav.push({ href: "/marketing/requests", label: "Request queue", icon: "inbox" });
  if (isAdmin(user)) nav.push({ href: "/admin/users", label: "Users", icon: "users" });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-1">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">P</span>
          <span className="font-semibold tracking-tight">Prov Toys</span>
        </Link>
        <SidebarNav items={nav} />
        <div className="mt-auto space-y-3 border-t pt-4">
          <div className="px-1">
            <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex gap-1">
              <Badge variant="secondary">{TEAM_LABELS[user.team]}</Badge>
              {isAdmin(user) && <Badge variant="outline">Admin</Badge>}
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut /> Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Link href="/" className="font-semibold tracking-tight">Prov Toys</Link>
          <nav className="flex gap-3 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-muted-foreground">{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
