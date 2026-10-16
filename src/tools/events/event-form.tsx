"use client";

/**
 * Add event / Edit event — the CRM dialog's six tabs. Details, Schedule and Location are what
 * the artwork reads; Links & media holds the artwork controls (links-media.tsx).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarClock, ChevronDown, FileText, Link2, MapPin, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { blankEvent, sampleDraft, SAMPLE_COUNT, slugify } from "./data";
import { LinksMedia, type FormTab } from "./links-media";
import { COMMUNITIES, COUNTRIES, DEVELOPERS, PROJECTS } from "./photos";
import { saveEvent, useEvents } from "./store";
import { AUDIENCES, EVENT_TYPES, STATUSES, TIMEZONES, WEEKDAYS, type EventRecord, type EventType } from "./types";
import { Modal, Pill, Switch } from "./ui";

const TABS: { id: FormTab; label: string; icon: ReactNode }[] = [
  { id: "details", label: "Details", icon: <FileText /> },
  { id: "schedule", label: "Schedule", icon: <CalendarClock /> },
  { id: "location", label: "Location", icon: <MapPin /> },
  { id: "links", label: "Links & media", icon: <Link2 /> },
  { id: "registration", label: "Registration", icon: <Ticket /> },
  { id: "contact", label: "Contact", icon: <User /> },
];

const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function Field({ label, htmlFor, help, error, children, className }: { label: string; htmlFor?: string; help?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/** Event type: a dropdown of checkboxes (an event can be two types — a launch that is also an open house). */
function TypePicker({ value, onChange, error }: { value: EventType[]; onChange: (v: EventType[]) => void; error?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (ev: MouseEvent) => !ref.current?.contains(ev.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        id="types"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex min-h-9 w-full items-center gap-1.5 rounded-md border border-input px-3 py-1 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40", error && "border-destructive")}
      >
        {value.length ? value.map((t) => <Pill key={t}>{t}</Pill>) : <span className="text-muted-foreground">e.g. Open house</span>}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-popover p-1 shadow-lg">
          {EVENT_TYPES.map((t) => (
            <li key={t}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                <input type="checkbox" className="size-4 accent-navy" checked={value.includes(t)} onChange={(ev) => onChange(ev.target.checked ? EVENT_TYPES.filter((x) => x === t || value.includes(x)) : value.filter((x) => x !== t))} />
                {t}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Errors = Partial<Record<"title" | "types" | "starts" | "ends", string>>;
const ERROR_TAB: Record<keyof Errors, FormTab> = { title: "details", types: "details", starts: "schedule", ends: "schedule" };

function validate(e: EventRecord): Errors {
  const out: Errors = {};
  if (!e.title.trim()) out.title = "Give the event a title.";
  if (!e.types.length) out.types = "Pick at least one event type.";
  if (!e.starts) out.starts = "When does it start?";
  if (!e.ends) out.ends = "When does it end?";
  else if (e.starts && e.ends < e.starts) out.ends = "Ends before it starts.";
  return out;
}

/** Each new Add event opens the next sample draft (testing without typing). */
let nextSample = 0;

export function EventForm({ initial, onClose, onSaved }: { initial?: EventRecord; onClose: () => void; onSaved: (e: EventRecord) => void }) {
  const events = useEvents();
  const [sample, setSample] = useState<number | null>(() => (initial ? null : nextSample++ % SAMPLE_COUNT));
  const [e, setE] = useState<EventRecord>(() => initial ?? sampleDraft(sample ?? 0));
  const [tab, setTab] = useState<FormTab>("details");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [tried, setTried] = useState(false);
  // Errors show after the first Save, then follow the fields as they're fixed.
  const errors: Errors = tried ? validate(e) : {};
  const load = (i: number | null) => {
    setSample(i);
    setE(i === null ? blankEvent() : sampleDraft(i));
    setSlugTouched(false);
    setTried(false);
  };
  const body = useRef<HTMLDivElement>(null);
  const set = (p: Partial<EventRecord>) => setE((x) => ({ ...x, ...p }));
  const goTo = (t: FormTab) => {
    setTab(t);
    body.current?.scrollTo({ top: 0 });
  };

  const submit = () => {
    const errs = validate(e);
    setTried(true);
    const first = (Object.keys(errs) as (keyof Errors)[])[0];
    if (first) return goTo(ERROR_TAB[first]);
    let slug = e.slug || slugify(e.title);
    const taken = new Set(events.filter((x) => x.id !== e.id).map((x) => x.slug));
    for (let i = 2; taken.has(slug); i++) slug = `${slugify(e.slug || e.title)}-${i}`;
    const stamp = nowStamp();
    const saved: EventRecord = {
      ...e,
      slug,
      id: e.id || crypto.randomUUID(),
      created: e.created || stamp,
      createdBy: e.createdBy || "Prov Toys demo",
      updated: stamp,
      updatedBy: "Prov Toys demo",
      firstPublished: e.firstPublished || (e.status === "Published" ? stamp : ""),
    };
    saveEvent(saved);
    onSaved(saved);
  };

  return (
    <Modal label={initial ? "Edit event" : "Add event"} onClose={onClose} className="max-w-[900px] rounded-xl">
      <div className="px-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[rgba(20,28,48,0.9)]">{initial ? "Edit event" : "Add event"}</h2>
          {!initial && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="mr-1">{sample === null ? "Blank form" : `Test sample ${sample + 1} of ${SAMPLE_COUNT}`}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => load(((sample ?? -1) + 1) % SAMPLE_COUNT)}>
                Next sample
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => load(null)} disabled={sample === null}>
                Start blank
              </Button>
            </div>
          )}
        </div>
        <div role="tablist" className="-mx-1 mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const bad = (Object.keys(errors) as (keyof Errors)[]).some((k) => ERROR_TAB[k] === t.id);
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => goTo(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors [&_svg]:size-4",
                  tab === t.id ? "border-[#2f4960] font-medium text-[#2f4960]" : "border-transparent font-medium text-[rgba(20,28,48,0.9)] hover:text-[#2f4960]",
                )}
              >
                {t.icon}
                {t.label}
                {bad && <span className="size-1.5 rounded-full bg-destructive" />}
              </button>
            );
          })}
        </div>
      </div>
      <div ref={body} className="flex-1 overflow-y-auto border-t px-6 py-5">
        {tab === "details" && (
          <div className="space-y-5">
            <Field label="Title *" htmlFor="title" error={errors.title}>
              <Input
                id="title"
                placeholder="e.g. Marina Heights launch"
                value={e.title}
                onChange={(ev) => set({ title: ev.target.value, ...(slugTouched ? {} : { slug: slugify(ev.target.value) }) })}
              />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle" help="One short line — it sits under the title on the banner.">
              <Input id="subtitle" placeholder="e.g. Two days of private viewings" value={e.subtitle} onChange={(ev) => set({ subtitle: ev.target.value })} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Event type *" htmlFor="types" error={errors.types}>
                <TypePicker value={e.types} onChange={(types) => set({ types })} error={!!errors.types} />
              </Field>
              <Field label="Status" htmlFor="status" help="Leave empty to start in the default status.">
                <Select id="status" value={e.status} onChange={(ev) => set({ status: ev.target.value as EventRecord["status"] })}>
                  {STATUSES.map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
            </div>
            <Field
              label="Audience"
              htmlFor="audience"
              className="sm:max-w-[calc(50%-10px)]"
              help={
                <span className="block space-y-1.5">
                  <span className="block">{e.audience === "Public" ? "Public — visible to everyone, signed in or not." : "Internal — only signed-in staff see it."}</span>
                  <span className="flex gap-1.5">
                    <Pill>{e.status === "Published" && e.audience === "Public" ? "Public" : "Not public"}</Pill>
                    <Pill>{e.status.toLowerCase()}</Pill>
                  </span>
                  {e.status !== "Published" && <span className="block">Not published, so nobody can see it yet.</span>}
                </span>
              }
            >
              <Select id="audience" value={e.audience} onChange={(ev) => set({ audience: ev.target.value as EventRecord["audience"] })}>
                {AUDIENCES.map((x) => <option key={x}>{x}</option>)}
              </Select>
            </Field>
            <Field label="Short description" htmlFor="short">
              <Textarea id="short" rows={2} className="min-h-12" placeholder="e.g. A weekend of guided tours through the show apartment" value={e.shortDescription} onChange={(ev) => set({ shortDescription: ev.target.value })} />
            </Field>
            <Field label="Full description" htmlFor="desc">
              <Textarea id="desc" rows={4} placeholder="e.g. Everything an attendee needs to know" value={e.description} onChange={(ev) => set({ description: ev.target.value })} />
            </Field>
            <Field label="Public URL key (slug)" htmlFor="slug" help="Written from the title as you type. Edit it to set your own, or clear it to follow the title again.">
              <Input
                id="slug"
                placeholder="e.g. marina-heights-launch"
                value={e.slug}
                onChange={(ev) => {
                  const v = slugify(ev.target.value);
                  setSlugTouched(!!v);
                  set({ slug: v || slugify(e.title) });
                }}
              />
            </Field>
            <Switch id="featured" checked={e.featured} onChange={(featured) => set({ featured })} label="Featured event" />
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              One event covers the whole run. <span className="text-foreground">Starts / ends</span> bound it; the weekdays and daily window below decide which days inside that range it actually runs, in the event&apos;s timezone.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Starts at *" htmlFor="starts" error={errors.starts}>
                <Input id="starts" type="datetime-local" value={e.starts} onChange={(ev) => set({ starts: ev.target.value, ...(!e.ends || e.ends < ev.target.value ? { ends: ev.target.value } : {}) })} />
              </Field>
              <Field label="Ends at *" htmlFor="ends" error={errors.ends}>
                <Input id="ends" type="datetime-local" value={e.ends} min={e.starts} onChange={(ev) => set({ ends: ev.target.value })} />
              </Field>
            </div>
            <Field label="Timezone" htmlFor="tz" help="Defaults to Asia/Dubai. Outside Dubai, the banner adds the city's time (e.g. “London time”).">
              <Select id="tz" value={e.timezone} onChange={(ev) => set({ timezone: ev.target.value })}>
                {TIMEZONES.map((x) => <option key={x}>{x}</option>)}
              </Select>
            </Field>
            <div className="space-y-2 border-t pt-5">
              <p className="text-sm font-normal">Repeats on</p>
              <div className="inline-flex overflow-hidden rounded-md border">
                {WEEKDAYS.map((d, i) => {
                  const on = e.repeats.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ repeats: on ? e.repeats.filter((x) => x !== i) : [...e.repeats, i].sort() })}
                      className={cn("h-8 border-r px-2.5 text-xs last:border-r-0", on ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{e.repeats.length ? "Runs only on the picked days — the banner reads “Every …”." : "No weekday picked — the event runs every day in the range."}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Daily start time" htmlFor="ds">
                <Input id="ds" type="time" value={e.dailyStart} onChange={(ev) => set({ dailyStart: ev.target.value })} />
              </Field>
              <Field label="Daily end time" htmlFor="de">
                <Input id="de" type="time" value={e.dailyEnd} onChange={(ev) => set({ dailyEnd: ev.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {tab === "location" && (
          <div className="space-y-5">
            <Switch id="online" checked={e.online} onChange={(online) => set({ online, ...(online && !e.venue ? { venue: "Online Link" } : {}) })} label="Online event — the banner reads “Online”" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Venue name" htmlFor="venue">
                <Input id="venue" placeholder="e.g. Marina Mall atrium" value={e.venue} onChange={(ev) => set({ venue: ev.target.value })} />
              </Field>
              <Field label="City" htmlFor="city">
                <Input id="city" placeholder="e.g. Dubai" value={e.city} onChange={(ev) => set({ city: ev.target.value })} />
              </Field>
              <Field label="Address line 1" htmlFor="a1">
                <Input id="a1" placeholder="e.g. Sheikh Zayed Road" value={e.address1} onChange={(ev) => set({ address1: ev.target.value })} />
              </Field>
              <Field label="Address line 2" htmlFor="a2">
                <Input id="a2" placeholder="e.g. Level 3, East wing" value={e.address2} onChange={(ev) => set({ address2: ev.target.value })} />
              </Field>
            </div>
            <Field label="Country" htmlFor="country">
              <Select id="country" value={e.country} onChange={(ev) => set({ country: ev.target.value })}>
                {COUNTRIES.map((x) => <option key={x}>{x}</option>)}
              </Select>
            </Field>
            <Field label="Google Maps link" htmlFor="maps" help="Paste a Maps link and the coordinates are extracted from it automatically. The map link shown on the event is always derived server-side.">
              <Input id="maps" type="url" placeholder="e.g. https://maps.app.goo.gl/…" value={e.mapsUrl} onChange={(ev) => set({ mapsUrl: ev.target.value })} />
            </Field>
            <div className="space-y-5 border-t pt-5">
              <p className="text-sm font-normal">Linked records</p>
              {(
                [
                  ["developer", "Developer", "e.g. Emaar", DEVELOPERS],
                  ["project", "Project", "e.g. Marina Heights", PROJECTS],
                  ["community", "Community", "e.g. Dubai Marina", COMMUNITIES],
                ] as const
              ).map(([k, label, ph, opts]) => (
                <Field key={k} label={label} htmlFor={k} help={k === "project" ? "The project's photos come first in the artwork's photo strip." : undefined}>
                  <Select id={k} value={e[k]} onChange={(ev) => set({ [k]: ev.target.value })} className={!e[k] ? "text-muted-foreground" : undefined}>
                    <option value="">{ph}</option>
                    {opts.map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
              ))}
            </div>
          </div>
        )}

        {tab === "links" && <LinksMedia e={e} set={set} goTo={goTo} />}

        {tab === "registration" && (
          <div className="space-y-5">
            <Switch id="reg" checked={e.registrationRequired} onChange={(registrationRequired) => set({ registrationRequired })} label="Registration required" />
            <Field label="Capacity" htmlFor="cap" help="Leave empty for no limit.">
              <Input id="cap" inputMode="numeric" placeholder="e.g. 120" value={e.capacity} onChange={(ev) => set({ capacity: ev.target.value.replace(/\D/g, "") })} className="max-w-40" />
            </Field>
            <p className="text-xs text-muted-foreground">The registration link itself is under Links &amp; media.</p>
          </div>
        )}

        {tab === "contact" && (
          <div className="space-y-5">
            <Field label="Name" htmlFor="cn">
              <Input id="cn" placeholder="e.g. Sara Haddad" value={e.contactName} onChange={(ev) => set({ contactName: ev.target.value })} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" htmlFor="cp">
                <Input id="cp" type="tel" placeholder="e.g. +971 50 000 0000" value={e.contactPhone} onChange={(ev) => set({ contactPhone: ev.target.value })} />
              </Field>
              <Field label="Email" htmlFor="ce">
                <Input id="ce" type="email" placeholder="e.g. events@provident.ae" value={e.contactEmail} onChange={(ev) => set({ contactEmail: ev.target.value })} />
              </Field>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t px-6 py-3.5">
        <Button variant="ghost" onClick={onClose} className="h-9 rounded-xl font-medium text-[#2f4960]">Cancel</Button>
        <Button onClick={submit} className="h-9 rounded-xl bg-[#2f4960] px-5 font-medium text-white hover:bg-[#2f4960]/90">Save</Button>
      </div>
    </Modal>
  );
}
