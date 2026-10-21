"use client";

/**
 * Template sheet: every design at full size for one saved project — the single post (feed and
 * story, designs A and B), both carousels slide by slide and both brochures page by page — laid out on one page
 * for design review and for capturing into Figma as editable layers (see README). Each design
 * sits in a `figure[data-design]` named the way it is named in Figma.
 *
 *   /sheet                    the first saved project, every row
 *   /sheet?project=<id>       another saved project
 *   /sheet?row=single         one row only: single | carousel-a | carousel-b | brochure-a | brochure-b
 */
import type { ReactNode } from "react";
import { EMPLOYEES } from "@/lib/demo/employees";
import { PERMIT_QR_SRC } from "@/tools/_shared/permit-qr";
import { agentFrom } from "./agent";
import { PROJECTS } from "./projects";
import { buildBooklet } from "./pages";
import { buildCarousel, buildSingle } from "./social";
import { defaultSlots, type PostFormat, type SocialDesign } from "./types";

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
  const qr = PERMIT_QR_SRC;
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
  const brochure = (design: "a" | "b", label: string): Design[] =>
    buildBooklet(design, { d, agent, qr, slots: defaultSlots(d, design) }).pages.map((p, i) => ({
      name: `Brochure ${label} · ${String(i + 1).padStart(2, "0")} ${p.name}`,
      w: p.w,
      h: p.h,
      node: p.node,
    }));
  const rows = [
    { id: "single", title: `Single post — ${d.name}`, designs: [single("feed", "a", "A Stacked"), single("story", "a", "A Stacked"), single("feed", "b", "B Split"), single("story", "b", "B Split")] },
    { id: "carousel-a", title: `Carousel A · Navy — ${d.name}`, designs: carousel("a", "A Navy") },
    { id: "carousel-b", title: `Carousel B · White — ${d.name}`, designs: carousel("b", "B White") },
    { id: "brochure-a", title: `Brochure A · Paper & navy — ${d.name}`, designs: brochure("a", "A Paper & navy") },
    { id: "brochure-b", title: `Brochure B · White — ${d.name}`, designs: brochure("b", "B White") },
  ].filter((r) => !row || r.id === row);
  return (
    <main data-sheet={saved.id} style={{ display: "flex", flexDirection: "column", gap: 160, padding: 120, background: "#e9e6e1", width: "max-content", minHeight: "100vh" }}>
      {rows.map((r) => (
        <Row key={r.id} {...r} />
      ))}
    </main>
  );
}
