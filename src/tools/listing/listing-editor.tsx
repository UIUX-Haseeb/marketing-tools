"use client";

/**
 * Just Sold / Just Listed editor. Property photo + listing line + price + agent (from the
 * employee list, editable) + the agent's DLD QR image. Renders with renderListing(); exports via encodeCanvas().
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
import { ensurePostFont, isPostFontReady } from "@/tools/_engine/font";
import { IDENTITY_TRANSFORM, type Drawable, type PhotoTransform } from "@/tools/_engine/render";
import { coverRect, HEADLINES, HEADSHOT_BOX, LISTING, LISTING_LIMITS, PHOTO_BOX, renderListing, type ListingVariant } from "@/tools/_engine/listing";
import { downloadBlob, encodeCanvas, formatBytes, type ExportResult } from "@/tools/_engine/export";
import { toDrawable } from "@/tools/_engine/use-post";
import { Counter, PhotoDropzone } from "@/tools/_engine/ui";

const MANUAL = "__manual__";

/** One-line size control shown right under an upload. */
function SizeRow({ id, transform, onZoom, onReset, disabled }: { id: string; transform: PhotoTransform; onZoom: (z: number) => void; onReset: () => void; disabled?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", disabled && "opacity-50")}>
      <label htmlFor={id} className="w-8 shrink-0">Size</label>
      <Minus className="size-3" />
      <input id={id} type="range" min={1} max={3} step={0.01} value={transform.zoom} disabled={disabled} onChange={(e) => onZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-navy" />
      <Plus className="size-3" />
      <button type="button" onClick={onReset} disabled={disabled} className="ml-1 underline-offset-4 hover:text-foreground hover:underline">Reset</button>
    </div>
  );
}

export function ListingEditor({ variant, tool }: { variant: ListingVariant; tool: string }) {
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    ensurePostFont().then((r) => {
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
  }, []);

  const [photo, setPhoto] = useState<Drawable | null>(null);
  const [photoT, setPhotoT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [listing, setListing] = useState("");
  const [price, setPrice] = useState("");
  const [agentId, setAgentId] = useState<string>(EMPLOYEES[0]?.id ?? MANUAL);
  const [agentName, setAgentName] = useState(EMPLOYEES[0]?.fullName ?? "");
  const [agentTitle, setAgentTitle] = useState(EMPLOYEES[0]?.designation ?? "");
  const [headshot, setHeadshot] = useState<Drawable | null>(null);
  const [headshotT, setHeadshotT] = useState<PhotoTransform>(IDENTITY_TRANSFORM);
  const [qr, setQr] = useState<Drawable | null>(null);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Agent picked from the list → prefill name, designation, headshot (all editable afterwards).
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
    () => ({ variant, photo, photoTransform: photoT, listing, price, agentName, agentTitle, headshot, headshotTransform: headshotT, qr, showPlaceholders: true }),
    [variant, photo, photoT, listing, price, agentName, agentTitle, headshot, headshotT, qr],
  );

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / LISTING.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(LISTING.width * scale * dpr);
      const h = Math.round(LISTING.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderListing(ctx, input, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [input, fontReady]);

  // Drag in the preview: inside the headshot circle moves the headshot, anywhere else moves the property photo.
  const drag = useRef<{ x: number; y: number; target: "photo" | "headshot" } | null>(null);
  function hitTarget(e: React.PointerEvent<HTMLCanvasElement>): "photo" | "headshot" {
    const r = e.currentTarget.getBoundingClientRect();
    const k = LISTING.width / r.width;
    const x = (e.clientX - r.left) * k;
    const y = (e.clientY - r.top) * k;
    const h = LISTING.headshot;
    return headshot && Math.hypot(x - h.cx, y - h.cy) <= h.r ? "headshot" : "photo";
  }
  function moveBy(target: "photo" | "headshot", dx: number, dy: number) {
    if (target === "photo" && photo) setPhotoT((t) => coverRect(photo, PHOTO_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
    if (target === "headshot" && headshot) setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
  }

  const problems: string[] = [];
  if (!photo) problems.push("Upload the property photo.");
  if (!listing.trim()) problems.push("Add the listing line.");
  if (!price.trim()) problems.push("Add the price.");
  if (!agentName.trim()) problems.push("Add the agent name.");
  if (!headshot) problems.push("Add the agent headshot.");
  const canGenerate = fontReady && problems.length === 0 && !busy;

  const stateKey = JSON.stringify([variant, !!photo, photoT, listing, price, agentName, agentTitle, !!headshot, headshotT, !!qr]);
  const result = exported?.key === stateKey ? exported.result : null;

  async function generate() {
    if (!isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = LISTING.width;
      canvas.height = LISTING.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderListing(ctx, { ...input, showPlaceholders: false }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      const slug = listing.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      downloadBlob(out.blob, `${HEADLINES[variant].replace(" ", "-")}${slug ? `-${slug}` : ""}.${out.extension}`);
      logGeneratedPost({ tool, templateId: `provident-${variant}`, subject: listing.trim() || agentName.trim(), source: agentId === MANUAL ? "manual" : "demo", employeeId: agentId === MANUAL ? undefined : agentId, format: out.extension, bytes: out.bytes });
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
        {/* Property */}
        <div className="space-y-2">
          <Label>Property photo</Label>
          <PhotoDropzone compact={!!photo} label={photo ? "Replace photo" : undefined} onFile={load(setPhoto, () => setPhotoT(IDENTITY_TRANSFORM))} />
          {photo && <SizeRow id="photo-size" transform={photoT} onZoom={(z) => setPhotoT((t) => coverRect(photo, PHOTO_BOX, { ...t, zoom: z }).clamped)} onReset={() => setPhotoT(IDENTITY_TRANSFORM)} />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="listing">Listing line</Label>
            <Counter value={listing} max={LISTING_LIMITS.listing} />
          </div>
          <Input id="listing" value={listing} onChange={(e) => setListing(e.target.value)} placeholder="e.g. Stunning beach view villa in Palm Jumeirah" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="price">Price</Label>
            <Counter value={price} max={LISTING_LIMITS.price} />
          </div>
          <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. AED 12 Million" />
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
                <Counter value={agentName} max={LISTING_LIMITS.agentName} />
              </div>
              <Input id="agentName" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentTitle">Designation</Label>
                <Counter value={agentTitle} max={LISTING_LIMITS.agentTitle} />
              </div>
              <Input id="agentTitle" value={agentTitle} onChange={(e) => setAgentTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <PhotoDropzone compact label={headshot ? "Replace headshot" : "Add headshot"} onFile={load(setHeadshot, () => setHeadshotT(IDENTITY_TRANSFORM))} />
            {headshot && <SizeRow id="headshot-size" transform={headshotT} onZoom={(z) => setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, zoom: z }).clamped)} onReset={() => setHeadshotT(IDENTITY_TRANSFORM)} />}
          </div>
        </div>

        {/* QR */}
        <div className="space-y-2 border-t pt-5">
          <Label>DLD QR code <span className="text-muted-foreground">(optional)</span></Label>
          <PhotoDropzone compact label={qr ? "Replace QR image" : "Upload your permit QR image"} onFile={load(setQr)} />
          <p className="text-xs text-muted-foreground">The QR from your Dubai Land Department permit. Leave empty to hide the tile.</p>
        </div>

        {/* Generate */}
        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <Button type="button" onClick={generate} disabled={!canGenerate}>
            <Download /> {busy ? "Generating…" : result ? "Download again" : `Generate ${HEADLINES[variant]} Post`}
          </Button>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {LISTING.width}×{LISTING.height}</p>}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${LISTING.width} / ${LISTING.height}` }}>
          <canvas
            ref={canvasRef}
            className={cn("block h-full w-full touch-none", (photo || headshot) && "cursor-grab active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!photo && !headshot) return;
              drag.current = { x: e.clientX, y: e.clientY, target: hitTarget(e) };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const k = LISTING.width / e.currentTarget.getBoundingClientRect().width;
              moveBy(drag.current.target, (e.clientX - drag.current.x) * k, (e.clientY - drag.current.y) * k);
              drag.current = { ...drag.current, x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
          {!fontReady && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Drag the photo to move it · drag inside the circle to move the headshot</p>
      </div>
    </div>
  );
}
