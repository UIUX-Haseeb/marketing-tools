"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * "Your contact card" controls under the flyer preview in Links & media. Switching it on fills
 * the card from the signed-in person (a demo employee here); every field can be overwritten,
 * and a photo upload replaces the profile picture — a PNG cut-out stands out of the card.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPLOYEES } from "@/lib/demo/employees";
import { photoDataUrl } from "./exporter";
import { cardFromEmployee, hasTransparentEdges, saveMyCard, useMyCard } from "./my-card";
import { PhotoDropzone } from "./uploads";

/** PNG kept as PNG (a cut-out keeps its transparency), at most 900 px so it fits in localStorage. */
async function pngDataUrl(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.naturalWidth * k);
    cv.height = Math.round(img.naturalHeight * k);
    cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function MyCardPanel() {
  const card = useMyCard();
  const turnOn = (on: boolean) => saveMyCard(on && !card.name ? { on, ...cardFromEmployee(card.employeeId || EMPLOYEES[0].id) } : { on });
  const field = (k: "name" | "title" | "email" | "phone", label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`my-${k}`}>{label}</Label>
      <Input id={`my-${k}`} type={type} value={card[k]} onChange={(ev) => saveMyCard({ [k]: ev.target.value })} />
    </div>
  );
  const upload = async (f: File) => {
    const src = f.type === "image/png" ? await pngDataUrl(f) : await photoDataUrl(f, 900);
    saveMyCard({ photo: src, cutout: await hasTransparentEdges(src) });
  };
  const profile = EMPLOYEES.find((x) => x.id === card.employeeId)?.photoUrl ?? "";

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="size-4 accent-navy" checked={card.on} onChange={(ev) => turnOn(ev.target.checked)} />
        Add my contact card
      </label>
      <p className="text-xs text-muted-foreground">Your name, email, phone and photo at the foot of the flyer, in place of the event contact — so the leads from what you share come to you. Saved in this browser for every flyer you download.</p>
      {card.on && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="my-who">Signed in as <span className="font-normal text-muted-foreground">(demo)</span></Label>
            <select id="my-who" value={card.employeeId} onChange={(ev) => saveMyCard(cardFromEmployee(ev.target.value))} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              {!card.employeeId && <option value="">Choose…</option>}
              {EMPLOYEES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.fullName} — {x.designation}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("name", "Name")}
            {field("title", "Title")}
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel")}
          </div>
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <div className="flex items-start gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-navy">
                {card.photo ? <img src={card.photo} alt="" className="size-full object-contain" /> : <span className="text-[10px] text-paper/70">None</span>}
              </div>
              <div className="min-w-0 flex-1">
                <PhotoDropzone compact label="Upload a photo" onFile={upload} />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {profile && card.photo !== profile && (
                <button type="button" onClick={() => saveMyCard({ photo: profile, cutout: false })} className="underline underline-offset-4 hover:text-foreground">Use profile photo</button>
              )}
              {card.photo && (
                <button type="button" onClick={() => saveMyCard({ photo: "", cutout: false })} className="underline underline-offset-4 hover:text-foreground">No photo</button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.cutout ? "Cut-out photo — it stands out of the card." : "A PNG with a transparent background stands out of the card; other photos sit in a circle."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
