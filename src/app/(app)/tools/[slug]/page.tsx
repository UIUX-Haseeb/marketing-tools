import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTool, TOOLS } from "@/lib/tools";
import { ToolIcon } from "@/components/tool-icon";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: getTool(slug)?.name ?? "Tool" };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const Tool = tool.component ? (await tool.component()).default : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All tools
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
            <ToolIcon name={tool.icon} className="size-4" />
          </span>
          <div>
            <h1 className="text-h2 leading-tight">{tool.name}</h1>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
        </div>
      </div>

      {Tool ? (
        <Tool />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Mascot size={160} className="-mb-1" />
          <p className="font-normal">This tool is being built</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {tool.owner ? `${tool.owner} is working on it.` : "It'll appear here when ready."} In the meantime you can send Marketing a custom request.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/tools/custom-request">Send a custom request</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
