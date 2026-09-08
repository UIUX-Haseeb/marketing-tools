import { notFound } from "next/navigation";
import { requireUser } from "@/auth";
import { isAdmin } from "@/lib/teams";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";

export const metadata = { title: "Style guide" };

const BRAND = [
  ["Deep Navy", "bg-navy", "#1A2942", "primary surface, text"],
  ["Provident Navy", "bg-navy-2", "#2F4960", "brand voice, hover borders"],
  ["Signature Orange", "bg-orange", "#F3793C", "the dot — punctuation only"],
  ["Paper", "bg-paper border", "#FAF8F4", "page background"],
  ["Cream", "bg-cream", "#F4F1EC", "secondary fills"],
  ["Mist", "bg-mist", "#ECE7DF", "muted fills"],
  ["Stone", "bg-stone", "#D4CFC4", "borders, inputs"],
  ["Charcoal", "bg-charcoal", "#1A1A1A", "rare — artwork only"],
] as const;

const SEMANTIC = [
  ["background", "bg-background border"],
  ["card", "bg-card border"],
  ["primary", "bg-primary"],
  ["secondary", "bg-secondary"],
  ["muted", "bg-muted"],
  ["brand", "bg-brand"],
  ["info", "bg-info"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["destructive", "bg-destructive"],
] as const;

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-h2 font-medium">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function StyleguidePage() {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();

  return (
    <div className="space-y-14">
      <header>
        <p className="kicker">Prov Toys</p>
        <h1 className="mt-2 text-display font-medium">
          Style <span className="accent-word">guide</span><span className="text-brand">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          The tokens and primitives every tool should use. Source of truth is <code className="rounded bg-muted px-1 py-0.5 text-[13px]">src/app/globals.css</code>;
          never hardcode hex values in a tool.
        </p>
      </header>

      <Block title="Logo" note="Wordmark only. Navy on light surfaces, paper on navy. The dot is always orange. Minimum height 16px.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex h-28 items-center justify-center rounded-xl border bg-card"><Logo height={28} /></div>
          <div className="flex h-28 items-center justify-center rounded-xl bg-navy"><Logo tone="light" height={28} /></div>
        </div>
      </Block>

      <Block title="Brand palette" note="Navy dominates. Orange punctuates. Warm neutrals carry the breathing room.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND.map(([name, cls, hex, use]) => (
            <div key={name} className="overflow-hidden rounded-xl border bg-card">
              <div className={`h-16 ${cls}`} />
              <div className="p-3">
                <p className="text-sm font-medium">{name}</p>
                <p className="font-mono text-xs text-muted-foreground">{hex}</p>
                <p className="mt-1 text-xs text-muted-foreground">{use}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Semantic tokens" note="Use these in components: bg-primary, text-muted-foreground, border-border, text-brand … They flip automatically in dark mode.">
        <div className="flex flex-wrap gap-3">
          {SEMANTIC.map(([name, cls]) => (
            <div key={name} className="flex items-center gap-2 rounded-lg border bg-card py-1.5 pl-1.5 pr-3">
              <span className={`size-6 rounded-md ${cls}`} />
              <span className="font-mono text-xs">{name}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Typography" note="Google Sans Flex for everything. Literata italic for one accent word in a headline — never for UI text.">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div><p className="kicker mb-2">text-display · 40/1.1 · medium</p><p className="text-display font-medium">Considered <span className="accent-word">homes</span><span className="text-brand">.</span></p></div>
          <div><p className="kicker mb-2">text-h1 · 28/1.2 · medium</p><p className="text-h1 font-medium">Page title</p></div>
          <div><p className="kicker mb-2">text-h2 · 20/1.3 · medium</p><p className="text-h2 font-medium">Section title</p></div>
          <div><p className="kicker mb-2">text-base · 16 · regular</p><p>Body copy for descriptions and longer help text. Keep it short; agents skim.</p></div>
          <div><p className="kicker mb-2">text-sm · 14 · regular</p><p className="text-sm text-muted-foreground">Supporting copy, table cells, metadata.</p></div>
          <div><p className="kicker mb-2">kicker · 11 · medium · tracked</p><p className="kicker">Section label</p></div>
        </div>
      </Block>

      <Block title="Buttons" note="One primary action per view. Orange (brand) buttons are rare — reserve for the single most important moment, e.g. Publish.">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-6">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm" variant="outline">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Block>

      <Block title="Badges & status">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-6">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span className="mx-2 h-5 w-px bg-border" />
          <StatusBadge status="NEW" />
          <StatusBadge status="IN_PROGRESS" />
          <StatusBadge status="DONE" />
          <StatusBadge status="REJECTED" />
        </div>
      </Block>

      <Block title="Form controls" note="Labels above fields. Helper text below in text-muted-foreground. Max form width ~36rem.">
        <div className="grid max-w-xl gap-5 rounded-xl border bg-card p-6">
          <div className="space-y-2"><Label htmlFor="sg-1">Text input</Label><Input id="sg-1" placeholder="Placeholder" /></div>
          <div className="space-y-2"><Label htmlFor="sg-2">Select</Label><Select id="sg-2" defaultValue="a"><option value="a">Option A</option><option value="b">Option B</option></Select></div>
          <div className="space-y-2"><Label htmlFor="sg-3">Textarea</Label><Textarea id="sg-3" placeholder="Longer text…" rows={3} /><p className="text-xs text-muted-foreground">Helper text goes here.</p></div>
        </div>
      </Block>

      <Block title="Spacing & radius" note="4px grid. Cards: rounded-xl, p-5/p-6, 1px stone border, white on paper. Page gutter px-6 md:px-10. Section gap space-y-12.">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-6">
          {[["sm", "rounded-sm"], ["md", "rounded-md"], ["lg", "rounded-lg"], ["xl", "rounded-xl"], ["2xl", "rounded-2xl"], ["full", "rounded-full"]].map(([n, c]) => (
            <div key={n} className="text-center"><div className={`size-14 bg-navy ${c}`} /><p className="mt-1.5 font-mono text-xs text-muted-foreground">{n}</p></div>
          ))}
        </div>
      </Block>
    </div>
  );
}
