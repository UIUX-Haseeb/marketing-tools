import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KIT_LOGOS, type KitLogo, type LogoFormat } from "./kit";

const FORMAT_HINT: Record<LogoFormat, string> = {
  png: "Transparent background, for documents and web",
  jpg: "On a square background, for WhatsApp and social",
};

export function Logos() {
  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Logos</p>
        <h2 className="mt-1 text-h2">Provident logo</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Navy on light backgrounds, white on dark ones. Don&apos;t stretch, recolour or redraw it.
        </p>
      </div>

      {KIT_LOGOS.map((set) => (
        <section key={set.name} className="space-y-4">
          <div>
            <h3 className="font-normal">{set.name}</h3>
            <p className="text-sm text-muted-foreground">{set.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {set.logos.map((logo) => (
              <LogoTile key={logo.file} name={set.name} logo={logo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LogoTile({ name, logo }: { name: string; logo: KitLogo }) {
  const stem = `Provident ${name} ${logo.label}`.replace(/[^\w -]+/g, "").replace(/\s+/g, "-");
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className={cn("flex aspect-[16/9] items-center justify-center p-8", logo.tone === "white" ? "bg-navy" : "bg-paper")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the exact file that downloads */}
        <img src={`${logo.file}.png`} alt={`${name}, ${logo.label}`} className="max-h-16 max-w-[75%] object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-sm">{logo.label}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {logo.formats.map((f) => (
            <Button key={f} asChild size="sm" variant={f === "png" ? "default" : "outline"}>
              <a href={`${logo.file}.${f}`} download={`${stem}.${f}`} title={FORMAT_HINT[f]}>
                <Download /> {f.toUpperCase()}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
