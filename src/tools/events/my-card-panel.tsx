"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * "Your contact card" controls under the flyer preview in Links & media. Switching it on fills
 * the card from the signed-in person (a demo employee here); every field can be overwritten,
 * and a photo upload replaces the profile picture (shown round, as on the Project Booklet).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPLOYEES } from "@/lib/demo/employees";
import { photoDataUrl } from "./exporter";
import { cardFromEmployee, saveMyCard, useMyCard } from "./my-card";
import { PhotoDropzone } from "./uploads";

export function MyCardPanel() {
  const card = useMyCard();
  const turnOn = (on: boolean) => saveMyCard(on && !card.name ? { on, ...cardFromEmployee(card.employeeId || EMPLOYEES[0].id) } : { on });
  const field = (k: "name" | "title" | "email" | "phone" | "brn", label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`my-${k}`}>{label}</Label>
      <Input id={`my-${k}`} type={type} value={card[k]} onChange={(ev) => saveMyCard({ [k]: ev.target.value })} />
    </div>
  );
  const upload = async (f: File) => saveMyCard({ photo: await photoDataUrl(f, 600) });
  const profile = EMPLOYEES.find((x) => x.id === card.employeeId)?.photoUrl ?? "";

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="size-4 accent-navy" checked={card.on} onChange={(ev) => turnOn(ev.target.checked)} />
        Add my contact card
      </label>
      <p className="text-xs text-muted-foreground">Your photo, name, BRN, title, phone and email at the foot of the flyer, in place of the event contact — so the leads from what you share come to you. Saved in this browser for every flyer you download.</p>
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
            {field("brn", "BRN")}
          </div>
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <div className="flex items-start gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-navy">
                {card.photo ? <img src={card.photo} alt="" className="size-full object-cover" /> : <span className="text-[10px] text-paper/70">None</span>}
              </div>
              <div className="min-w-0 flex-1">
                <PhotoDropzone compact label="Upload a photo" onFile={upload} />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {profile && card.photo !== profile && (
                <button type="button" onClick={() => saveMyCard({ photo: profile })} className="underline underline-offset-4 hover:text-foreground">Use profile photo</button>
              )}
              {card.photo && (
                <button type="button" onClick={() => saveMyCard({ photo: "" })} className="underline underline-offset-4 hover:text-foreground">No photo</button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Shown in a circle — a head-and-shoulders photo works best.</p>
          </div>
        </div>
      )}
    </div>
  );
}
