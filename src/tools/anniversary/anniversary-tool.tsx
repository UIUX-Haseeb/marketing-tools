"use client";

/**
 * Work Anniversary post. Pick the colleague from the employee list (name, designation and photo
 * prefilled, all editable) or type them in; enter the number of years (it drives the big brass
 * numeral, the header and the message); position the photo; download. Same photo handling as the
 * Promotion post: the background is removed automatically on upload.
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
import { photoRect, renderAnniversary } from "./render";
import { ANNIVERSARY } from "./template";

const TOOL = "work-anniversary";
const MANUAL = "__manual__";

export function AnniversaryTool() {
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [wordmark, setWordmark] = useState<HTMLImageElement | null>(null);
  const [script, setScript] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(ANNIVERSARY.assets.background).then((img) => alive && setBackground(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    loadImage(ANNIVERSARY.assets.wordmark).then((img) => alive && setWordmark(img)).catch(() => {});
    loadImage(ANNIVERSARY.assets.script).then((img) => alive && setScript(img)).catch(() => {});
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

  const [employeeId, setEmployeeId] = useState<string>(MANUAL);
  const [years, setYears] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  // `original` is what was uploaded, `cutout` the same photo with the background removed.
  const [original, setOriginal] = useState<Drawable | null>(null);
  const [cutout, setCutout] = useState<Drawable | null>(null);
  const [useCutout, setUseCutout] = useState(true);
  const photo = useCutout && cutout ? cutout : original;
  const [photoT, setPhotoT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [removing, setRemoving] = useState<RemoveBgProgress | null | false>(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoReq = useRef(0);
  function setPhotoSource(img: Drawable | null) {
    setOriginal(img);
    setCutout(null);
    setUseCutout(true);
    setRemoveError(null);
    setPhotoT(IDENTITY_TRANSFORM);
  }
  function selectEmployee(id: string) {
    setEmployeeId(id);
    const e = EMPLOYEES.find((x) => x.id === id);
    if (!e) return;
    setName(e.fullName);
    setDesignation(e.designation);
    const req = ++photoReq.current;
    setPhotoSource(null);
    if (e.photoUrl) toDrawable(e.photoUrl).then((img) => req === photoReq.current && setPhotoSource(img)).catch(() => {});
  }

  /** Upload → show the original straight away, cut the background out behind the overlay, swap in the result. */
  async function onUpload(file: File) {
    const req = ++photoReq.current;
    try {
      setPhotoSource(await toDrawable(file));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setRemoving(null);
    try {
      const blob = await removeBackground(file, (p) => req === photoReq.current && setRemoving(p));
      if (req !== photoReq.current) return;
      setCutout(await toDrawable(blob));
      setPhotoT(IDENTITY_TRANSFORM);
    } catch (e) {
      if (req !== photoReq.current) return;
      setRemoveError(`Couldn't remove the background (${(e as Error).message}). The original photo is in place — you can still position it.`);
    } finally {
      if (req === photoReq.current) setRemoving(false);
    }
  }
  /** "Use the photo as it is" while removal runs: keep the original, ignore the result when it lands. */
  function cancelRemoval() {
    photoReq.current++;
    setRemoving(false);
  }

  const { min, max } = ANNIVERSARY.years;
  const n = /^\d+$/.test(years.trim()) ? Number(years.trim()) : NaN;
  const yearsOk = Number.isInteger(n) && n >= min && n <= max;

  const bad = useMemo(() => [...unsupportedCharacters(name), ...unsupportedCharacters(designation)], [name, designation]);
  const problems: string[] = [];
  if (!yearsOk) problems.push(years.trim() ? `Years must be a whole number from ${min} to ${max}.` : "Add the number of years.");
  if (!photo) problems.push("Upload your colleague's photo.");
  if (!name.trim()) problems.push("Add the name.");
  if (name.length > ANNIVERSARY.name.maxChars) problems.push(`The name is over ${ANNIVERSARY.name.maxChars} characters.`);
  if (designation.length > ANNIVERSARY.designation.maxChars) problems.push(`The designation is over ${ANNIVERSARY.designation.maxChars} characters.`);
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const ready = !!background && fontReady && problems.length === 0;

  const input = useMemo(
    () => (background ? { background, wordmark, script, photo, photoTransform: photoT, years: yearsOk ? n : 0, name, designation, showPlaceholders: true } : null),
    [background, wordmark, script, photo, photoT, yearsOk, n, name, designation],
  );
  const stateKey = JSON.stringify([!!photo, useCutout && !!cutout, photoT, years, name, designation]);
  const result = exported?.key === stateKey ? exported.result : null;

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / ANNIVERSARY.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(ANNIVERSARY.width * scale * dpr);
      const h = Math.round(ANNIVERSARY.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderAnniversary(ctx, input, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [input, fontReady]);

  // Drag to move the photo
  const drag = useRef<{ x: number; y: number } | null>(null);

  async function generate() {
    if (!input || !isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = ANNIVERSARY.width;
      canvas.height = ANNIVERSARY.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderAnniversary(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(ANNIVERSARY, `${name} ${n} Years`, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: ANNIVERSARY.id, subject: name.trim(), source: employeeId === MANUAL ? "manual" : "demo", employeeId: employeeId === MANUAL ? undefined : employeeId, format: out.extension, bytes: out.bytes });
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
          <Label htmlFor="an-employee">Colleague</Label>
          <Select id="an-employee" value={employeeId} onChange={(e) => selectEmployee(e.target.value)}>
            <option value={MANUAL}>Type details manually…</option>
            {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Picking someone prefills the name, designation and photo — all editable.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="an-years">Years</Label>
          <Input id="an-years" value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="e.g. 3" inputMode="numeric" autoComplete="off" className="w-28" />
          <p className="text-xs text-muted-foreground">Sets the big number, “{yearsOk ? n : 3} {n === 1 ? "Year" : "Years"} Of Work Anniversary” and the message.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="an-name">Name</Label>
              <Counter value={name} max={ANNIVERSARY.name.maxChars} />
            </div>
            <Input id="an-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Olivia Symss" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="an-designation">Designation</Label>
              <Counter value={designation} max={ANNIVERSARY.designation.maxChars} />
            </div>
            <Input id="an-designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Manager - Human Resources" autoComplete="off" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Photo</Label>
          <PhotoDropzone compact={!!photo} label={photo ? "Replace photo" : undefined} onFile={onUpload} />
          <p className="text-xs text-muted-foreground">Upload any portrait — the background is removed for you, right here in the browser. Then drag it in the preview to position.</p>
          {removeError && <p className="text-xs text-warning">{removeError}</p>}
          {cutout && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="mr-1 text-muted-foreground">Background</span>
              {[
                { on: true, label: "Removed" },
                { on: false, label: "Original" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={useCutout === o.on}
                  onClick={() => setUseCutout(o.on)}
                  className={cn("h-7 rounded-full border px-2.5 transition-colors", useCutout === o.on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          {photo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <label htmlFor="an-size" className="w-8 shrink-0">Size</label>
              <Minus className="size-3" />
              <input id="an-size" type="range" min={1} max={3} step={0.01} value={photoT.zoom} onChange={(e) => setPhotoT((t) => photoRect(photo, { ...t, zoom: Number(e.target.value) }).clamped)} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
              <Plus className="size-3" />
              <button type="button" onClick={() => setPhotoT(IDENTITY_TRANSFORM)} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">Reset</button>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={generate} disabled={!ready || busy}>
            <Download /> {busy ? "Generating…" : result ? "Download again" : ANNIVERSARY.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {ANNIVERSARY.width}×{ANNIVERSARY.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${ANNIVERSARY.width} / ${ANNIVERSARY.height}` }}>
          <canvas
            ref={canvasRef}
            className={cn("block h-full w-full touch-none", photo && "cursor-grab active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!photo) return;
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current || !photo) return;
              const k = ANNIVERSARY.width / e.currentTarget.getBoundingClientRect().width;
              const dx = (e.clientX - drag.current.x) * k;
              const dy = (e.clientY - drag.current.y) * k;
              setPhotoT((t) => photoRect(photo, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
          {(!background || !fontReady) && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Drag the photo to position it · final size {ANNIVERSARY.width}×{ANNIVERSARY.height}</p>
      </div>

      {removing !== false && <BgRemovalOverlay progress={removing} onCancel={cancelRemoval} />}
    </div>
  );
}
