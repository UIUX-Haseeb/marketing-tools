"use client";

/**
 * Just Sold / Just Listed editor. Property photo + listing line + price + agent (from the
 * employee list, editable) + optional QR. Renders with renderListing(); exports via encodeCanvas().
 */
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
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
import { Counter, PhotoControls, PhotoDropzone } from "@/tools/_engine/ui";

const MANUAL = "__manual__";

function useQr(text: string) {
  const value = text.trim();
  const [made, setMade] = useState<{ value: string; canvas: HTMLCanvasElement } | null>(null);
  useEffect(() => {
    if (!value) return;
    let alive = true;
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, value, { margin: 0, width: 648, errorCorrectionLevel: "M", color: { dark: "#1A2942", light: "#FFFFFF" } })
      .then(() => alive && setMade({ value, canvas }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);
  return value && made?.value === value ? made.canvas : null;
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
  const [qrText, setQrText] = useState("");
  const [target, setTarget] = useState<"photo" | "headshot">("photo");
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qr = useQr(qrText);

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
  // Load the default agent's headshot once.
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

  // Drag in preview moves the active target.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const nudge = (dx: number, dy: number) => {
    if (target === "photo" && photo) setPhotoT((t) => coverRect(photo, PHOTO_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
    if (target === "headshot" && headshot) setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }).clamped);
  };
  const patch = (p: Partial<PhotoTransform>) => {
    if (target === "photo" && photo) setPhotoT((t) => coverRect(photo, PHOTO_BOX, { ...t, ...p }).clamped);
    if (target === "headshot" && headshot) setHeadshotT((t) => coverRect(headshot, HEADSHOT_BOX, { ...t, ...p }).clamped);
  };

  const problems: string[] = [];
  if (!photo) problems.push("Upload the property photo.");
  if (!listing.trim()) problems.push("Add the listing line.");
  if (!price.trim()) problems.push("Add the price.");
  if (!agentName.trim()) problems.push("Add the agent name.");
  if (!headshot) problems.push("Add the agent headshot.");
  const canGenerate = fontReady && problems.length === 0 && !busy;

  const stateKey = JSON.stringify([variant, !!photo, photoT, listing, price, agentName, agentTitle, !!headshot, headshotT, qrText]);
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

  const activeT = target === "photo" ? photoT : headshotT;
  const activeHas = target === "photo" ? !!photo : !!headshot;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        {/* Property */}
        <div className="space-y-3">
          <Label>Property photo</Label>
          <PhotoDropzone
            compact={!!photo}
            label={photo ? "Replace photo" : undefined}
            onFile={async (f) => {
              try {
                setPhoto(await toDrawable(f));
                setPhotoT(IDENTITY_TRANSFORM);
                setTarget("photo");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
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
            <p className="text-xs text-muted-foreground">Prefilled from the employee list — edit anything below.</p>
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
          <PhotoDropzone
            compact
            label={headshot ? "Replace headshot" : "Add headshot"}
            onFile={async (f) => {
              try {
                setHeadshot(await toDrawable(f));
                setHeadshotT(IDENTITY_TRANSFORM);
                setTarget("headshot");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </div>

        {/* QR */}
        <div className="space-y-2 border-t pt-5">
          <Label htmlFor="qr">QR code link <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="qr" value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="https://… listing page, WhatsApp or profile link" inputMode="url" />
          <p className="text-xs text-muted-foreground">Leave empty to hide the QR tile.</p>
        </div>

        {/* Position */}
        <div className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between">
            <Label>Position</Label>
            <div className="flex rounded-lg border p-0.5 text-xs">
              {(["photo", "headshot"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTarget(t)} className={cn("rounded-md px-2.5 py-1 capitalize", target === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <PhotoControls
            transform={activeT}
            disabled={!activeHas}
            onChange={patch}
            onReset={() => (target === "photo" ? setPhotoT(IDENTITY_TRANSFORM) : setHeadshotT(IDENTITY_TRANSFORM))}
          />
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
            className={cn("block h-full w-full touch-none", activeHas && "cursor-grab active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!activeHas) return;
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const k = LISTING.width / e.currentTarget.getBoundingClientRect().width;
              nudge((e.clientX - drag.current.x) * k, (e.clientY - drag.current.y) * k);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
          {!fontReady && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Drag to reposition the {target} · final size {LISTING.width}×{LISTING.height}</p>
      </div>
    </div>
  );
}
