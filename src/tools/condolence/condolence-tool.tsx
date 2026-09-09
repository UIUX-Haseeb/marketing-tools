"use client";

/**
 * Condolence post. Two choices (who has passed away, he/she) + the colleague's name compose the
 * wording. A read-before-you-download gate shows the exact sentences before the file is enabled —
 * a native "are you sure?" can't show the wording, and this post may reach a grieving family.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { logGeneratedPost } from "@/lib/store";
import { ensurePostFont, isPostFontReady, unsupportedCharacters } from "@/tools/_shared/font";
import { loadImage } from "@/tools/_shared/render";
import { downloadBlob, encodeCanvas, formatBytes, safeFileName, type ExportResult } from "@/tools/_shared/export";
import { Counter, Modal } from "@/tools/_shared/ui";
import { COLLEAGUE_GENDERS, composeCondolence, getGender, getRelation, RELATIONS, type GenderId, type RelationId } from "./compose";
import { renderCondolence } from "./render";
import { CONDOLENCE } from "./template";

const TOOL = "condolence";

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

export function CondolenceTool() {
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(CONDOLENCE.src).then((img) => alive && setArtwork(img)).catch(() => alive && setFontError("Could not load the design artwork."));
    ensurePostFont().then((r) => {
      if (!alive) return;
      setFontReady(r.ok);
      if (!r.ok) setFontError(r.error ?? "Font failed to load.");
    });
    return () => {
      alive = false;
    };
  }, []);

  const [relationId, setRelationId] = useState<RelationId>("mother");
  const [gender, setGender] = useState<GenderId>("male");
  const [name, setName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const text = useMemo(() => composeCondolence({ relationId, colleagueGender: gender, colleagueName: name }), [relationId, gender, name]);
  const bad = useMemo(() => unsupportedCharacters(name), [name]);
  const stateKey = `${relationId}|${gender}|${name.trim()}`;
  const confirmed = confirmedKey === stateKey;
  const result = exported?.key === stateKey ? exported.result : null;

  const problems: string[] = [];
  if (!name.trim()) problems.push("Add your colleague's name.");
  if (name.length > CONDOLENCE.nameMaxChars) problems.push(`The name is over ${CONDOLENCE.nameMaxChars} characters.`);
  if (bad.length) problems.push(`The font can't draw: ${bad.join(" ")}`);
  const ready = !!artwork && fontReady && problems.length === 0;

  // Live preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !artwork || !fontReady) return;
    const frame = requestAnimationFrame(() => {
      const scale = Math.min(1, 1080 / CONDOLENCE.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(CONDOLENCE.width * scale * dpr);
      const h = Math.round(CONDOLENCE.height * scale * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) renderCondolence(ctx, { artwork, ...text }, scale * dpr);
    });
    return () => cancelAnimationFrame(frame);
  }, [artwork, fontReady, text]);

  async function generate() {
    if (!artwork || !isPostFontReady()) return setError("The locked brand font is not loaded. Please reload the page.");
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CONDOLENCE.width;
      canvas.height = CONDOLENCE.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      renderCondolence(ctx, { artwork, ...text }, 1);
      const out = await encodeCanvas(canvas);
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(CONDOLENCE, name, out.extension));
      logGeneratedPost({ tool: TOOL, templateId: CONDOLENCE.id, subject: name.trim(), source: "manual", format: out.extension, bytes: out.bytes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const relation = getRelation(relationId);
  const g = getGender(gender);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        <Choices label="Who has passed away" options={RELATIONS} value={relationId} onChange={setRelationId} />
        <Choices label="Your colleague is" options={COLLEAGUE_GENDERS} value={gender} onChange={setGender} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="c-name">Your colleague&apos;s name</Label>
            <Counter value={name} max={CONDOLENCE.nameMaxChars} />
          </div>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fatima Al Zahra" autoComplete="off" />
          <p className="text-xs text-muted-foreground">Full name as it should appear. The first name is used again in the closing line.</p>
        </div>

        <div className="space-y-3 border-t pt-5">
          <p className="text-sm text-muted-foreground">Check the preview before you download — this post carries a person&apos;s name and family.</p>
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <div className="flex flex-wrap gap-2">
            {!confirmed ? (
              <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!ready}>
                <Eye /> Review &amp; continue
              </Button>
            ) : (
              <Button type="button" onClick={generate} disabled={!ready || busy}>
                <Download /> {busy ? "Generating…" : result ? "Download again" : CONDOLENCE.ctaLabel}
              </Button>
            )}
          </div>
          {result && <p className="text-xs text-muted-foreground">Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {CONDOLENCE.width}×{CONDOLENCE.height}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-xl border bg-navy" style={{ aspectRatio: `${CONDOLENCE.width} / ${CONDOLENCE.height}` }}>
          <canvas ref={canvasRef} className="block h-full w-full" />
          {(!artwork || !fontReady) && !fontError && <div className="absolute inset-0 flex items-center justify-center text-sm text-paper/70">Loading design…</div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Preview updates as you type · final size {CONDOLENCE.width}×{CONDOLENCE.height}</p>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Ready to download?">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Please check the post once more. Is <span className="text-foreground">{text.name.replace(/\.$/, "")}</span> spelled right, and is it{" "}
            <span className="text-foreground">{relation.label}</span> / <span className="text-foreground">{g.label.toLowerCase()}</span>?
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Let me check</Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmedKey(stateKey);
                setConfirmOpen(false);
              }}
            >
              Yes, it&apos;s correct
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
