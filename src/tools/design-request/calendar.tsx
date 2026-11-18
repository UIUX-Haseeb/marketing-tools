"use client";

/**
 * "Designers calendar" — the portal's photographers calendar, with each request on its deadline
 * in its designer's colour. A small month on the left with the deadlines per designer this month.
 */
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isoDay } from "./rules";
import { designerColor, settings } from "./settings";
import type { DesignRequest } from "./types";
import { Modal } from "./ui";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MORE_AFTER = 4;

/** Monday-first weeks covering the month. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const days: Date[] = [];
  for (let d = new Date(start); days.length < 42; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  // Drop a last week that is entirely in the next month.
  return days[35].getMonth() !== month.getMonth() ? days.slice(0, 35) : days;
}

const monthLabel = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export function DesignCalendar({ requests, focus, onOpen, onClose }: { requests: DesignRequest[]; focus?: string; onOpen: (id: string) => void; onClose: () => void }) {
  const today = isoDay(new Date());
  const [month, setMonth] = useState(() => {
    const d = focus ? new Date(`${focus}T12:00`) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState(focus ?? today);
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const grid = monthGrid(month);
  const live = requests.filter((r) => r.closeReason !== "Cancelled" && r.closeReason !== "Auto-closed");
  const byDay = (iso: string) => live.filter((r) => r.deadline === iso);
  const inMonth = live.filter((r) => new Date(`${r.deadline}T12:00`).getMonth() === month.getMonth() && new Date(`${r.deadline}T12:00`).getFullYear() === month.getFullYear());

  return (
    <Modal label="Designers calendar" onClose={onClose} className="h-[min(820px,calc(100vh-4rem))] max-w-[1180px]">
      <header className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-normal">
          <CalendarDays className="size-5" /> Designers calendar
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X />
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden px-6 md:grid-cols-[230px_1fr]">
        <aside className="hidden space-y-5 md:block">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              {monthLabel(month)}
              <span className="flex gap-1">
                <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid size-7 place-items-center rounded-full bg-secondary hover:bg-muted">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" aria-label="Next month" onClick={() => shift(1)} className="grid size-7 place-items-center rounded-full bg-secondary hover:bg-muted">
                  <ChevronRight className="size-4" />
                </button>
              </span>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
              {WEEK.map((w, i) => (
                <span key={w} className={cn("py-1 text-muted-foreground", i >= 5 && "text-destructive")}>
                  {w.slice(0, 2)}
                </span>
              ))}
              {grid.map((d) => {
                const iso = isoDay(d);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setPicked(iso)}
                    className={cn(
                      "mx-auto grid size-7 place-items-center rounded-full tabular-nums hover:bg-secondary",
                      d.getMonth() !== month.getMonth() && "text-muted-foreground/60",
                      iso === today && "bg-primary text-primary-foreground hover:bg-primary",
                      iso === picked && iso !== today && "ring-1 ring-navy-2",
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 border-t pt-4 text-xs">
            <p className="text-muted-foreground">Deadlines this month</p>
            {[{ name: "Unassigned", color: "" }, ...settings().designers].map((d) => {
              const n = inMonth.filter((r) => (d.name === "Unassigned" ? !r.designer : r.designer === d.name)).length;
              return (
                <p key={d.name} className="flex items-center gap-2">
                  <span className={cn("size-2.5 shrink-0 rounded-full", !d.color && "border border-dashed border-warning")} style={d.color ? { background: d.color } : undefined} />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="tabular-nums">{n}</span>
                </p>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-normal">{monthLabel(month)}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                Today
              </Button>
              <Button variant="ghost" size="sm" aria-label="Previous month" onClick={() => shift(-1)}>
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Next month" onClick={() => shift(1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b pb-1 text-center text-xs text-muted-foreground">
            {WEEK.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-y-auto border-l">
            {grid.map((d) => {
              const iso = isoDay(d);
              const list = byDay(iso);
              return (
                <div key={iso} className={cn("min-h-24 space-y-0.5 border-r border-b p-1", iso === picked && "bg-secondary/70", d.getMonth() !== month.getMonth() && "bg-secondary/20")}>
                  <p className={cn("px-1 text-xs tabular-nums", d.getMonth() !== month.getMonth() && "text-muted-foreground/60", iso === today && "font-medium text-brand")}>{d.getDate()}</p>
                  {list.slice(0, MORE_AFTER).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onOpen(r.id)}
                      title={`${r.ref} · ${r.title}`}
                      className={cn("block w-full truncate rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] hover:brightness-95", !r.designer && "border border-dashed")}
                      style={{ borderLeftColor: designerColor(r.designer), background: `${designerColor(r.designer)}1f` }}
                    >
                      {r.ref}
                    </button>
                  ))}
                  {list.length > MORE_AFTER && <p className="px-1 text-[11px] text-muted-foreground">+{list.length - MORE_AFTER} more</p>}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="flex justify-end border-t px-6 py-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
