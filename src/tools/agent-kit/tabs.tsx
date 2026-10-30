"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "downloads", label: "Downloads" },
  { id: "business-card", label: "Business card" },
] as const;

/** Downloads | Business card. The card studio needs more room than the page column, so its tab runs wider. */
export function KitTabs({ downloads, businessCard }: { downloads: ReactNode; businessCard: ReactNode }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("downloads");
  return (
    <div className="space-y-6">
      <div role="tablist" className="inline-flex gap-0.5 rounded-lg bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "downloads" ? (
        downloads
      ) : (
        <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 md:w-[calc(100vw-5rem)]">{businessCard}</div>
      )}
    </div>
  );
}
