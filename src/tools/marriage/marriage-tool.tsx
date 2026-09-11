"use client";

/**
 * Marriage / engagement congratulations post. Pick the colleague (name + designation prefilled, editable)
 * or type them in, choose the occasion and he/she for the wording, download.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logGeneratedPost } from "@/lib/store";
import { EMPLOYEES } from "@/lib/demo/employees";
import { ensurePostFont, isPostFontReady, unsupportedCharacters } from "@/tools/_shared/font";
import { loadImage } from "@/tools/_shared/render";
import { downloadBlob, encodeCanvas, formatBytes, safeFileName, type ExportResult } from "@/tools/_shared/export";
import { Counter } from "@/tools/_shared/ui";
import { COLLEAGUE_GENDERS, composeMarriage, OCCASIONS, type GenderId, type OccasionId } from "./compose";
import { renderMarriage } from "./render";
import { MARRIAGE } from "./template";

const TOOL = "marriage";
const MANUAL = "__manual__";

function Choices<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
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

export function MarriageTool() {
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(MARRIAGE.src).then((img) => alive && setArtwork(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    ensurePostFont().then((r) => {
      if (!alive) return;
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
    return () => {
      alive = false;
    };
  }, []);

  const [employeeId, setEmployeeId] = useState<string>(MANUAL);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [occasionId, setOccasionId] = useState<OccasionId>("wedding");
  const [gender, setGender] = useState<GenderId>("male");
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectEmployee(id: string) {
    setEmployeeId(id);
    const e = EMPLOYEES.find((x) => x.id === id);
    if (!e) return;
    setName(e.fullName);
    setTitle(e.designation);
  }

  const message = useMemo(() => composeMarriage({ occasionId, colleagueGender: gender }), [occasionId, gender]);
  const bad = useMemo(() => [...unsupportedCharacters(name), ...unsupportedCharacters(title)], [name, title]);
  const problems: string[] = [];
  if (!name.trim()) problems.push("Add your colleague's name.");
  if (name.length > MARRIAGE.name.maxChars) problems.push(`The name is over ${MARRIAGE.name.maxChars} characters.`);
  if (!title.trim()) problems.push("Add the designation.");
  if (title.length > MARRIAGE.title.maxChars) problems.push(`The designation is over ${MARRIAGE.title.maxChars} characters.`);
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const ready = !!artwork && fontReady && problems.length === 0;

  const input = useMemo(() => (artwork ? { artwork, name, title, message } : null), [artwork, name, title, message]);
  const stateKey = JSON.stringify([name, title, message]);
  const result = exported?.key === stateKey ? exported.result : null;

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / MARRIAGE.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(MARRIAGE.width * scale * dpr);
      const h = Math.round(MARRIAGE.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderMarriage(ctx, input, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [input, fontReady]);

  async function generate() {
    if (!input || !isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = MARRIAGE.width;
      canvas.height = MARRIAGE.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderMarriage(ctx, input, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(MARRIAGE, name, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: MARRIAGE.id, subject: name.trim(), source: employeeId === MANUAL ? "manual" : "demo", employeeId: employeeId === MANUAL ? undefined : employeeId, format: out.extension, bytes: out.bytes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mr-employee">Colleague</Label>
          <Select id="mr-employee" value={employeeId} onChange={(e) => selectEmployee(e.target.value)}>
            <option value={MANUAL}>Type details manually…</option>
            {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Picking someone prefills the fields below — edit anything.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mr-name">Name</Label>
              <Counter value={name} max={MARRIAGE.name.maxChars} />
            </div>
            <Input id="mr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adeeb Trabulsi" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mr-title">Designation</Label>
              <Counter value={title} max={MARRIAGE.title.maxChars} />
            </div>
            <Input id="mr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Business Development Executive" autoComplete="off" />
          </div>
        </div>

        <Choices label="Occasion" options={OCCASIONS} value={occasionId} onChange={setOccasionId} />
        <Choices label="Your colleague is" options={COLLEAGUE_GENDERS} value={gender} onChange={setGender} />

        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={generate} disabled={!ready || busy}>
            <Download /> {busy ? "Generating…" : result ? "Download again" : MARRIAGE.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {MARRIAGE.width}×{MARRIAGE.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${MARRIAGE.width} / ${MARRIAGE.height}` }}>
          <canvas ref={canvasRef} className="block h-full w-full" />
          {(!artwork || !fontReady) && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Preview updates as you type · final size {MARRIAGE.width}×{MARRIAGE.height}</p>
      </div>
    </div>
  );
}
