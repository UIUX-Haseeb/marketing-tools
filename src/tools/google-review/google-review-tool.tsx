"use client";

/**
 * Google Review post. Star rating + the review quote + reviewer name, then the agent
 * (from the employee list, editable, with a headshot you can zoom/drag). Renders with
 * renderReview(); exports via encodeCanvas() — same shape as listing/listing-editor.tsx.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Minus, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { logGeneratedPost } from "@/lib/store";
import { EMPLOYEES } from "@/lib/demo/employees";
import { ensurePostFont, isPostFontReady, unsupportedCharacters } from "@/tools/_shared/font";
import { IDENTITY_TRANSFORM, type Drawable, type PhotoTransform } from "@/tools/_shared/render";
import { downloadBlob, encodeCanvas, formatBytes, safeFileName, type ExportResult } from "@/tools/_shared/export";
import { toDrawable } from "@/tools/_shared/use-post";
import { Counter, PhotoDropzone } from "@/tools/_shared/ui";
import { coverRect, HEADSHOT_BOX, REVIEW, REVIEW_LIMITS, renderReview } from "./review";

const MANUAL = "__manual__";

/** One-line size control shown right under an upload. */
function SizeRow({ id, transform, onZoom, onReset }: { id: string; transform: PhotoTransform; onZoom: (z: number) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <label htmlFor={id} className="w-8 shrink-0">Size</label>
      <Minus className="size-3" />
      <input id={id} type="range" min={1} max={3} step={0.01} value={transform.zoom} onChange={(e) => onZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
      <Plus className="size-3" />
      <button type="button" onClick={onReset} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">Reset</button>
    </div>
  );
}

/** Click a star to set the rating (1–5). */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
      {Array.from({ length: REVIEW.stars.max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star className={cn("size-6 transition-colors", n <= value ? "fill-[#B0905C] text-[#B0905C]" : "text-muted-foreground")} />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">{value} of {REVIEW.stars.max}</span>
    </div>
  );
}

export function GoogleReviewTool() {
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    toDrawable(REVIEW.src).then((img) => alive && setArtwork(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    ensurePostFont().then((r) => {
      if (!alive) return;
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
    return () => {
      alive = false;
    };
  }, []);

  const [stars, setStars] = useState(5);
  const [quote, setQuote] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [agentId, setAgentId] = useState<string>(EMPLOYEES[0]?.id ?? MANUAL);
  const [agentName, setAgentName] = useState(EMPLOYEES[0]?.fullName ?? "");
  const [agentTitle, setAgentTitle] = useState(EMPLOYEES[0]?.designation ?? "");
  const [headshot, setHeadshot] = useState<Drawable | null>(null);
  const [headshotT, setHeadshotT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headshotReq = useRef(0);
  function selectAgent(id: string) {
    setAgentId(id);
    const e = EMPLOYEES.find((x) => x.id === id);
    if (!e) return;
    setAgentName(e.fullName);
    setAgentTitle(e.designation);
    setHeadshotT(IDENTITY_TRANSFORM);
    const req = ++headshotReq.current;
    if (e.photoUrl) toDrawable(e.photoUrl).then((img) => req === headshotReq.current && setHeadshot(img)).catch(() => {});
    else setHeadshot(null);
  }
  useEffect(() => {
    const e = EMPLOYEES[0];
    if (!e?.photoUrl) return;
    let alive = true;
    toDrawable(e.photoUrl).then((img) => alive && headshotReq.current === 0 && setHeadshot(img)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const input = useMemo(
    () => (artwork ? { artwork, stars, quote, reviewerName, agentName, agentTitle, headshot, headshotTransform: headshotT, showPlaceholders: true } : null),
    [artwork, stars, quote, reviewerName, agentName, agentTitle, headshot, headshotT],
  );

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / REVIEW.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(REVIEW.width * scale * dpr);
      const h = Math.round(REVIEW.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderReview(ctx, input, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [input, fontReady]);

  // Drag inside the headshot circle to move it.
  const drag = useRef<{ x: number; y: number } | null>(null);
  function inHeadshot(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const k = REVIEW.width / r.width;
    const x = (e.clientX - r.left) * k;
    const y = (e.clientY - r.top) * k;
    const h = REVIEW.headshot;
    return Math.hypot(x - h.cx, y - h.cy) <= h.r;
  }

  // Newlines are a structural paragraph break (see review.ts's layoutQuote) — never drawn as a glyph, so they don't count as "unsupported".
  const bad = useMemo(() => [...unsupportedCharacters(quote.replace(/\n/g, " ")), ...unsupportedCharacters(reviewerName), ...unsupportedCharacters(agentName), ...unsupportedCharacters(agentTitle)], [quote, reviewerName, agentName, agentTitle]);
  const problems: string[] = [];
  if (!quote.trim()) problems.push("Add the review text.");
  if (!reviewerName.trim()) problems.push("Add the reviewer's name.");
  if (!agentName.trim()) problems.push("Add the agent's name.");
  if (!headshot) problems.push("Add the agent's headshot.");
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const canGenerate = fontReady && !!artwork && problems.length === 0 && !busy;

  const stateKey = JSON.stringify([stars, quote, reviewerName, agentName, agentTitle, !!headshot, headshotT]);
  const result = exported?.key === stateKey ? exported.result : null;

  async function generate() {
    if (!isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    if (!input) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = REVIEW.width;
      canvas.height = REVIEW.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderReview(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(REVIEW, reviewerName, out.extension));
      logGeneratedPost({ tool: "google-review", templateId: REVIEW.id, subject: reviewerName.trim() || agentName.trim(), source: agentId === MANUAL ? "manual" : "demo", employeeId: agentId === MANUAL ? undefined : agentId, format: out.extension, bytes: out.bytes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Rating</Label>
          <StarPicker value={stars} onChange={setStars} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quote">Review</Label>
            <Counter value={quote} max={REVIEW_LIMITS.quote} />
          </div>
          <Textarea id="quote" rows={5} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Paste or type the review. A blank line between paragraphs keeps them separate." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="reviewerName">Reviewer&apos;s name</Label>
            <Counter value={reviewerName} max={REVIEW_LIMITS.reviewerName} />
          </div>
          <Input id="reviewerName" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="e.g. Ewa B." autoComplete="off" />
        </div>

        {/* Agent */}
        <div className="space-y-3 border-t pt-5">
          <div className="space-y-2">
            <Label htmlFor="agent">Agent</Label>
            <Select id="agent" value={agentId} onChange={(e) => selectAgent(e.target.value)}>
              {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              <option value={MANUAL}>Type manually…</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentName">Name</Label>
                <Counter value={agentName} max={REVIEW_LIMITS.agentName} />
              </div>
              <Input id="agentName" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentTitle">Designation</Label>
                <Counter value={agentTitle} max={REVIEW_LIMITS.agentTitle} />
              </div>
              <Input id="agentTitle" value={agentTitle} onChange={(e) => setAgentTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <PhotoDropzone compact label={headshot ? "Replace headshot" : "Add headshot"} onFile={load(setHeadshot, () => setHeadshotT(IDENTITY_TRANSFORM))} />
            {headshot && <SizeRow id="headshot-size" transform={headshotT} onZoom={(z) => setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, zoom: z }).clamped)} onReset={() => setHeadshotT(IDENTITY_TRANSFORM)} />}
          </div>
        </div>

        {/* Generate */}
        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={generate} disabled={!canGenerate}>
            <Download /> {busy ? "Generating…" : result ? "Download again" : REVIEW.ctaLabel}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {REVIEW.width}×{REVIEW.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${REVIEW.width} / ${REVIEW.height}` }}>
          <canvas
            ref={canvasRef}
            className={cn("block h-full w-full touch-none", headshot && "cursor-grab active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!headshot || !inHeadshot(e)) return;
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current || !headshot) return;
              const k = REVIEW.width / e.currentTarget.getBoundingClientRect().width;
              const dx = (e.clientX - drag.current.x) * k;
              const dy = (e.clientY - drag.current.y) * k;
              setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
          {(!artwork || !fontReady) && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Drag inside the circle to move the headshot · final size {REVIEW.width}×{REVIEW.height}</p>
      </div>
    </div>
  );
}
