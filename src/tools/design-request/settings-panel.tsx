"use client";

/**
 * "Design settings" — the portal's Photography settings sheet for design requests, open to the
 * Marketing manager: Availability, Designers, Files, Documents, Terms & Conditions. Each tab
 * edits its own copy and saves with its own button; Cancel closes without saving.
 */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CalendarCog, Eye, Info, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LEAD_LABEL, type LeadClass } from "./catalog";
import { fmtDay, isoDay } from "./rules";
import { DEFAULTS, saveSettings, WEEKDAY_NAMES, WEEKDAYS, type Designer, type DocumentRule, type Settings } from "./settings";
import { Terms } from "./terms";
import { Modal, Sheet } from "./ui";

const TABS = [
  { id: "availability", label: "Availability", help: "When requests can be due, and the rules for replies, revisions and flags." },
  { id: "designers", label: "Designers", help: "Each designer’s colour and the days they work." },
  { id: "files", label: "Files", help: "The pictures a request needs and how long a brief must be." },
  { id: "documents", label: "Documents", help: "The documents requesters attach to a design request." },
  { id: "terms", label: "Terms & Conditions", help: "The terms requesters accept on every design request." },
] as const;
type Tab = (typeof TABS)[number]["id"];

const TIMES = Array.from({ length: 29 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const timeLabel = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-navy-2 dark:bg-paper" : "bg-muted")}
    >
      <span className={cn("absolute top-0.5 size-4 rounded-full bg-card shadow transition-[left]", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function Group({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b pb-6 last:border-b-0">
      <div>
        <h3 className="text-base font-normal">{title}</h3>
        {help && <p className="text-sm text-muted-foreground">{help}</p>}
      </div>
      {children}
    </section>
  );
}

function Num({ label, value, onChange, help, min = 0, optional }: { label: string; value: number | null; onChange: (v: number | null) => void; help?: string; min?: number; optional?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm">{label}</span>
      <Input
        type="number"
        min={min}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? (optional ? null : min) : Math.max(min, Number(e.target.value)))}
      />
      {help && <span className="block text-xs text-muted-foreground">{help}</span>}
    </label>
  );
}

function Availability({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const working = s.week.filter((d) => d.on).length;
  return (
    <div className="space-y-6">
      <Group title="Booking rules" help="How far ahead a request must be made, how far ahead it can be due, and how many a day.">
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(s.lead) as LeadClass[]).map((k) => (
            <Num key={k} label={`${LEAD_LABEL[k][0].toUpperCase()}${LEAD_LABEL[k].slice(1)} (working days ahead)`} value={s.lead[k]} min={1} onChange={(v) => set({ lead: { ...s.lead, [k]: v ?? 1 } })} />
          ))}
          <Num label="Book up to (days ahead)" value={s.bookUpTo} min={1} onChange={(v) => set({ bookUpTo: v ?? 1 })} help="The furthest a deadline can be, counted from today." />
          <Num label="Most requests due per day (optional)" value={s.perDay} min={1} optional onChange={(v) => set({ perDay: v })} help="Leave empty for no daily limit." />
        </div>
        <p className="text-xs text-muted-foreground">Each request type has one of these lead times. Same-day requests are never accepted.</p>
      </Group>

      <Group title="Working week" help={`The days Marketing & Design works. Only these count as working days for lead times and replies, and requests can only be due on them. ${working} working days a week.`}>
        <div className="divide-y rounded-xl border">
          {s.week.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Switch on={d.on} label={`${WEEKDAY_NAMES[i]} on`} onChange={(on) => set({ week: s.week.map((x, j) => (j === i ? { ...x, on } : x)) })} />
              <span className={cn("w-28 text-sm", !d.on && "text-muted-foreground")}>
                {WEEKDAY_NAMES[i]}
                <span className="block text-xs text-muted-foreground">{d.on ? "Working" : "Off"}</span>
              </span>
              {d.on && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(["from", "to"] as const).map((k, n) => (
                    <span key={k} className="flex items-center gap-2">
                      {n === 1 && "to"}
                      <Select value={d[k]} onChange={(e) => set({ week: s.week.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} className="w-32" aria-label={`${WEEKDAY_NAMES[i]} ${k}`}>
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {timeLabel(t)}
                          </option>
                        ))}
                      </Select>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Group>

      <Group title="Replies, revisions and flags">
        <div className="grid gap-4 sm:grid-cols-3">
          <Num label="Days to reply" value={s.replyDays} min={1} onChange={(v) => set({ replyDays: v ?? 1 })} help="Working days to answer a returned request — and to send revisions after delivery." />
          <Num label="Revision rounds" value={s.revisionRounds} onChange={(v) => set({ revisionRounds: v ?? 0 })} help="Included with every request." />
          <Num label="Flags before pausing" value={s.flagLimit} min={1} onChange={(v) => set({ flagLimit: v ?? 1 })} help="At this many flags, new requests are paused." />
        </div>
      </Group>
    </div>
  );
}

function Designers({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const [offDate, setOffDate] = useState<Record<string, string>>({});
  const put = (i: number, p: Partial<Designer>) => set({ designers: s.designers.map((d, j) => (j === i ? { ...d, ...p } : d)) });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Each designer can take work due on the days they work. Untick the days someone doesn’t work and add the dates they’re off. Their colour marks their requests on the board and the calendar.</p>
      {s.designers.map((d, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <input type="color" value={d.color} onChange={(e) => put(i, { color: e.target.value })} aria-label={`${d.name} colour`} className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0" />
            <div className="flex-1">
              <Input value={d.name} onChange={(e) => put(i, { name: e.target.value })} aria-label="Designer name" className="h-8 border-transparent px-1 text-base shadow-none hover:border-input" />
              <p className="px-1 text-xs text-muted-foreground">In-house · also off on approved or pending leave</p>
            </div>
            <Button variant="ghost" size="icon" aria-label={`Remove ${d.name}`} onClick={() => set({ designers: s.designers.filter((_, j) => j !== i) })}>
              <Trash2 />
            </Button>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Works on</p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w, j) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={d.days[j]}
                  onClick={() => put(i, { days: d.days.map((x, k) => (k === j ? !x : x)) })}
                  className={cn("h-7 rounded-md border px-2.5 text-xs", d.days[j] ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}
                >
                  {w}
                </button>
              ))}
            </div>
            {!d.days.some(Boolean) && <p className="text-xs text-warning">No working days: this designer can’t be assigned anything.</p>}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Days off</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" value={offDate[i] ?? ""} onChange={(e) => setOffDate((o) => ({ ...o, [i]: e.target.value }))} className="w-44" aria-label={`${d.name} day off`} />
              <Button
                variant="secondary"
                size="sm"
                disabled={!offDate[i] || d.off.includes(offDate[i])}
                onClick={() => {
                  put(i, { off: [...d.off, offDate[i]].sort() });
                  setOffDate((o) => ({ ...o, [i]: "" }));
                }}
              >
                Add day off
              </Button>
              {d.off.map((o) => (
                <span key={o} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                  {fmtDay(o)}
                  <button type="button" aria-label={`Remove ${fmtDay(o)}`} onClick={() => put(i, { off: d.off.filter((x) => x !== o) })}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={() => set({ designers: [...s.designers, { name: "New designer", color: "#64748b", days: [true, true, true, true, true, false, false], off: [] }] })}>
        <Plus /> Add a designer
      </Button>
    </div>
  );
}

function Files({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const f = s.files;
  return (
    <div className="space-y-5">
      <Num label="Smallest picture (px on the long side)" value={f.minPx} min={100} onChange={(v) => set({ files: { ...f, minPx: v ?? 100 } })} help="Photos, renders and logos uploaded as assets. Permit QR codes and approvals aren’t checked." />
      <div className="space-y-2">
        <p className="text-sm">When a picture is smaller</p>
        {(
          [
            ["warn", "Recommended: show a warning and still accept it"],
            ["refuse", "Required: refuse the picture"],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="radio" name="mode" checked={f.mode === v} onChange={() => set({ files: { ...f, mode: v } })} className="size-4 accent-navy-2" />
            {label}
          </label>
        ))}
      </div>
      <Num label="Shortest brief (characters)" value={f.briefMin} min={10} onChange={(v) => set({ files: { ...f, briefMin: v ?? 10 } })} help="A brief shorter than this can’t be sent." />
    </div>
  );
}

function Documents({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const docs = s.documents;
  const put = (i: number, p: Partial<DocumentRule>) => set({ documents: docs.map((d, j) => (j === i ? { ...d, ...p } : d)) });
  const swap = (i: number, j: number) => {
    const next = [...docs];
    [next[i], next[j]] = [next[j], next[i]];
    set({ documents: next });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Each document gets its own upload box in the Approvals step of the request form. A required one must be attached before the request can be sent. The permit, developer and HR approvals are
        built in; requesters can always add other files too.
      </p>
      {docs.map((d, i) => (
        <div key={d.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-end gap-2">
            <label className="block flex-1 space-y-1.5">
              <span className="text-xs text-muted-foreground">Name</span>
              <Input value={d.name} onChange={(e) => put(i, { name: e.target.value })} />
            </label>
            <Button variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => swap(i, i - 1)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Move down" disabled={i === docs.length - 1} onClick={() => swap(i, i + 1)}>
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Delete ${d.name}`} onClick={() => set({ documents: docs.filter((_, j) => j !== i) })}>
              <Trash2 />
            </Button>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Help text (optional)</span>
            <Input value={d.help} onChange={(e) => put(i, { help: e.target.value })} />
          </label>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Switch on={d.required} label="Required" onChange={(required) => put(i, { required, asked: required || d.asked })} /> Required
            </span>
            <span className="flex items-center gap-2">
              <Switch on={d.asked} label="Asked for" onChange={(asked) => put(i, { asked, required: asked && d.required })} /> Asked for
            </span>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={() => set({ documents: [...docs, { id: crypto.randomUUID().slice(0, 8), name: "New document", help: "", required: false, asked: true }] })}>
        <Plus /> Add a document
      </Button>
    </div>
  );
}

function TermsTab({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const t = s.terms;
  const [preview, setPreview] = useState(false);
  const put = (p: Partial<Settings["terms"]>) => set({ terms: { ...t, ...p } });
  return (
    <div className="space-y-4">
      <p className="flex gap-3 rounded-xl border border-info/30 bg-info/10 p-3.5 text-sm text-info">
        <Info className="mt-0.5 size-4 shrink-0" />
        Requesters tick the box below the terms on every new design request, and each request records the version they accepted. When you change the wording, give it a new version.
      </p>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Version</span>
          <Input value={t.version} onChange={(e) => put({ version: e.target.value })} />
          <span className="block text-xs text-muted-foreground">Saved: {fmtDay(t.savedAt)}</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Title</span>
          <Input value={t.title} onChange={(e) => put({ title: e.target.value })} />
        </label>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Terms & Conditions</span>
          <Button variant="ghost" size="sm" onClick={() => setPreview(true)}>
            <Eye /> Preview
          </Button>
        </div>
        <Textarea rows={16} value={t.body} onChange={(e) => put({ body: e.target.value })} className="font-mono text-xs leading-relaxed" />
        <p className="text-xs text-muted-foreground">
          Type as normal. “## ” starts a heading, “&gt; **Title** text” a highlighted rule, “1.1 ” a numbered clause, “- ” a bullet, and **bold** is bold.
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">Acknowledge & Accept text</span>
        <Textarea rows={2} value={t.ack} onChange={(e) => put({ ack: e.target.value })} />
        <span className="block text-xs text-muted-foreground">Shown beside the first required tick-box.</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">Note under the tick-boxes</span>
        <Input value={t.note} onChange={(e) => put({ note: e.target.value })} />
      </label>
      <Button variant="ghost" size="sm" onClick={() => put({ body: DEFAULTS.terms.body })}>
        Put back the handover wording
      </Button>
      {preview && (
        <Modal label="Terms preview" onClose={() => setPreview(false)} className="max-w-[760px]">
          <div className="overflow-y-auto p-6">
            <Terms title={t.title} version={t.version} body={t.body} />
          </div>
          <footer className="flex justify-end border-t px-6 py-3">
            <Button variant="secondary" onClick={() => setPreview(false)}>
              Close
            </Button>
          </footer>
        </Modal>
      )}
    </div>
  );
}

const SAVE: Record<Tab, string> = { availability: "Save availability", designers: "Save designers", files: "Save file rules", documents: "Save documents", terms: "Save Terms & Conditions" };

export function SettingsPanel({ current, onClose }: { current: Settings; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("availability");
  const [draft, setDraft] = useState<Settings>(current);
  const [saved, setSaved] = useState<Tab | null>(null);
  const set = (p: Partial<Settings>) => {
    setDraft((d) => ({ ...d, ...p }));
    setSaved(null);
  };
  const info = TABS.find((t) => t.id === tab)!;

  const save = () => {
    const keys: Record<Tab, (keyof Settings)[]> = {
      availability: ["lead", "bookUpTo", "perDay", "week", "replyDays", "revisionRounds", "flagLimit"],
      designers: ["designers"],
      files: ["files"],
      documents: ["documents"],
      terms: ["terms"],
    };
    const patch = Object.fromEntries(keys[tab].map((k) => [k, draft[k]])) as Partial<Settings>;
    if (tab === "terms") patch.terms = { ...draft.terms, savedAt: isoDay(new Date()) };
    saveSettings(patch);
    if (patch.terms) setDraft((d) => ({ ...d, terms: patch.terms! }));
    setSaved(tab);
  };

  return (
    <Sheet label="Design settings" onClose={onClose} width="max-w-[760px]">
      <header className="flex items-start justify-between gap-4 border-b px-6 pt-5 pb-3">
        <div className="flex gap-3">
          <CalendarCog className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="text-lg leading-snug font-normal">Design settings</h2>
            <p className="text-sm text-muted-foreground">{info.help}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </header>
      <nav className="flex overflow-x-auto border-b px-4 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn("shrink-0 border-b-2 px-4 py-3 text-sm whitespace-nowrap", tab === t.id ? "border-navy-2 text-foreground dark:border-paper" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {tab === "availability" && <Availability s={draft} set={set} />}
        {tab === "designers" && <Designers s={draft} set={set} />}
        {tab === "files" && <Files s={draft} set={set} />}
        {tab === "documents" && <Documents s={draft} set={set} />}
        {tab === "terms" && <TermsTab s={draft} set={set} />}
      </div>
      <footer className="flex items-center justify-end gap-2 border-t px-6 py-3">
        {saved === tab && <span className="mr-auto text-sm text-success">Saved.</span>}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>
          <Save /> {SAVE[tab]}
        </Button>
      </footer>
    </Sheet>
  );
}
