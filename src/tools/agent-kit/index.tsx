import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIT_BANNERS, KIT_DOCS, driveDownload, driveView } from "./kit";

export default function AgentKitPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <p className="kicker">Documents</p>
          <h2 className="mt-1 text-h2">Share with clients</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {KIT_DOCS.map((doc) => (
            <div key={doc.name} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="space-y-1">
                <p className="font-normal">{doc.name}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{doc.description}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={driveDownload(doc.driveId)} target="_blank" rel="noopener noreferrer">
                    <Download /> Download
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={driveView(doc.driveId)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Open in Drive
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="kicker">Banners</p>
          <h2 className="mt-1 text-h2">Your social profiles</h2>
        </div>
        <div className="space-y-4">
          {KIT_BANNERS.map((b) => (
            <div key={b.name} className="overflow-hidden rounded-xl border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- show the exact file that downloads */}
              <img src={b.src} alt={b.name} width={b.width} height={b.height} className="block h-auto w-full bg-navy" />
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="space-y-1">
                  <p className="font-normal">{b.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.description} {b.width} × {b.height} px, PNG.
                  </p>
                </div>
                <Button asChild size="sm">
                  <a href={b.src} download={b.filename}>
                    <Download /> Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
