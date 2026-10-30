"use client";

/**
 * Template sheet: the main templates — one per event type, banner and thumbnail at native
 * size, each filled with that type's demo event — for review and for capturing into Figma
 * (ProvToys-Templates › Event Tools) as editable layers. The fonts are registered as
 * "Google Sans Flex" (next/font's own family name can't be mapped by Figma). Each template
 * sits in a `section[data-type]` named as in Figma.
 *
 *   /sheet/events              design A (the default)
 *   /sheet/events?design=b     another design: a | b | c
 *   /sheet/events?kind=flyer   the 9:16 flyers only (to add them to the Figma frames)
 *   /sheet/events?set=real     every real portal event (banner, thumbnail, flyer) — the stress test
 *   …&agent=1                  flyers personalised with a demo contact card (templates or ?set=real)
 */
import { Artwork } from "./artwork";
import { DEMO_EVENTS } from "./data";
import { EMPLOYEES } from "@/lib/demo/employees";
import { cardFromEmployee, type FlyerAgent } from "./my-card";
import { REAL_EVENTS } from "./real";
import { ART_DESIGNS, ART_SIZES, EVENT_TYPES, type ArtDesign, type ArtKind, type EventType } from "./types";

/** The demo event that stands for each type — the logo types use events whose developer has a demo logo. */
const BY_TYPE: Record<EventType, string> = {
  "Open House": "20380657-52e3-4014-a561-f2099670ce2b",
  "Project Launch": "c41b7e20-8f3a-4d6b-9e15-2a0d7c5b8f91",
  Roadshow: "4e1d6c0a-2b7f-4f0e-9a51-6c3f1d8b2a40",
  Briefing: "d9e3a5c2-4b1f-47d8-a6e0-71c2b8f4d3a5",
  Webinar: "e7f2c8a1-3d5b-4e9c-b0a4-6f1d2e8c7b39",
  Exhibition: "9b0c2e71-5d44-4a8c-8f1e-2a7d93c6e5b1",
  "Sales Event": "fc5f9483-9974-484a-9ee5-76178ea98dfd",
};

/** Demo contact card for the personalised flyers — the first demo employee, as on the Project Booklet. */
const DEMO_AGENT: FlyerAgent = { ...(cardFromEmployee(EMPLOYEES[0].id) as FlyerAgent) };

const FONTS = [300, 400, 500]
  .map((w) => `@font-face{font-family:"Google Sans Flex";font-style:normal;font-weight:${w};font-display:block;src:url(/tools/events/fonts/GoogleSansFlex-${w}.woff2) format("woff2");}`)
  .join("");

/** Every real portal event in one design: banner, thumbnail and flyer side by side. */
function RealSheet({ design, label, agent }: { design: ArtDesign; label: string; agent?: FlyerAgent }) {
  return (
    <main data-sheet="events-real" style={{ ["--font-google-sans" as string]: '"Google Sans Flex"', fontFamily: '"Google Sans Flex", sans-serif', display: "flex", flexDirection: "column", gap: 90, padding: 120, background: "#e9e6e1", width: "max-content", minHeight: "100vh" }}>
      <style>{FONTS}</style>
      <h1 style={{ margin: 0, fontSize: 48, fontWeight: 400, color: "#1a2942" }}>Real portal events — {label}</h1>
      {REAL_EVENTS.map((e, i) => (
        <section key={e.id} data-event={e.id} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 400, color: "#1a2942" }}>
            {i + 1}. {e.title} <span style={{ color: "#5b6472", fontSize: 18 }}>· {e.types.join(", ")}</span>
          </h2>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 48 }}>
            {(["banner", "thumb", "flyer"] as ArtKind[]).map((kind) => (
              <div key={kind} data-kind={kind} style={{ width: ART_SIZES[kind].w, height: ART_SIZES[kind].h, position: "relative", flex: "none", zoom: kind === "flyer" ? 0.45 : 1 }}>
                <Artwork e={{ ...e, artwork: { ...e.artwork, design } }} kind={kind} design={design} agent={kind === "flyer" ? agent : undefined} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export function TemplateSheet({ design: want, kind: only, set, agent: withAgent }: { design?: string; kind?: string; set?: string; agent?: string }) {
  const agent = withAgent ? DEMO_AGENT : undefined;
  const kinds: ArtKind[] = only === "flyer" ? ["flyer"] : ["banner", "thumb"];
  const design = (ART_DESIGNS.find((d) => d.value === want) ?? ART_DESIGNS[0]).value as ArtDesign;
  const label = ART_DESIGNS.find((d) => d.value === design)!.label;
  if (set === "real") return <RealSheet design={design} label={label} agent={agent} />;
  return (
    <main data-sheet="events" style={{ ["--font-google-sans" as string]: '"Google Sans Flex"', fontFamily: '"Google Sans Flex", sans-serif', display: "flex", flexDirection: "column", gap: 120, padding: 120, background: "#e9e6e1", width: "max-content", minHeight: "100vh" }}>
      <style>{FONTS}</style>
      <h1 style={{ margin: 0, fontSize: 48, fontWeight: 400, color: "#1a2942" }}>Event templates — {label}</h1>
      {EVENT_TYPES.map((type) => {
        const e = DEMO_EVENTS.find((x) => x.id === BY_TYPE[type])!;
        return (
          <section key={type} data-type={type} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <h2 style={{ margin: 0, fontSize: 36, fontWeight: 400, color: "#1a2942" }}>{type}</h2>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 60 }}>
              {kinds.map((kind) => (
                <figure key={kind} data-design={`${type} · ${ART_SIZES[kind].label}`} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  <figcaption style={{ fontSize: 20, fontWeight: 400, color: "#5b6472" }}>{ART_SIZES[kind].use}</figcaption>
                  <div style={{ width: ART_SIZES[kind].w, height: ART_SIZES[kind].h, position: "relative", flex: "none" }}>
                    <Artwork e={e} kind={kind} design={design} agent={kind === "flyer" ? agent : undefined} />
                  </div>
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
