"use client";

/**
 * Picks a primary project from what will be a long CRM list: an emirate toggle (Dubai / Abu
 * Dhabi) narrows it to one market, then typing filters by project, developer or area. The list
 * is a listbox — arrow keys move, Enter picks — and shows how many matched.
 */
import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_PROJECTS, PRIMARY_SOURCES, type SavedProject } from "./primary";

type SourceId = SavedProject["source"];

export function ProjectPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = PRIMARY_PROJECTS.find((p) => p.id === value);
  const [source, setSource] = useState<SourceId>(current?.source ?? PRIMARY_SOURCES[0].id);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return PRIMARY_PROJECTS.filter((p) => p.source === source).filter((p) => {
      const hay = `${p.data.name} ${p.data.developer} ${p.data.location}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [source, query]);

  function pickSource(s: SourceId) {
    setSource(s);
    setQuery("");
    setActive(0);
  }

  return (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="Emirate" className="flex gap-1.5">
        {PRIMARY_SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === source}
            onClick={() => pickSource(s.id)}
            className={cn("h-8 rounded-full border px-3 text-sm transition-colors", s.id === source ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground")}
          >
            {s.id === "dubai" ? "Dubai" : "Abu Dhabi"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={matches[active] ? `${listId}-${matches[active].id}` : undefined}
          aria-label="Search projects"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, matches.length - 1));
            else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
            else if (e.key === "Enter" && matches[active]) onChange(matches[active].id);
            else return;
            e.preventDefault();
          }}
          placeholder="Search project, developer or area"
          className="h-10 w-full rounded-md border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-navy-2"
        />
      </div>

      <div id={listId} role="listbox" aria-label="Projects" className="max-h-56 overflow-y-auto rounded-md border bg-card">
        {matches.map((p, i) => (
          <button
            key={p.id}
            id={`${listId}-${p.id}`}
            type="button"
            role="option"
            aria-selected={p.id === value}
            onClick={() => onChange(p.id)}
            onMouseEnter={() => setActive(i)}
            className={cn("flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0", i === active && "bg-secondary", p.id === value && "bg-primary/5")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.data.thumbnail || p.data.heroImage} alt="" className="h-9 w-14 shrink-0 rounded object-cover" />
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-sm", p.id === value && "font-normal text-foreground")}>{p.data.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.data.developer} · {p.data.location}</span>
            </span>
            {p.id === value && <span className="text-xs text-primary">Selected</span>}
          </button>
        ))}
        {matches.length === 0 && <p className="px-3 py-4 text-center text-xs text-muted-foreground">No {source === "dubai" ? "Dubai" : "Abu Dhabi"} project matches “{query}”.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {matches.length} {matches.length === 1 ? "project" : "projects"}{query ? " match" : ` in ${source === "dubai" ? "Dubai" : "Abu Dhabi"}`}
      </p>
    </div>
  );
}
