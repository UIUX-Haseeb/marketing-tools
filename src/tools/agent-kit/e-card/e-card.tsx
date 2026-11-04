"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * E-business card tab: pick the person, choose with or without the cover photo, check the name,
 * title and photo, choose what the QR opens (their contact or a link), and download a 1080 × 1920
 * PNG for WhatsApp, a story or a phone screen. Fields fill from the employee record (record.ts,
 * the same one the Business card uses) and can be edited; nothing is saved.
 */
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Download, ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPLOYEES } from "@/lib/demo/employees";
import { cn } from "@/lib/utils";
import { cardRecord } from "../business-card/record";
import { PersonPicker } from "../person-picker";
import { CARD_H, CARD_W, DEFAULT_COVER, ScaledCard, type ECardData } from "./artwork";
import { cardBlob, download, photoDataUrl } from "./export";
import { vCard } from "./qr";

interface Fields {
  name: string;
  title: string;
  phone: string;
  email: string;
  photo: string;
}

const START = EMPLOYEES.find((e) => e.active) ?? EMPLOYEES[0];

function fieldsFor(id: string | null): Fields {
  const e = EMPLOYEES.find((x) => x.id === id);
  if (!e) return { name: "", title: "", phone: "", email: "", photo: "" };
  const r = cardRecord(e);
  return { name: r.fullName, title: r.position ?? "", phone: r.phone ?? "", email: r.email ?? "", photo: e.photoUrl ?? "" };
}

export function ECardTab() {
  const [personId, setPersonId] = useState<string | null>(START.id);
  const [f, setF] = useState<Fields>(() => fieldsFor(START.id));
  const [withCover, setWithCover] = useState(true);
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [qrMode, setQrMode] = useState<"contact" | "link">("contact");
  const [link, setLink] = useState("https://www.providentestate.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const node = useRef<HTMLDivElement | null>(null);

  const set = (p: Partial<Fields>) => setF((x) => ({ ...x, ...p }));
  const pick = (id: string | null) => {
    setPersonId(id);
    setF(fieldsFor(id));
  };

  const qr = useMemo(() => (qrMode === "link" ? link.trim() : vCard(f)), [qrMode, link, f]);
  const data: ECardData = { name: f.name, title: f.title, photo: f.photo, cover: withCover ? cover : "", qr };

  const save = async () => {
    if (!node.current) return;
    setBusy(true);
    setError("");
    try {
      const slug = (f.name.trim() || "card").replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-");
      download(await cardBlob(node.current, CARD_W, CARD_H), `Provident-e-card-${slug}${withCover ? "" : "-no-cover"}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The download didn’t work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div>
          <p className="kicker">E-business card</p>
          <h2 className="mt-1 text-h2">Your card for the phone</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">A digital card to send on WhatsApp or post as a story. Clients scan the code to save your number.</p>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <p className="text-sm">Card for</p>
            <PersonPicker value={personId} onChange={pick} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ec-name" label="Name">
              <Input id="ec-name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field id="ec-title" label="Job title">
              <Input id="ec-title" value={f.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
          </div>

          <div className="space-y-1.5">
            <Label className="block">Photo</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary">
                {f.photo ? <img src={f.photo} alt="" className="size-full object-cover" /> : <span className="text-[10px] text-muted-foreground">None</span>}
              </div>
              <Upload label="Upload photo" onFile={async (file) => set({ photo: await photoDataUrl(file, 900) })} />
              {f.photo && (
                <Button size="sm" variant="ghost" onClick={() => set({ photo: "" })}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label className="block">Cover</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                value={withCover ? "on" : "off"}
                onChange={(v) => setWithCover(v === "on")}
                options={[
                  { id: "on", label: "With cover photo" },
                  { id: "off", label: "No cover" },
                ]}
              />
              {withCover && <Upload label="Change cover" onFile={async (file) => setCover(await photoDataUrl(file, 2000))} />}
              {withCover && cover !== DEFAULT_COVER && (
                <Button size="sm" variant="ghost" onClick={() => setCover(DEFAULT_COVER)}>
                  Use the skyline
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="block">The QR code opens</Label>
            <Segmented
              value={qrMode}
              onChange={(v) => setQrMode(v as "contact" | "link")}
              options={[
                { id: "contact", label: "My contact details" },
                { id: "link", label: "A link" },
              ]}
            />
            {qrMode === "contact" ? (
              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                <Field id="ec-phone" label="Mobile">
                  <Input id="ec-phone" type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
                </Field>
                <Field id="ec-email" label="Email">
                  <Input id="ec-email" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />
                </Field>
                <p className="text-xs text-muted-foreground sm:col-span-2">Scanning offers to save your name, title, mobile and email to the phone&apos;s contacts.</p>
              </div>
            ) : (
              <div className="pt-1">
                <Input aria-label="Link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 md:sticky md:top-6 md:self-start">
        <div className="rounded-xl border bg-card p-3">
          <ScaledCard d={data} cardRef={(el) => (node.current = el)} />
        </div>
        <Button className="w-full" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Download PNG
        </Button>
        <p className="text-center text-xs text-muted-foreground">1080 × 1920 px{error && <span className="mt-1 block text-destructive">{error}</span>}</p>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (id: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div role="radiogroup" className="inline-flex gap-0.5 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn("rounded-md px-3 py-1 text-sm transition-colors", o.id === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Upload({ label, onFile }: { label: string; onFile: (f: File) => Promise<void> | void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => input.current?.click()}>
        <ImageUp /> {label}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) await onFile(file);
        }}
      />
    </>
  );
}
