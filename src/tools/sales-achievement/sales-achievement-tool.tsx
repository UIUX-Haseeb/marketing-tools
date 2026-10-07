"use client";

/**
 * Sales Achievement post. Pick the agent (name, designation, photo prefilled — all editable), upload
 * the background photo (a project, a skyline), set the achievement (rank, period, total sale
 * value) and choose which stats to show: total transactions, or primary & secondary separately.
 * The agent's photo has its background removed automatically, as on the Promotion post.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logGeneratedPost } from "@/lib/store";
import { EMPLOYEES } from "@/lib/demo/employees";
import { ensurePostFont, isPostFontReady, unsupportedCharacters } from "@/tools/_shared/font";
import { IDENTITY_TRANSFORM, loadImage, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { downloadBlob, encodeCanvas, formatBytes, safeFileName, type ExportResult } from "@/tools/_shared/export";
import { toDrawable } from "@/tools/_shared/use-post";
import { Counter, PhotoDropzone } from "@/tools/_shared/ui";
import { preloadBackgroundRemoval, removeBackground, type RemoveBgProgress } from "@/tools/_shared/remove-bg";
import { BgRemovalOverlay } from "@/tools/_shared/bg-removal-overlay";
import { BACKGROUND_BOX, coverRect, PERSON_BOX, renderSalesAchievement } from "./render";
import { ACHIEVEMENT, STATS_LAYOUTS, type StatsLayout } from "./template";

const TOOL = "sales-achievement";
const MANUAL = "__manual__";
const L = ACHIEVEMENT.limits;

function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn("h-8 rounded-full border px-3 text-sm transition-colors", o.id === value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeRow({ id, zoom, onZoom, onReset }: { id: string; zoom: number; onZoom: (z: number) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <label htmlFor={id} className="w-8 shrink-0">Size</label>
      <Minus className="size-3" />
      <input id={id} type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
      <Plus className="size-3" />
      <button type="button" onClick={onReset} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">Reset</button>
    </div>
  );
}

function Field({ id, label, value, max, onChange, placeholder, numeric, hint }: { id: string; label: string; value: string; max: number; onChange: (v: string) => void; placeholder: string; numeric?: boolean; hint?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}{hint && <span className="text-muted-foreground"> · {hint}</span>}</Label>
        <Counter value={value} max={max} />
      </div>
      <Input id={id} value={value} onChange={(e) => onChange(numeric ? e.target.value.replace(/[^\d]/g, "") : e.target.value)} placeholder={placeholder} inputMode={numeric ? "numeric" : undefined} autoComplete="off" />
    </div>
  );
}

export function SalesAchievementTool() {
  const [wordmark, setWordmark] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(ACHIEVEMENT.assets.wordmark).then((img) => alive && setWordmark(img)).catch(() => {});
    ensurePostFont().then((r) => {
      if (!alive) return;
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
    preloadBackgroundRemoval();
    return () => {
      alive = false;
    };
  }, []);

  const [layout, setLayout] = useState<StatsLayout>("total");
  const [employeeId, setEmployeeId] = useState<string>(MANUAL);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [rank, setRank] = useState("1");
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [background, setBackground] = useState<Drawable | null>(null);
  const [backgroundT, setBackgroundT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [original, setOriginal] = useState<Drawable | null>(null);
  const [cutout, setCutout] = useState<Drawable | null>(null);
  const [useCutout, setUseCutout] = useState(true);
  const person = useCutout && cutout ? cutout : original;
  const [personT, setPersonT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [qr, setQr] = useState<Drawable | null>(null);
  const [dragTarget, setDragTarget] = useState<"person" | "background">("person");
  const [removing, setRemoving] = useState<RemoveBgProgress | null | false>(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoReq = useRef(0);
  function setPersonSource(img: Drawable | null) {
    setOriginal(img);
    setCutout(null);
    setUseCutout(true);
    setRemoveError(null);
    setPersonT(IDENTITY_TRANSFORM);
  }
  function selectEmployee(id: string) {
    setEmployeeId(id);
    const e = EMPLOYEES.find((x) => x.id === id);
    if (!e) return;
    setName(e.fullName);
    setDesignation(e.designation);
    const req = ++photoReq.current;
    setPersonSource(null);
    if (e.photoUrl) toDrawable(e.photoUrl).then((img) => req === photoReq.current && setPersonSource(img)).catch(() => {});
  }
  async function onPersonUpload(file: File) {
    const req = ++photoReq.current;
    try {
      setPersonSource(await toDrawable(file));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setDragTarget("person");
    setRemoving(null);
    try {
      const blob = await removeBackground(file, (p) => req === photoReq.current && setRemoving(p));
      if (req !== photoReq.current) return;
      setCutout(await toDrawable(blob));
      setPersonT(IDENTITY_TRANSFORM);
    } catch (e) {
      if (req !== photoReq.current) return;
      setRemoveError(`Couldn't remove the background (${(e as Error).message}). The original photo is in place — you can still position it.`);
    } finally {
      if (req === photoReq.current) setRemoving(false);
    }
  }
  function cancelRemoval() {
    photoReq.current++;
    setRemoving(false);
  }
  const load = (set: (d: Drawable) => void, after?: () => void) => async (f: File) => {
    try {
      set(await toDrawable(f));
      after?.();
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const bad = useMemo(() => [name, designation, rank, period, amount].flatMap((t) => unsupportedCharacters(t)), [name, designation, rank, period, amount]);
  const problems: string[] = [];
  if (!background) problems.push("Upload the background photo.");
  if (!person) problems.push("Upload the agent's photo.");
  if (!name.trim()) problems.push("Add the agent's name.");
  if (!amount.trim()) problems.push("Add the total sale value.");
  if (layout === "total" && !transactions.trim()) problems.push("Add the number of transactions.");
  if (layout === "split" && (!primary.trim() || !secondary.trim())) problems.push("Add the primary and secondary transactions.");
  if (!qr) problems.push("Upload your DLD permit QR.");
  if (bad.length) problems.push(`The font can't draw: ${[...new Set(bad)].join(" ")}`);
  const ready = fontReady && problems.length === 0;

  const input = useMemo(
    () => ({ layout, wordmark, background, backgroundTransform: backgroundT, person, personTransform: personT, qr, name, designation, rank, period, amount, transactions, primary, secondary, showPlaceholders: true }),
    [layout, wordmark, background, backgroundT, person, personT, qr, name, designation, rank, period, amount, transactions, primary, secondary],
  );
  const stateKey = JSON.stringify([layout, !!background, backgroundT, !!person, useCutout && !!cutout, personT, !!qr, name, designation, rank, period, amount, transactions, primary, secondary]);
  const result = exported?.key === stateKey ? exported.result : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / ACHIEVEMENT.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(ACHIEVEMENT.width * scale * dpr);
      const h = Math.round(ACHIEVEMENT.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderSalesAchievement(ctx, input, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [input, fontReady]);

  const drag = useRef<{ x: number; y: number } | null>(null);
  function moveBy(dx: number, dy: number) {
    if (dragTarget === "person" && person) setPersonT((t) => coverRect(person, PERSON_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
    if (dragTarget === "background" && background) setBackgroundT((t) => coverRect(background, BACKGROUND_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
  }
  const canDrag = dragTarget === "person" ? !!person : !!background;

  async function generate() {
    if (!isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = ACHIEVEMENT.width;
      canvas.height = ACHIEVEMENT.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderSalesAchievement(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(ACHIEVEMENT, `${name} ${period}`, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: `${ACHIEVEMENT.id}-${layout}`, subject: name.trim(), source: employeeId === MANUAL ? "manual" : "demo", employeeId: employeeId === MANUAL ? undefined : employeeId, format: out.extension, bytes: out.bytes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        <Pills label="Stats" value={layout} options={STATS_LAYOUTS} onChange={setLayout} />

        {/* Agent */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="tp-employee">Agent</Label>
            <Select id="tp-employee" value={employeeId} onChange={(e) => selectEmployee(e.target.value)}>
              <option value={MANUAL}>Type details manually…</option>
              {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="tp-name" label="Name" value={name} max={ACHIEVEMENT.name.maxChars} onChange={setName} placeholder="e.g. Jad Demian Youssef" />
            <Field id="tp-designation" label="Designation" value={designation} max={ACHIEVEMENT.designation.maxChars} onChange={setDesignation} placeholder="e.g. Senior Associate - Secondary Sales" />
          </div>
          <div className="space-y-2">
            <Label>Agent photo</Label>
            <PhotoDropzone compact={!!person} label={person ? "Replace agent photo" : undefined} onFile={onPersonUpload} />
            <p className="text-xs text-muted-foreground">The background is removed for you, right here in the browser.</p>
            {removeError && <p className="text-xs text-warning">{removeError}</p>}
            {cutout && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="mr-1 text-muted-foreground">Background</span>
                {[{ on: true, label: "Removed" }, { on: false, label: "Original" }].map((o) => (
                  <button key={o.label} type="button" aria-pressed={useCutout === o.on} onClick={() => setUseCutout(o.on)} className={cn("h-7 rounded-full border px-2.5 transition-colors", useCutout === o.on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {person && <SizeRow id="tp-person-size" zoom={personT.zoom} onZoom={(z) => setPersonT((t) => coverRect(person, PERSON_BOX, { ...t, zoom: z }).clamped)} onReset={() => setPersonT(IDENTITY_TRANSFORM)} />}
          </div>
        </div>

        {/* Background */}
        <div className="space-y-2 border-t pt-5">
          <Label>Background photo</Label>
          <PhotoDropzone compact={!!background} label={background ? "Replace background" : "Upload a project or skyline photo"} onFile={load(setBackground, () => { setBackgroundT(IDENTITY_TRANSFORM); setDragTarget("background"); })} />
          {background && <SizeRow id="tp-bg-size" zoom={backgroundT.zoom} onZoom={(z) => setBackgroundT((t) => coverRect(background, BACKGROUND_BOX, { ...t, zoom: z }).clamped)} onReset={() => setBackgroundT(IDENTITY_TRANSFORM)} />}
        </div>

        {/* Achievement */}
        <div className="space-y-3 border-t pt-5">
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <Field id="tp-rank" label="Rank" value={rank} max={L.rank} onChange={setRank} placeholder="1" numeric />
            <Field id="tp-period" label="Period" value={period} max={L.period} onChange={setPeriod} placeholder="e.g. Q3" />
          </div>
          <Field id="tp-amount" label="Total sale value" value={amount} max={L.amount} onChange={setAmount} placeholder="e.g. AED 80.3 Million" />
          {layout === "total" ? (
            <Field id="tp-trx" label="Transactions" value={transactions} max={L.count} onChange={setTransactions} placeholder="e.g. 10" numeric />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field id="tp-primary" label="Primary" hint="Trx" value={primary} max={L.count} onChange={setPrimary} placeholder="e.g. 5" numeric />
              <Field id="tp-secondary" label="Secondary" hint="Trx" value={secondary} max={L.count} onChange={setSecondary} placeholder="e.g. 10" numeric />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Reads “Secured #{rank || "1"} for {period || "Q3"}, closing on a high note with {amount || "AED 80.3 Million"} in sales”.</p>
        </div>

        {/* QR */}
        <div className="space-y-2 border-t pt-5">
          <Label>DLD QR code</Label>
          <PhotoDropzone compact label={qr ? "Replace QR image" : "Upload your permit QR image"} onFile={load(setQr)} />
        </div>

        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={generate} disabled={!ready || busy}>
            <Download /> {busy ? "Generating…" : result ? "Download again" : ACHIEVEMENT.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {ACHIEVEMENT.width}×{ACHIEVEMENT.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${ACHIEVEMENT.width} / ${ACHIEVEMENT.height}` }}>
          <canvas
            ref={canvasRef}
            className={cn("block h-full w-full touch-none", canDrag && "cursor-grab active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!canDrag) return;
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const k = ACHIEVEMENT.width / e.currentTarget.getBoundingClientRect().width;
              moveBy((e.clientX - drag.current.x) * k, (e.clientY - drag.current.y) * k);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
          {!fontReady && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Drag moves</span>
          {(["person", "background"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={dragTarget === t} onClick={() => setDragTarget(t)} className={cn("h-7 rounded-full border px-2.5 transition-colors", dragTarget === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:text-foreground")}>
              {t === "person" ? "Agent" : "Background"}
            </button>
          ))}
        </div>
      </div>

      {removing !== false && <BgRemovalOverlay progress={removing} onCancel={cancelRemoval} />}
    </div>
  );
}
