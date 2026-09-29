"use client";

/**
 * Template sheet: every social design at full size for one saved project — the single post
 * (feed and story, designs A and B) and both carousels, slide by slide — laid out on one page
 * for design review and for capturing into Figma as editable layers (see README). Each design
 * sits in a `figure[data-design]` named the way it is named in Figma.
 *
 *   /sheet                    the first saved project, every row
 *   /sheet?project=<id>       another saved project
 *   /sheet?row=single         one row only: single | carousel-a | carousel-b
 */
import type { ReactNode } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";
import { agentFrom } from "./agent";
import { PROJECTS } from "./projects";
import { buildCarousel, buildSingle } from "./social";
import { defaultSlots, type PostFormat, type SocialDesign } from "./types";

/** A made-up QR — finder squares and seeded modules — so the white plate shows as it prints. */
function sampleQr(): string {
  const n = 33;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const on = new Set<string>();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rnd() > 0.5) on.add(`${x},${y}`);
  const finder = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  for (const [fx, fy] of finder)
    for (let y = -1; y < 8; y++)
      for (let x = -1; x < 8; x++) {
        const k = `${fx + x},${fy + y}`;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        if (ring === 3 || ring <= 1) on.add(k);
        else on.delete(k);
      }
  const rects = [...on]
    .map((k) => k.split(",").map(Number))
    .filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n)
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`)
    .join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#000">${rects}</g></svg>`)}`;
}

type Design = { name: string; w: number; h: number; node: ReactNode };

function Row({ id, title, designs }: { id: string; title: string; designs: Design[] }) {
  return (
    <section data-row={id} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <h2 style={{ margin: 0, fontSize: 40, fontWeight: 400, color: "#1a2942" }}>{title}</h2>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 80 }}>
        {designs.map((x) => (
          <figure key={x.name} data-design={x.name} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <figcaption style={{ fontSize: 24, fontWeight: 400, color: "#2f4960" }}>{x.name}</figcaption>
            <div style={{ width: x.w, height: x.h, position: "relative", flex: "none" }}>{x.node}</div>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function TemplateSheet({ projectId, row }: { projectId?: string; row?: string }) {
  const saved = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const d = saved.data;
  const agent = agentFrom(EMPLOYEES[0]);
  const qr = sampleQr();
  const single = (format: PostFormat, design: SocialDesign, label: string): Design => {
    const page = buildSingle(format, { d, agent, qr, slots: defaultSlots(d, "single"), adjust: {}, design }).pages[0];
    return { name: `Single · ${page.name} · ${label}`, w: page.w, h: page.h, node: page.node };
  };
  const carousel = (design: SocialDesign, label: string): Design[] =>
    buildCarousel({ d, agent, qr, slots: defaultSlots(d, "carousel"), adjust: {}, design }).pages.map((p, i) => ({
      name: `Carousel ${label} · ${String(i + 1).padStart(2, "0")} ${p.name}`,
      w: p.w,
      h: p.h,
      node: p.node,
    }));
  const rows = [
    { id: "single", title: `Single post — ${d.name}`, designs: [single("feed", "a", "A Stacked"), single("story", "a", "A Stacked"), single("feed", "b", "B Split"), single("story", "b", "B Split")] },
    { id: "carousel-a", title: `Carousel A · Navy — ${d.name}`, designs: carousel("a", "A Navy") },
    { id: "carousel-b", title: `Carousel B · White — ${d.name}`, designs: carousel("b", "B White") },
  ].filter((r) => !row || r.id === row);
  return (
    <main data-sheet={saved.id} style={{ display: "flex", flexDirection: "column", gap: 160, padding: 120, background: "#e9e6e1", width: "max-content", minHeight: "100vh" }}>
      {rows.map((r) => (
        <Row key={r.id} {...r} />
      ))}
    </main>
  );
}
