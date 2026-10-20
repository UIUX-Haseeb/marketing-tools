"use client";

/**
 * Template sheet: the brochure page by page at full size, for review and for capturing into Figma
 * (ProvToys-Templates › Secondary Brochures) as editable layers. Fonts are registered as
 * "Google Sans Flex" so Figma maps them. Each page sits in a `figure[data-design]` named as in Figma.
 *
 *   /sheet/secondary                              the first listing on its own (2 pages), designs A and B
 *   /sheet/secondary?listing=<ref>                another listing (PR-09102610 …)
 *   /sheet/secondary?listing=<ref>,<ref>,<ref>    several listings in one brochure
 *   /sheet/secondary?listing=all&design=a         every listing in one brochure — the stress test
 */
import type { ReactNode } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";
import { agentFrom } from "./agent";
import { headline } from "./format";
import { buildBrochure } from "./pages";
import { LISTINGS } from "./real";
import { DESIGNS, defaultSlots, type Design, type Listing } from "./types";

const FONTS = [300, 400, 500]
  .map((w) => `@font-face{font-family:"Google Sans Flex";font-style:normal;font-weight:${w};font-display:block;src:url(/tools/secondary-brochure/fonts/GoogleSansFlex-${w}.woff2) format("woff2");}`)
  .join("");

function Row({ id, title, pages }: { id: string; title: string; pages: { name: string; node: ReactNode }[] }) {
  return (
    <section data-row={id} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <h2 style={{ margin: 0, fontSize: 40, fontWeight: 400, color: "#1a2942" }}>{title}</h2>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
        {pages.map((p) => (
          <figure key={p.name} data-design={p.name} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <figcaption style={{ fontSize: 24, fontWeight: 400, color: "#2f4960" }}>{p.name}</figcaption>
            <div style={{ width: 1080, height: 1350, position: "relative", flex: "none" }}>{p.node}</div>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function TemplateSheet({ listing, design }: { listing?: string; design?: string }) {
  const refs = listing === "all" ? LISTINGS.map((l) => l.ref) : (listing ?? LISTINGS[0].ref).split(",");
  const list = refs.map((r) => LISTINGS.find((l) => l.ref === r.trim())).filter((l): l is Listing => !!l);
  const items = (list.length ? list : [LISTINGS[0]]).map((l) => ({ l, slots: defaultSlots(l) }));
  const agent = agentFrom(EMPLOYEES[0]);
  const rows = DESIGNS.filter((d) => !design || d.id === design).map((d) => {
    const { pages } = buildBrochure(d.id as Design, { items, agent });
    return {
      id: d.id,
      title: `Brochure ${d.name} — ${items.length === 1 ? `${headline(items[0].l)} · ${items[0].l.ref}` : `${items.length} properties`}`,
      pages: pages.map((p, k) => ({ name: `Brochure ${d.name} · ${String(k + 1).padStart(2, "0")} ${p.key === "closing" ? "Ask Us About" : "Property"}${items.length > 1 && p.key !== "closing" ? ` ${p.name}` : ""}`, node: p.node })),
    };
  });
  return (
    <main data-sheet="secondary-brochure" style={{ ["--font-google-sans" as string]: '"Google Sans Flex"', fontFamily: '"Google Sans Flex", sans-serif', display: "flex", flexDirection: "column", gap: 160, padding: 120, background: "#e9e6e1", width: "max-content", minHeight: "100vh" }}>
      <style>{FONTS}</style>
      {rows.map((r) => (
        <Row key={r.id} {...r} />
      ))}
    </main>
  );
}
