"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, ArrowLeft, Archive, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logGeneratedPost } from "@/lib/store";
import { listEmployees } from "@/lib/demo/employees";
import { birthDay, birthMonth, type Employee } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { BIRTHDAY } from "@/tools/_engine/templates";
import { IDENTITY_TRANSFORM, type Drawable, type PhotoTransform } from "@/tools/_engine/render";
import { exportPost, safeFileName, downloadBlob, formatBytes } from "@/tools/_engine/export";
import { makeZip, zipSafeName } from "@/tools/_engine/zip";
import { toDrawable, usePostAssets } from "@/tools/_engine/use-post";
import { PostEditor, type PostState } from "@/tools/_engine/post-editor";
import { Modal, PhotoDropzone, PostPreview } from "@/tools/_engine/ui";

const TOOL = "birthday";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Card = {
  employee: Employee;
  name: string;
  jobTitle: string;
  photo: Drawable | null;
  photoState: "loading" | "ready" | "missing" | "failed";
  transform: PhotoTransform;
};

export function BirthdayTool() {
  const [mode, setMode] = useState<"month" | "manual">("month");

  return (
    <div className="space-y-6">
      {mode === "month" ? (
        <MonthView onCreateNew={() => setMode("manual")} />
      ) : (
        <div className="space-y-6">
          <button type="button" onClick={() => setMode("month")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to birthdays by month
          </button>
          <PostEditor tool={TOOL} template={BIRTHDAY} source="manual" />
        </div>
      )}
    </div>
  );
}

/* ── Month view ──────────────────────────────────────────────────────────── */

function MonthView({ onCreateNew }: { onCreateNew: () => void }) {
  const { artwork, ready, fontError } = usePostAssets(BIRTHDAY);
  const [months, setMonths] = useState<number[]>([new Date().getMonth() + 1]);
  const [cards, setCards] = useState<Card[]>([]);
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const monthsKey = months.join(",");
  const loading = fetchedKey !== monthsKey;

  const update = (id: string, patch: Partial<Card>) =>
    setCards((cur) => cur.map((c) => (c.employee.id === id ? { ...c, ...patch } : c)));
  const [editing, setEditing] = useState<string | null>(null);
  const [zipping, setZipping] = useState<{ done: number; total: number } | null>(null);

  const toggleMonth = (m: number) =>
    setMonths((cur) => {
      const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      return next.length ? next.sort((a, b) => a - b) : cur;
    });

  // Load employees for the selected months (demo list — swap listEmployees() for the CRM).
  useEffect(() => {
    let alive = true;
    listEmployees()
      .then((employees) => {
        if (!alive) return;
        setError(null);
        const wanted = new Set(monthsKey.split(",").map(Number));
        const sorted = employees
          .filter((e) => wanted.has(birthMonth(e) ?? -1))
          .sort((a, b) => (birthMonth(a)! - birthMonth(b)!) || (birthDay(a)! - birthDay(b)!));
        setCards((prev) =>
          sorted.map((e) => {
            const keep = prev.find((c) => c.employee.id === e.id);
            return keep ?? { employee: e, name: e.fullName, jobTitle: e.designation, photo: null, photoState: e.photoUrl ? "loading" : "missing", transform: IDENTITY_TRANSFORM };
          }),
        );
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setFetchedKey(monthsKey));
    return () => {
      alive = false;
    };
  }, [monthsKey]);

  // Load photos for cards that still need them.
  useEffect(() => {
    const pending = cards.filter((c) => c.photoState === "loading" && !c.photo);
    if (!pending.length) return;
    let alive = true;
    pending.forEach(async (c) => {
      try {
        const img = await toDrawable(c.employee.photoUrl!);
        if (alive) update(c.employee.id, { photo: img, photoState: "ready" });
      } catch {
        if (alive) update(c.employee.id, { photoState: "failed" });
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.map((c) => c.employee.id + c.photoState).join("|")]);

  const readyCards = useMemo(() => cards.filter((c) => c.photo && c.name.trim() && c.jobTitle.trim()), [cards]);
  const editingCard = cards.find((c) => c.employee.id === editing) ?? null;

  async function downloadOne(c: Card) {
    if (!artwork || !c.photo) return;
    const out = await exportPost({ template: BIRTHDAY, templateImage: artwork, photo: c.photo, transform: c.transform, name: c.name, jobTitle: c.jobTitle });
    downloadBlob(out.blob, safeFileName(BIRTHDAY, c.name, out.extension));
    logGeneratedPost({ tool: TOOL, templateId: BIRTHDAY.id, subject: c.name.trim(), source: "demo", employeeId: c.employee.id, format: out.extension, bytes: out.bytes });
  }

  async function exportAll() {
    if (!artwork || !readyCards.length) return;
    setZipping({ done: 0, total: readyCards.length });
    try {
      const entries: { name: string; data: Uint8Array }[] = [];
      const used = new Set<string>();
      let i = 0;
      for (const c of readyCards) {
        const out = await exportPost({ template: BIRTHDAY, templateImage: artwork, photo: c.photo!, transform: c.transform, name: c.name, jobTitle: c.jobTitle });
        let file = zipSafeName(safeFileName(BIRTHDAY, c.name, out.extension));
        while (used.has(file)) file = file.replace(/(\.\w+)$/, `-${++i}$1`);
        used.add(file);
        entries.push({ name: file, data: new Uint8Array(await out.blob.arrayBuffer()) });
        logGeneratedPost({ tool: TOOL, templateId: BIRTHDAY.id, subject: c.name.trim(), source: "demo", employeeId: c.employee.id, format: out.extension, bytes: out.bytes });
        setZipping({ done: entries.length, total: readyCards.length });
        await new Promise((r) => setTimeout(r, 0));
      }
      const label = months.map((m) => MONTHS_LONG[m - 1]).join("-");
      downloadBlob(makeZip(entries), `Birthday-posts-${label}.zip`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setZipping(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Month picker + actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Birthdays in</p>
          <div className="flex flex-wrap gap-1.5">
            {MONTHS.map((label, i) => {
              const m = i + 1;
              const on = months.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(m)}
                  aria-pressed={on}
                  className={cn(
                    "h-8 rounded-full border px-3 text-sm transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onCreateNew}>
            <Plus /> Create new
          </Button>
          <Button type="button" onClick={exportAll} disabled={!ready || !readyCards.length || !!zipping}>
            <Archive /> {zipping ? `Exporting ${zipping.done}/${zipping.total}…` : `Export all (${readyCards.length})`}
          </Button>
        </div>
      </div>

      <p className="rounded-lg border border-warning/40 bg-warning/8 px-3 py-2 text-xs text-warning">
        Demo employee list — connect the CRM in <code className="font-mono">src/lib/demo/employees.ts</code>.
      </p>
      {fontError && <p className="text-sm text-destructive">{fontError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Cards */}
      {loading && cards.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading employees…</p>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No birthdays in {months.map((m) => MONTHS_LONG[m - 1]).join(", ")}.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => (
            <li key={c.employee.id} className="flex flex-col gap-3 rounded-xl border bg-card p-3">
              <div className="relative">
                <PostPreview template={BIRTHDAY} artwork={artwork} photo={c.photo} transform={c.transform} name={c.name} jobTitle={c.jobTitle} maxPx={560} showPlaceholder />
                {c.photoState === "loading" && <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-0.5 text-[11px] text-muted-foreground">Loading photo…</span>}
                {(c.photoState === "missing" || c.photoState === "failed") && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-paper/90 px-2 py-0.5 text-[11px] text-destructive">
                    <ImageOff className="size-3" /> No photo
                  </span>
                )}
              </div>
              <div className="min-w-0 space-y-0.5 px-1">
                <p className="truncate text-sm font-normal">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {birthDay(c.employee)} {MONTHS_LONG[(birthMonth(c.employee) ?? 1) - 1]}
                </p>
              </div>
              {!c.photo && c.photoState !== "loading" ? (
                <PhotoDropzone
                  compact
                  onFile={async (f) => {
                    try {
                      const img = await toDrawable(f);
                      update(c.employee.id, { photo: img, photoState: "ready", transform: IDENTITY_TRANSFORM });
                    } catch {}
                  }}
                />
              ) : (
                <div className="flex gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setEditing(c.employee.id)} disabled={!c.photo}>
                    <Pencil /> Adjust
                  </Button>
                  <Button type="button" size="sm" className="flex-1" onClick={() => downloadOne(c)} disabled={!ready || !c.photo}>
                    <Download /> Download
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {cards.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {readyCards.length} of {cards.length} ready · exported as PNG (or JPEG when over {formatBytes(1.4 * 1024 * 1024)}) at {BIRTHDAY.width}×{BIRTHDAY.height}
        </p>
      )}

      {/* Adjust dialog */}
      <Modal open={!!editingCard} onClose={() => setEditing(null)} title={editingCard ? `Adjust — ${editingCard.name}` : ""} wide>
        {editingCard && (
          <PostEditor
            key={editingCard.employee.id}
            tool={TOOL}
            template={BIRTHDAY}
            source="demo"
            employeeId={editingCard.employee.id}
            initial={{ name: editingCard.name, jobTitle: editingCard.jobTitle, photo: editingCard.photo, transform: editingCard.transform }}
            onApply={(s: PostState) => {
              update(editingCard.employee.id, { name: s.name, jobTitle: s.jobTitle, photo: s.photo, transform: s.transform, photoState: s.photo ? "ready" : "missing" });
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
