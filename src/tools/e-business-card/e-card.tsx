"use client";

/**
 * E-business Card (an HR tool): pick the colleague, choose with or without the cover photo, check the name,
 * title and photo, choose what the QR opens (their contact page or a link), and download a 1080 × 1920
 * PNG for WhatsApp, a story or a phone screen. Fields fill from the employee record (_shared/card-record.ts,
 * the same one the Agent Download Kit's Business card uses) and can be edited; nothing is saved. The headshot works as on
 * Just Sold: the employee's profile photo comes in with the person, "Add / Replace headshot" swaps
 * it, and Size + dragging inside the circle frame it. The contact page (/card/<id>, contact.ts) is
 * what a client sees after scanning, with Save to phone.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Download, ExternalLink, ImageUp, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPLOYEES } from "@/lib/demo/employees";
import { cn } from "@/lib/utils";
import { PhotoDropzone } from "@/tools/_shared/ui";
import { toDrawable } from "@/tools/_shared/use-post";
import { cardRecord } from "@/tools/_shared/card-record";
import { PersonPicker } from "@/tools/_shared/person-picker";
import { CARD_H, CARD_LOGOS, CARD_W, DEFAULT_COVER, PHOTO_AT_START, ScaledCard, shotRect, type CardLogo, type ECardData, type PhotoAt } from "./artwork";
import { cardBlob, download, photoDataUrl } from "./export";
import { contactPath } from "./contact";

interface Fields {
  name: string;
  title: string;
  brn: string;
  phone: string;
  email: string;
  photo: string;
}

const START = EMPLOYEES.find((e) => e.active) ?? EMPLOYEES[0];
const LIVE = "https://provtoys.vercel.app";
const noop = () => () => {};

function fieldsFor(id: string | null): Fields {
  const e = EMPLOYEES.find((x) => x.id === id);
  if (!e) return { name: "", title: "", brn: "", phone: "", email: "", photo: "" };
  const r = cardRecord(e);
  return { name: r.fullName, title: r.position ?? "", brn: r.brn ?? "", phone: r.phone ?? "", email: r.email ?? "", photo: e.photoUrl ?? "" };
}

export function ECardTool() {
  const [personId, setPersonId] = useState<string | null>(START.id);
  const [f, setF] = useState<Fields>(() => fieldsFor(START.id));
  const [logo, setLogo] = useState<CardLogo>("provident");
  const [withCover, setWithCover] = useState(true);
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [qrMode, setQrMode] = useState<"contact" | "link">("contact");
  const [link, setLink] = useState("https://www.providentestate.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const node = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState<{ src: string; w: number; h: number } | null>(null);
  const [photoAt, setPhotoAt] = useState<PhotoAt>(PHOTO_AT_START);
  // the headshot's size, once read — for the framing maths
  const photoSize = loaded && loaded.src === f.photo ? loaded : null;

  useEffect(() => {
    if (!f.photo) return;
    let alive = true;
    const src = f.photo;
    toDrawable(src)
      .then((img) => alive && setLoaded({ src, w: img.naturalWidth, h: img.naturalHeight }))
      .catch(() => alive && setError("That headshot couldn’t be opened."));
    return () => {
      alive = false;
    };
  }, [f.photo]);
  const frame = (at: PhotoAt) => setPhotoAt(photoSize ? shotRect(photoSize, at).clamped : at);

  const set = (p: Partial<Fields>) => setF((x) => ({ ...x, ...p }));
  const pick = (id: string | null) => {
    setPersonId(id);
    setF(fieldsFor(id));
    setPhotoAt(PHOTO_AT_START);
  };
  /** Your own headshot replaces the profile photo. */
  const uploadHeadshot = async (file: File) => {
    set({ photo: await photoDataUrl(file, 1600) });
    setPhotoAt(PHOTO_AT_START);
  };

  // the QR holds this site's address for the contact page (the live site when rendered on the server)
  const origin = useSyncExternalStore(noop, () => location.origin, () => LIVE);
  const page = contactPath({ id: personId ?? "card", ...f });
  const qr = qrMode === "link" ? link.trim() : origin + page;
  const ownPhoto = !!f.photo && f.photo !== (EMPLOYEES.find((e) => e.id === personId)?.photoUrl ?? "");
  const data: ECardData = { logo, name: f.name, title: f.title, brn: f.brn, photo: f.photo, photoSize, photoAt, cover: withCover ? cover : "", qr };

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
          <h2 className="mt-1 text-h2">A card for the phone</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Make a colleague’s digital card to send them for WhatsApp or a story. Clients scan the code to open their contact page and save their number.</p>
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
            <Field id="ec-brn" label="BRN">
              <Input id="ec-brn" value={f.brn} onChange={(e) => set({ brn: e.target.value })} placeholder="Leave empty if you have none" />
            </Field>
            <Field id="ec-phone" label="Mobile">
              <Input id="ec-phone" type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field id="ec-email" label="Email">
              <Input id="ec-email" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
          </div>

          <div className="space-y-2">
            <Label className="block">Headshot</Label>
            <PhotoDropzone compact label={f.photo ? "Replace headshot" : "Add headshot"} onFile={uploadHeadshot} />
            {f.photo && photoSize && <SizeRow zoom={photoAt.zoom} onZoom={(zoom) => frame({ ...photoAt, zoom })} onReset={() => setPhotoAt(PHOTO_AT_START)} />}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label className="block">Logo</Label>
            <Segmented value={logo} onChange={(v) => setLogo(v as CardLogo)} options={CARD_LOGOS.map((l) => ({ id: l.id, label: l.label }))} />
          </div>

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
                { id: "contact", label: "Their contact page" },
                { id: "link", label: "A link" },
              ]}
            />
            {qrMode === "contact" ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Scanning opens their contact page: Call, WhatsApp, Email and Directions, their details, and <span className="text-foreground">Save to phone</span>, which adds them to the client’s contacts with their photo.
                  {ownPhoto && " The page shows their profile photo from the employee record, not the one uploaded here."}
                </p>
                {f.name.trim() && (
                  <Button asChild size="sm" variant="outline">
                    <a href={page} target="_blank" rel="noopener noreferrer">
                      <ExternalLink /> Open their contact page
                    </a>
                  </Button>
                )}
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
          <ScaledCard d={data} cardRef={(el) => (node.current = el)} onMoveShot={(dx, dy) => frame({ ...photoAt, x: photoAt.x + dx, y: photoAt.y + dy })} />
        </div>
        <Button className="w-full" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Download PNG
        </Button>
        <p className="text-center text-xs text-muted-foreground">{f.photo ? "Drag inside the circle to move the headshot · " : ""}1080 × 1920 px{error && <span className="mt-1 block text-destructive">{error}</span>}</p>
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

/** One-line size control under the headshot upload — Just Sold's. */
function SizeRow({ zoom, onZoom, onReset }: { zoom: number; onZoom: (z: number) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <label htmlFor="ec-shot-size" className="w-8 shrink-0">
        Size
      </label>
      <Minus className="size-3" />
      <input id="ec-shot-size" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
      <Plus className="size-3" />
      <button type="button" onClick={onReset} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">
        Reset
      </button>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (id: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-secondary p-1">
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
