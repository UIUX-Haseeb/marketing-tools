"use client";

/**
 * Promotion post. Pick the colleague from the employee list (name + photo prefilled, all editable) or
 * type them in; enter the NEW designation; position the photo; download.
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
import { photoRect, renderPromotion } from "./render";
import { PROMOTION } from "./template";

const TOOL = "promotion";
const MANUAL = "__manual__";

export function PromotionTool() {
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<HTMLImageElement | null>(null);
  const [wordmark, setWordmark] = useState<HTMLImageElement | null>(null);
  const [script, setScript] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(PROMOTION.assets.background).then((img) => alive && setBackground(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    loadImage(PROMOTION.assets.frame).then((img) => alive && setFrame(img)).catch(() => {});
    loadImage(PROMOTION.assets.wordmark).then((img) => alive && setWordmark(img)).catch(() => {});
    loadImage(PROMOTION.assets.script).then((img) => alive && setScript(img)).catch(() => {});
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
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
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

  const bad = useMemo(() => [...unsupportedCharacters(name), ...unsupportedCharacters(title)], [name, title]);
  const problems: string[] = [];
  if (!photo) problems.push("Upload your colleague's photo.");
  if (!name.trim()) problems.push("Add the name.");
  if (name.length > PROMOTION.name.maxChars) problems.push(`The name is over ${PROMOTION.name.maxChars} characters.`);
  if (!title.trim()) problems.push("Add the new designation.");
  if (title.length > PROMOTION.promo.maxChars) problems.push(`The designation is over ${PROMOTION.promo.maxChars} characters.`);
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const ready = !!background && fontReady && problems.length === 0;

  const input = useMemo(
    () => (background ? { background, frame, wordmark, script, photo, photoTransform: photoT, name, title, showPlaceholders: true } : null),
    [background, frame, wordmark, script, photo, photoT, name, title],
  );
  const stateKey = JSON.stringify([!!photo, useCutout && !!cutout, photoT, name, title]);
  const result = exported?.key === stateKey ? exported.result : null;

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / PROMOTION.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(PROMOTION.width * scale * dpr);
      const h = Math.round(PROMOTION.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderPromotion(ctx, input, scale * dpr);
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
      canvas.width = PROMOTION.width;
      canvas.height = PROMOTION.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderPromotion(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(PROMOTION, name, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: PROMOTION.id, subject: name.trim(), source: employeeId === MANUAL ? "manual" : "demo", employeeId: employeeId === MANUAL ? undefined : employeeId, format: out.extension, bytes: out.bytes });
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
          <Label htmlFor="pr-employee">Colleague</Label>
          <Select id="pr-employee" value={employeeId} onChange={(e) => selectEmployee(e.target.value)}>
            <option value={MANUAL}>Type details manually…</option>
            {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Picking someone prefills the name and photo — the new designation is yours to type.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pr-name">Name</Label>
              <Counter value={name} max={PROMOTION.name.maxChars} />
            </div>
            <Input id="pr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adeeb Trabulsi" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pr-title">New designation</Label>
              <Counter value={title} max={PROMOTION.promo.maxChars} />
            </div>
            <Input id="pr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chief Technology Officer" autoComplete="off" />
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
              <label htmlFor="pr-size" className="w-8 shrink-0">Size</label>
              <Minus className="size-3" />
              <input id="pr-size" type="range" min={1} max={3} step={0.01} value={photoT.zoom} onChange={(e) => setPhotoT((t) => photoRect(photo, { ...t, zoom: Number(e.target.value) }).clamped)} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
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
            <Download /> {busy ? "Generating…" : result ? "Download again" : PROMOTION.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {PROMOTION.width}×{PROMOTION.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${PROMOTION.width} / ${PROMOTION.height}` }}>
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
              const k = PROMOTION.width / e.currentTarget.getBoundingClientRect().width;
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
        <p className="text-center text-xs text-muted-foreground">Drag the photo to position it · final size {PROMOTION.width}×{PROMOTION.height}</p>
      </div>

      {removing !== false && <BgRemovalOverlay progress={removing} onCancel={cancelRemoval} />}
    </div>
  );
}
