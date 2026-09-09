"use client";

/**
 * Welcome Aboard (onboarding) post. Pick the new joiner from the employee list (name, designation and
 * photo prefilled, all editable) or type them in; position the photo; download.
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
import { photoRect, renderOnboarding } from "./render";
import { ONBOARDING } from "./template";

const TOOL = "onboarding";
const MANUAL = "__manual__";

export function OnboardingTool() {
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [bottomFade, setBottomFade] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(ONBOARDING.assets.background).then((img) => alive && setBackground(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    loadImage(ONBOARDING.assets.bottomFade).then((img) => alive && setBottomFade(img)).catch(() => {});
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
  const [photo, setPhoto] = useState<Drawable | null>(null);
  const [photoT, setPhotoT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoReq = useRef(0);
  function selectEmployee(id: string) {
    setEmployeeId(id);
    const e = EMPLOYEES.find((x) => x.id === id);
    if (!e) return;
    setName(e.fullName);
    setTitle(e.designation);
    setPhotoT(IDENTITY_TRANSFORM);
    const req = ++photoReq.current;
    if (e.photoUrl) toDrawable(e.photoUrl).then((img) => req === photoReq.current && setPhoto(img)).catch(() => {});
    else setPhoto(null);
  }

  const bad = useMemo(() => [...unsupportedCharacters(name), ...unsupportedCharacters(title)], [name, title]);
  const problems: string[] = [];
  if (!photo) problems.push("Upload the new joiner's photo.");
  if (!name.trim()) problems.push("Add the name.");
  if (name.length > ONBOARDING.name.maxChars) problems.push(`The name is over ${ONBOARDING.name.maxChars} characters.`);
  if (!title.trim()) problems.push("Add the designation.");
  if (title.length > ONBOARDING.title.maxChars) problems.push(`The designation is over ${ONBOARDING.title.maxChars} characters.`);
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const ready = !!background && fontReady && problems.length === 0;

  const input = useMemo(
    () => (background ? { background, bottomFade, photo, photoTransform: photoT, name, title, showPlaceholders: true } : null),
    [background, bottomFade, photo, photoT, name, title],
  );
  const stateKey = JSON.stringify([!!photo, photoT, name, title]);
  const result = exported?.key === stateKey ? exported.result : null;

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / ONBOARDING.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(ONBOARDING.width * scale * dpr);
      const h = Math.round(ONBOARDING.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderOnboarding(ctx, input, scale * dpr);
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
      canvas.width = ONBOARDING.width;
      canvas.height = ONBOARDING.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderOnboarding(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(ONBOARDING, name, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: ONBOARDING.id, subject: name.trim(), source: employeeId === MANUAL ? "manual" : "demo", employeeId: employeeId === MANUAL ? undefined : employeeId, format: out.extension, bytes: out.bytes });
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
          <Label htmlFor="ob-employee">New joiner</Label>
          <Select id="ob-employee" value={employeeId} onChange={(e) => selectEmployee(e.target.value)}>
            <option value={MANUAL}>Type details manually…</option>
            {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Picking someone prefills the fields below — edit anything.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ob-name">Name</Label>
              <Counter value={name} max={ONBOARDING.name.maxChars} />
            </div>
            <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stephen James O'Brien" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ob-title">Designation</Label>
              <Counter value={title} max={ONBOARDING.title.maxChars} />
            </div>
            <Input id="ob-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Recruiter" autoComplete="off" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Photo</Label>
          <PhotoDropzone
            compact={!!photo}
            label={photo ? "Replace photo" : undefined}
            onFile={async (f) => {
              try {
                setPhoto(await toDrawable(f));
                setPhotoT(IDENTITY_TRANSFORM);
                setError(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">A portrait with the background removed (transparent PNG) sits on the design like the reference. Drag it in the preview to position.</p>
          {photo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <label htmlFor="ob-size" className="w-8 shrink-0">Size</label>
              <Minus className="size-3" />
              <input id="ob-size" type="range" min={1} max={3} step={0.01} value={photoT.zoom} onChange={(e) => setPhotoT((t) => photoRect(photo, { ...t, zoom: Number(e.target.value) }).clamped)} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
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
            <Download /> {busy ? "Generating…" : result ? "Download again" : ONBOARDING.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {ONBOARDING.width}×{ONBOARDING.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${ONBOARDING.width} / ${ONBOARDING.height}` }}>
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
              const k = ONBOARDING.width / e.currentTarget.getBoundingClientRect().width;
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
        <p className="text-center text-xs text-muted-foreground">Drag the photo to position it · final size {ONBOARDING.width}×{ONBOARDING.height}</p>
      </div>
    </div>
  );
}
