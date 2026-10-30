"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KitTab {
  id: string;
  label: string;
  content: ReactNode;
  /** Run wider than the page column (the card studio needs the room). */
  wide?: boolean;
}

export function KitTabs({ tabs }: { tabs: KitTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div className="space-y-6">
      <div role="tablist" className="inline-flex gap-0.5 rounded-lg bg-secondary p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === tab.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm transition-colors",
              t.id === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab.wide ? (
        <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 md:w-[calc(100vw-5rem)]">{tab.content}</div>
      ) : (
        tab.content
      )}
    </div>
  );
}
