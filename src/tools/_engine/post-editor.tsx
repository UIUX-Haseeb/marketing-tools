"use client";

/**
 * Single-post editor: fields → live preview → download.
 * Used by the Birthday "Create New" form, the per-employee "Adjust" dialog, and the Baby tool.
 */
import { useCallback, useMemo, useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logGeneratedPost } from "@/lib/actions/posts";
import { unsupportedCharacters } from "./font";
import { clampTransform, IDENTITY_TRANSFORM, type Drawable, type PhotoTransform } from "./render";
import { usesJobTitle, usesPhoto, type PostTemplate } from "./templates";
import { downloadBlob, exportPost, formatBytes, safeFileName, type ExportResult } from "./export";
import { toDrawable, usePostAssets } from "./use-post";
import { Counter, PhotoControls, PhotoDropzone, PostPreview } from "./ui";

export type PostState = {
  name: string;
  jobTitle: string;
  photo: Drawable | null;
  transform: PhotoTransform;
};

export function PostEditor({
  tool,
  template,
  initial,
  source = "manual",
  employeeId,
  onApply,
  onExported,
  lockText,
}: {
  tool: string;
  template: PostTemplate;
  initial?: Partial<PostState>;
  source?: "manual" | "portal";
  employeeId?: string;
  /** When provided, an "Apply" button returns the edited state to the caller (used by the Adjust dialog). */
  onApply?: (state: PostState) => void;
  onExported?: (result: ExportResult) => void;
  /** Hide the text fields when the caller renders them elsewhere. */
  lockText?: boolean;
}) {
  const { artwork, ready, fontError } = usePostAssets(template);
  const [name, setName] = useState(initial?.name ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [photo, setPhoto] = useState<Drawable | null>(initial?.photo ?? null);
  const [transform, setTransform] = useState<PhotoTransform>(initial?.transform ?? IDENTITY_TRANSFORM);
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<{ key: string; result: ExportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsPhoto = usesPhoto(template);
  const needsTitle = usesJobTitle(template);
  const nameSlot = template.slots.name;
  const titleSlot = template.slots.jobTitle;

  const badName = useMemo(() => unsupportedCharacters(name), [name]);
  const badTitle = useMemo(() => unsupportedCharacters(jobTitle), [jobTitle]);

  const problems: string[] = [];
  if (!name.trim()) problems.push("Add the name.");
  if (name.length > nameSlot.maxChars) problems.push(`The name is over ${nameSlot.maxChars} characters.`);
  if (badName.length) problems.push(`The font can't draw: ${badName.join(" ")}`);
  if (needsTitle) {
    if (!jobTitle.trim()) problems.push("Add the designation.");
    if (titleSlot && jobTitle.length > titleSlot.maxChars) problems.push(`The designation is over ${titleSlot.maxChars} characters.`);
    if (badTitle.length) problems.push(`The font can't draw: ${badTitle.join(" ")}`);
  }
  if (needsPhoto && !photo) problems.push("Upload a photo.");
  const canGenerate = ready && problems.length === 0 && !busy;

  // The last export is only "current" while nothing has changed since.
  const stateKey = `${name}|${jobTitle}|${photo ? "p" : "-"}|${transform.zoom}|${transform.offsetX}|${transform.offsetY}`;
  const result = exported?.key === stateKey ? exported.result : null;

  const patchTransform = useCallback(
    (patch: Partial<PhotoTransform> | ((t: PhotoTransform) => Partial<PhotoTransform>)) => {
      setTransform((t) => {
        const next = { ...t, ...(typeof patch === "function" ? patch(t) : patch) };
        return photo ? clampTransform(template, photo, next) : next;
      });
    },
    [photo, template],
  );

  async function onPhotoFile(file: File) {
    try {
      const img = await toDrawable(file);
      setPhoto(img);
      setTransform(IDENTITY_TRANSFORM);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function generate() {
    if (!artwork) return;
    setBusy(true);
    setError(null);
    try {
      const out = await exportPost({ template, templateImage: artwork, photo, transform, name, jobTitle });
      setExported({ key: stateKey, result: out });
      downloadBlob(out.blob, safeFileName(template, name, out.extension));
      onExported?.(out);
      void logGeneratedPost({ tool, templateId: template.id, subject: name.trim(), source, employeeId, format: out.extension, bytes: out.bytes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-6">
        {!lockText && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="post-name">{needsTitle ? "Employee name" : "Name"}</Label>
                <Counter value={name} max={nameSlot.maxChars} />
              </div>
              <Input id="post-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fatima Al Zahra" autoComplete="off" />
              <p className="text-xs text-muted-foreground">Shown exactly as typed.</p>
            </div>
            {needsTitle && titleSlot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-title">Designation</Label>
                  <Counter value={jobTitle} max={titleSlot.maxChars} />
                </div>
                <Input id="post-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Property Consultant" autoComplete="off" />
                <p className="text-xs text-muted-foreground">Set in capitals automatically.</p>
              </div>
            )}
          </>
        )}

        {needsPhoto && (
          <div className="space-y-3">
            <Label>Photo</Label>
            <PhotoDropzone onFile={onPhotoFile} compact={!!photo} label={photo ? "Replace photo" : undefined} />
            {photo && <PhotoControls transform={transform} onChange={patchTransform} onReset={() => setTransform(IDENTITY_TRANSFORM)} />}
          </div>
        )}

        <div className="space-y-3 border-t pt-5">
          {fontError && <p className="text-sm text-destructive">{fontError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!fontError && problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={generate} disabled={!canGenerate}>
              <Download /> {busy ? "Generating…" : result ? "Download again" : template.ctaLabel}
            </Button>
            {onApply && (
              <Button type="button" variant="outline" onClick={() => onApply({ name, jobTitle, photo, transform })}>
                <Check /> Apply
              </Button>
            )}
          </div>
          {result && (
            <p className="text-xs text-muted-foreground">
              Saved as {result.format.toUpperCase()} · {formatBytes(result.bytes)} · {template.width}×{template.height}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <PostPreview
          template={template}
          artwork={artwork}
          photo={photo}
          transform={transform}
          name={name}
          jobTitle={jobTitle}
          onDrag={(dx, dy) => patchTransform((t) => ({ offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }))}
          className="mx-auto max-h-[70vh]"
        />
        <p className="text-center text-xs text-muted-foreground">Preview updates as you type · final size {template.width}×{template.height}</p>
      </div>
    </div>
  );
}
