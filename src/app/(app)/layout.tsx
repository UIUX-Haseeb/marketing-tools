import Link from "next/link";
import { SidebarNav, type NavItem } from "@/components/sidebar";
import { Logo } from "@/components/logo";

const NAV: NavItem[] = [
  { href: "/", label: "Tools", icon: "grid" },
  { href: "/requests", label: "My requests", icon: "list" },
  { href: "/marketing/requests", label: "Request queue", icon: "inbox" },
  { href: "/styleguide", label: "Style guide", icon: "palette" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link href="/" className="mb-8 flex items-center px-1.5 pt-1">
          <Logo tone="light" height={20} />
        </Link>
        <SidebarNav items={NAV} />
        <p className="mt-auto px-1.5 text-xs text-sidebar-muted">Provident Real Estate · Internal</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <Link href="/"><Logo tone="light" height={18} /></Link>
          <nav className="flex gap-4 text-sm text-sidebar-muted">
            {NAV.slice(0, 3).map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
