"use client";

/**
 * Business card — the portal's page (portal.prov.ae/en/marketing/tools/business-card) rebuilt here:
 * a "Card for" picker over the designer's Business Card Studio in a same-origin iframe. The studio
 * is a static build (public/tools/agent-kit/business-card/index.html, from build.py); this page
 * only tells it who the card is for, over postMessage (contract in embed.js).
 */
import { useEffect, useRef, useState } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";
import { PersonPicker } from "../person-picker";
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
