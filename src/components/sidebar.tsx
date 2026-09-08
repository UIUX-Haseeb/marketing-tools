"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Inbox, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: "grid" | "inbox" | "list" | "users" };

const ICONS = { grid: LayoutGrid, inbox: Inbox, list: ListChecks, users: Users };

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
              active && "bg-accent text-foreground font-medium",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
