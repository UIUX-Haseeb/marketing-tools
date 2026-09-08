"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Inbox, ListChecks, Users, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: "grid" | "inbox" | "list" | "users" | "palette" };

const ICONS = { grid: LayoutGrid, inbox: Inbox, list: ListChecks, users: Users, palette: Palette };

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/" ? pathname === "/" || pathname.startsWith("/tools") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active && "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
            {active && <span aria-hidden className="absolute right-2.5 size-1.5 rounded-full bg-brand" />}
          </Link>
        );
      })}
    </nav>
  );
}
