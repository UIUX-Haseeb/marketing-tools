import type { Metadata } from "next";
import { TemplateSheet } from "@/tools/project-booklet/sheet";

export const metadata: Metadata = { title: "Template sheet" };

/** Every social design at full size for one saved project — see src/tools/project-booklet/sheet.tsx. */
export default async function SheetPage({ searchParams }: { searchParams: Promise<{ project?: string; row?: string }> }) {
  const { project, row } = await searchParams;
  return <TemplateSheet projectId={project} row={row} />;
}
