"use client";

/**
 * Business card — the portal's page (portal.prov.ae/en/marketing/tools/business-card) rebuilt here:
 * a "Card for" picker over the designer's Business Card Studio in a same-origin iframe. The studio
 * is a static build (public/tools/agent-kit/business-card/index.html, from build.py); this page
 * only tells it who the card is for, over postMessage (contract in embed.js).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { EMPLOYEES } from "@/lib/demo/employees";
import { cn } from "@/lib/utils";
import { cardRecord } from "./record";

const STUDIO_URL = "/tools/agent-kit/business-card/index.html";
const MSG = "provident-bcard";

export function BusinessCard() {
  const [personId, setPersonId] = useState<string | null>(null);
  const person = EMPLOYEES.find((e) => e.id === personId) ?? null;
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  // Send the record once the studio says it's listening, and again whenever the person changes.
  useEffect(() => {
    const send = () => {
      if (!person || !ready.current) return;
      frame.current?.contentWindow?.postMessage({ type: `${MSG}:card`, card: cardRecord(person) }, location.origin);
    };
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== frame.current?.contentWindow || ev.origin !== location.origin) return;
      if (ev.data?.type === `${MSG}:ready`) {
        ready.current = true;
        send();
      }
    };
    window.addEventListener("message", onMessage);
    send();
    return () => window.removeEventListener("message", onMessage);
  }, [person]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[320px_1fr] sm:items-start sm:gap-6">
        <div className="space-y-1.5">
          <p className="text-sm">Card for</p>
          <PersonPicker value={personId} onChange={setPersonId} />
          <p className="text-xs text-muted-foreground">Leave empty for a blank card.</p>
        </div>
        <div className="space-y-1 sm:pt-6">
          <p className="text-sm">{person ? person.fullName : "Blank card"}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {person
              ? "Name, mobile and e-mail are filled in from the employee record and can be edited on the card. Job title and BRN are printed from the record — ask HR if either is wrong. Nothing you make here is saved."
              : "Type your details straight onto the card. Nothing you make here is saved."}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Clearing the person reloads the studio: it has no "unset", and a blank card must not keep the last record's locks. */}
        <iframe
          key={personId ? "person" : "blank"}
          ref={frame}
          src={STUDIO_URL}
          title="Business Card Studio"
          className="block h-[calc(100vh-120px)] min-h-[680px] w-full"
        />
      </div>
    </div>
  );
}

/** Searchable person picker, like the portal's "Yourself — or search a colleague". */
function PersonPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const selected = EMPLOYEES.find((e) => e.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMPLOYEES.filter((e) => e.active && (!q || e.fullName.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q)));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (ev: PointerEvent) => {
      if (!box.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const pick = (id: string | null) => {
    onChange(id);
    setQuery("");
    setOpen(false);
    input.current?.blur();
  };

  const openList = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <div ref={box} className="relative">
      <div className="flex h-9 items-center rounded-lg border bg-background pr-1 focus-within:ring-2 focus-within:ring-ring/50">
        <input
          ref={input}
          value={open ? query : (selected?.fullName ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={openList}
          onClick={() => !open && openList()}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && matches[0]) pick(matches[0].id);
          }}
          placeholder="Search a colleague"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {selected && (
          <button type="button" aria-label="Clear" onClick={() => pick(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
        <button type="button" aria-label="Show people" onClick={() => (open ? setOpen(false) : openList())} className="rounded p-1 text-muted-foreground hover:text-foreground">
          <ChevronDown className="size-4" />
        </button>
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-card py-1 shadow-lg">
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No one matches.</li>}
          {matches.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => pick(e.id)}
                className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary", e.id === value && "bg-secondary")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{e.fullName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{e.designation}</span>
                </span>
                {e.id === value && <Check className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
