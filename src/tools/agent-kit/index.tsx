import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIT_BANNERS, KIT_DOCS, driveDownload, driveView } from "./kit";
import { KitTabs } from "./tabs";
import { Logos } from "./logos";
import { BusinessCard } from "./business-card/business-card";

export default function AgentKitPage() {
  return (
    <KitTabs
      tabs={[
        { id: "downloads", label: "Documents & banners", content: <Downloads /> },
        { id: "logos", label: "Logos", content: <Logos /> },
        { id: "business-card", label: "Business card", content: <BusinessCard />, wide: true },
      ]}
    />
  );
}

function Downloads() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <p className="kicker">Documents</p>
          <h2 className="mt-1 text-h2">Share with clients</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {KIT_DOCS.map((doc) => (
            <div key={doc.name} className="flex flex-col overflow-hidden rounded-xl border bg-card">
              <a href={driveView(doc.driveId)} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden border-b bg-[#e3e3e3]">
                {/* eslint-disable-next-line @next/next/no-img-element -- static mockup, cropped to fit (1440 × 800) */}
                <img
                  src={doc.cover}
                  alt={`${doc.name} brochure`}
                  width={1440}
                  height={800}
                  className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </a>
              <div className="flex flex-1 flex-col gap-4 p-5">
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
