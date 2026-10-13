import type { Metadata } from "next";
import { TemplateSheet } from "@/tools/events/sheet";

export const metadata: Metadata = { title: "Event template sheet" };

/** The main event templates — one per event type — for review and Figma capture. See src/tools/events/sheet.tsx. */
export default async function EventSheetPage({ searchParams }: { searchParams: Promise<{ design?: string; kind?: string }> }) {
  const { design, kind } = await searchParams;
  return (
    <>
      {/* Figma html-to-design capture: only acts when the URL carries #figmacapture=… */}
      <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      <TemplateSheet design={design} kind={kind} />
    </>
  );
}
