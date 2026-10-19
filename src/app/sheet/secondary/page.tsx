import type { Metadata } from "next";
import { TemplateSheet } from "@/tools/secondary-brochure/sheet";

export const metadata: Metadata = { title: "Secondary brochure sheet" };

/** The secondary brochure, page by page, for review and Figma capture. See src/tools/secondary-brochure/sheet.tsx. */
export default async function SecondarySheetPage({ searchParams }: { searchParams: Promise<{ listing?: string; design?: string; frame?: string }> }) {
  const { listing, design, frame } = await searchParams;
  return (
    <>
      {/* Figma html-to-design capture: only acts when the URL carries #figmacapture=… */}
      <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      <TemplateSheet listing={listing} design={design} frame={frame} />
    </>
  );
}
