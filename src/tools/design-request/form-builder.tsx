"use client";

/**
 * Form builder — managers only. Create a custom form, pick the request types it's for, add
 * and arrange its questions, and see it as the requester will. Forms are saved in forms.ts;
 * the request form shows a form's questions as a "Details" step for those request types.
 */
import { useState } from "react";
import {
  AlignLeft, ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronDown, CircleDot, Copy, FileUp, Hash, Heading, Link2, ListChecks, Plus, Save, Trash2, Type, X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CATEGORIES, REQUEST_TYPES, typeById } from "./catalog";
import { CustomFields } from "./custom-fields";
import { deleteForm, FIELD_KINDS, hasOptions, newId, saveForm, useForms, type Answer, type CustomForm, type FieldKind, type FormField } from "./forms";
import { fmtDay } from "./rules";
import { Switch } from "./settings-panel";

const KIND_ICON: Record<FieldKind, LucideIcon> = {
  short: Type,
  long: AlignLeft,
  number: Hash,
  date: Calendar,
  select: ChevronDown,
  choice: ListChecks,
  checkbox: CheckSquare,
  link: Link2,
  file: FileUp,
  heading: Heading,
};

const blankForm = (): CustomForm => ({ id: newId(), name: "Untitled form", description: "", typeIds: [], fields: [], updated: "" });

const blankField = (kind: FieldKind): FormField => ({
  id: newId(),
  kind,
  label: kind === "heading" ? "New section" : "",
  help: "",
  required: false,
  options: hasOptions(kind) ? ["Option 1", "Option 2"] : [],
});

/** What stops a form from being saved, or an empty list. */
function problems(f: CustomForm): string[] {
  const out: string[] = [];
  if (!f.name.trim()) out.push("Give the form a name.");
  if (!f.fields.some((x) => x.kind !== "heading")) out.push("Add at least one question.");
  f.fields.forEach((x, i) => {
    if (!x.label.trim()) out.push(`Question ${i + 1} needs a label.`);
    if (hasOptions(x.kind) && x.options.filter((o) => o.trim()).length < 2) out.push(`“${x.label || `Question ${i + 1}`}” needs at least two options.`);
  });
  return out;
}

function FieldCard({ field, index, count, onChange, onMove, onCopy, onDelete }: { field: FormField; index: number; count: number; onChange: (p: Partial<FormField>) => void; onMove: (d: -1 | 1) => void; onCopy: () => void; onDelete: () => void }) {
  const Icon = KIND_ICON[field.kind];
  const heading = field.kind === "heading";
  return (
    <li className={cn("space-y-3 rounded-xl border bg-card p-4", heading && "bg-secondary/40")}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <Select
          value={field.kind}
          onChange={(e) => {
            const kind = e.target.value as FieldKind;
            onChange({ kind, options: hasOptions(kind) && !field.options.length ? ["Option 1", "Option 2"] : field.options, required: kind === "heading" ? false : field.required });
          }}
          className="h-8 w-44 text-sm"
          aria-label={`Question ${index + 1} type`}
        >
          {Object.entries(FIELD_KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <span className="ml-auto" />
        <Button variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Duplicate question" onClick={onCopy}>
          <Copy />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete question" onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>
      <Input value={field.label} onChange={(e) => onChange({ label: e.target.value })} placeholder={heading ? "Section heading" : "Question, e.g. Headline"} aria-label={`Question ${index + 1} label`} className="text-base" />
      {!heading && (
        <>
          <Input value={field.help} onChange={(e) => onChange({ help: e.target.value })} placeholder="Help text (optional)" aria-label={`Question ${index + 1} help text`} className="text-sm" />
          {hasOptions(field.kind) && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{field.kind === "select" ? "Dropdown options — the requester picks one" : "Options — the requester can pick several"}</p>
              {field.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  {field.kind === "select" ? <CircleDot className="size-4 text-muted-foreground" /> : <CheckSquare className="size-4 text-muted-foreground" />}
                  <Input value={o} onChange={(e) => onChange({ options: field.options.map((x, j) => (j === i ? e.target.value : x)) })} className="h-8" aria-label={`Option ${i + 1}`} />
                  <Button variant="ghost" size="icon" aria-label={`Remove option ${i + 1}`} onClick={() => onChange({ options: field.options.filter((_, j) => j !== i) })}>
                    <X />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => onChange({ options: [...field.options, `Option ${field.options.length + 1}`] })}>
                <Plus /> Add option
              </Button>
            </div>
          )}
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <Switch on={field.required} label="Required" onChange={(required) => onChange({ required })} /> Required
          </label>
        </>
      )}
    </li>
  );
}

export function FormBuilder({ onClose }: { onClose: () => void }) {
  const saved = useForms();
  const [selId, setSelId] = useState<string | null>(saved[0]?.id ?? null);
  const [draft, setDraft] = useState<CustomForm | null>(saved[0] ? structuredClone(saved[0]) : null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<null | { go: () => void }>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, Answer>>({});
  const [openCats, setOpenCats] = useState<string[]>(["agents"]);

  const isNew = !!draft && !saved.some((x) => x.id === draft.id);
  const set = (p: Partial<CustomForm>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
    setErrors([]);
    setFlash(null);
  };
  const setFields = (fields: FormField[]) => set({ fields });

  /** Leave the current form, asking first if it has unsaved changes. */
  const leave = (go: () => void) => (dirty ? setPending({ go }) : go());
  const open = (f: CustomForm) =>
    leave(() => {
      setSelId(f.id);
      setDraft(structuredClone(f));
      setDirty(false);
      setErrors([]);
      setConfirmDelete(false);
      setPreview({});
      setFlash(null);
    });
  const create = () =>
    leave(() => {
      const f = blankForm();
      setSelId(f.id);
      setDraft(f);
      setDirty(true);
      setErrors([]);
      setConfirmDelete(false);
      setPreview({});
      setFlash(null);
    });

  const save = () => {
    if (!draft) return;
    const p = problems(draft);
    if (p.length) return setErrors(p);
    const clean = { ...draft, fields: draft.fields.map((x) => ({ ...x, options: hasOptions(x.kind) ? x.options.filter((o) => o.trim()) : [] })) };
    saveForm(clean);
    setDraft(clean);
    setDirty(false);
    setFlash(`Saved. ${clean.typeIds.length ? `Requesters see it for ${clean.typeIds.length} request type${clean.typeIds.length === 1 ? "" : "s"}.` : "It isn’t used for any request type yet."}`);
  };

  const remove = () => {
    if (!draft) return;
    if (!isNew) deleteForm(draft.id);
    const rest = saved.filter((x) => x.id !== draft.id);
    setSelId(rest[0]?.id ?? null);
    setDraft(rest[0] ? structuredClone(rest[0]) : null);
    setDirty(false);
    setConfirmDelete(false);
    setFlash(null);
  };

  const duplicate = () =>
    draft &&
    leave(() => {
      const copy: CustomForm = { ...structuredClone(draft), id: newId(), name: `${draft.name} (copy)`, typeIds: [], updated: "" };
      setSelId(copy.id);
      setDraft(copy);
      setDirty(true);
      setFlash(null);
    });

  const owner = (typeId: string) => saved.find((x) => x.id !== draft?.id && x.typeIds.includes(typeId));
  const list = isNew && draft ? [...saved, draft] : saved;

  return (
    <div role="dialog" aria-label="Form builder" className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-3.5">
        <div>
          <h2 className="text-lg font-normal">Form builder</h2>
          <p className="text-sm text-muted-foreground">A custom form adds a “Details” step to the request form for the request types you pick.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={() => leave(onClose)}>
          <X />
        </Button>
      </header>

      {pending && (
        <div className="flex flex-wrap items-center gap-3 border-b border-warning/40 bg-warning/10 px-6 py-2.5 text-sm">
          <span className="flex-1">This form has changes that aren’t saved.</span>
          <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
            Keep editing
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const go = pending.go;
              setPending(null);
              setDirty(false);
              go();
            }}
          >
            Discard changes
          </Button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_420px]">
        <aside className="space-y-2 overflow-y-auto border-b p-4 md:border-r md:border-b-0">
          <Button className="w-full" onClick={create}>
            <Plus /> New form
          </Button>
          <ul className="space-y-1.5 pt-2">
            {list.map((f) => {
              const live = f.id === draft?.id ? draft : f;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => f.id !== selId && open(f)}
                    className={cn("w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60", f.id === selId ? "border-navy-2 bg-card shadow-sm dark:border-paper/60" : "border-transparent")}
                  >
                    <span className="block truncate">{live.name || "Untitled form"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {live.fields.filter((x) => x.kind !== "heading").length} questions ·{" "}
                      {live.typeIds.length ? `${live.typeIds.length} request type${live.typeIds.length === 1 ? "" : "s"}` : <span className="text-warning">not used yet</span>}
                      {f.id === draft?.id && (isNew ? " · new" : dirty ? " · edited" : "")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!list.length && <p className="px-1 pt-4 text-sm text-muted-foreground">No forms yet. Start one with New form.</p>}
        </aside>

        {draft ? (
          <>
            <section className="flex min-h-0 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <div className="space-y-3">
                  <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} aria-label="Form name" placeholder="Form name" className="h-11 text-lg" />
                  <Input value={draft.description} onChange={(e) => set({ description: e.target.value })} aria-label="Form description" placeholder="One line for the requester: what this form is for (optional)" />
                  {!isNew && draft.updated && <p className="text-xs text-muted-foreground">Last saved {fmtDay(draft.updated)}</p>}
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-normal">Used for</h3>
                    <p className="text-sm text-muted-foreground">The request types that show this form. Each request type can use one form; picking a type that’s on another form moves it here when you save.</p>
                  </div>
                  <div className="divide-y rounded-xl border">
                    {CATEGORIES.map((c) => {
                      const types = REQUEST_TYPES[c.id];
                      const picked = types.filter((t) => draft.typeIds.includes(t.id)).length;
                      const isOpen = openCats.includes(c.id);
                      return (
                        <div key={c.id}>
                          <button
                            type="button"
                            onClick={() => setOpenCats((o) => (isOpen ? o.filter((x) => x !== c.id) : [...o, c.id]))}
                            aria-expanded={isOpen}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-secondary/40"
                          >
                            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
                            <span className="flex-1">{c.label}</span>
                            {picked > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground tabular-nums">{picked}</span>}
                          </button>
                          {isOpen && (
                            <ul className="space-y-1.5 px-4 pb-3 pl-10">
                              {types.map((t) => {
                                const on = draft.typeIds.includes(t.id);
                                const other = owner(t.id);
                                return (
                                  <li key={t.id}>
                                    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={() => set({ typeIds: on ? draft.typeIds.filter((x) => x !== t.id) : [...draft.typeIds, t.id] })}
                                        className="mt-0.5 size-4 shrink-0 accent-navy-2"
                                      />
                                      <span>
                                        {t.label}
                                        {other && <span className="block text-xs text-muted-foreground">{on ? `Moves here from “${other.name}” when you save` : `Uses “${other.name}”`}</span>}
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-normal">Questions</h3>
                    <p className="text-sm text-muted-foreground">Asked in this order. The standard questions (brief, formats, copy, approvals, deadline, terms) are always asked too.</p>
                  </div>
                  <ol className="space-y-3">
                    {draft.fields.map((f, i) => (
                      <FieldCard
                        key={f.id}
                        field={f}
                        index={i}
                        count={draft.fields.length}
                        onChange={(p) => setFields(draft.fields.map((x) => (x.id === f.id ? { ...x, ...p } : x)))}
                        onMove={(d) => {
                          const next = [...draft.fields];
                          [next[i], next[i + d]] = [next[i + d], next[i]];
                          setFields(next);
                        }}
                        onCopy={() => {
                          const next = [...draft.fields];
                          next.splice(i + 1, 0, { ...f, id: newId(), label: `${f.label} (copy)` });
                          setFields(next);
                        }}
                        onDelete={() => setFields(draft.fields.filter((x) => x.id !== f.id))}
                      />
                    ))}
                  </ol>
                  <div className="rounded-xl border border-dashed p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Add a question</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {(Object.keys(FIELD_KINDS) as FieldKind[]).map((k) => {
                        const Icon = KIND_ICON[k];
                        return (
                          <button key={k} type="button" onClick={() => setFields([...draft.fields, blankField(k)])} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs hover:bg-secondary">
                            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                            {FIELD_KINDS[k]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {errors.length > 0 && (
                <ul className="list-disc space-y-0.5 border-t border-destructive/30 bg-destructive/10 py-2.5 pr-6 pl-10 text-sm text-destructive">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              <footer className="flex flex-wrap items-center gap-2 border-t bg-card px-6 py-3">
                {confirmDelete ? (
                  <>
                    <span className="text-sm text-destructive">
                      Delete “{draft.name}”? {draft.typeIds.length ? "Those request types go back to the standard questions. " : ""}Requests already sent keep their answers.
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </Button>
                    <Button variant="destructive" size="sm" onClick={remove}>
                      <Trash2 /> Delete form
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                      <Trash2 /> Delete
                    </Button>
                    {!isNew && (
                      <Button variant="ghost" onClick={duplicate}>
                        <Copy /> Duplicate
                      </Button>
                    )}
                    {flash && <span className="text-sm text-success">{flash}</span>}
                    <span className="ml-auto" />
                    {dirty && !isNew && (
                      <Button variant="secondary" onClick={() => open(saved.find((x) => x.id === draft.id)!)}>
                        Discard changes
                      </Button>
                    )}
                    <Button onClick={save} disabled={!dirty}>
                      <Save /> Save form
                    </Button>
                  </>
                )}
              </footer>
            </section>

            <aside className="hidden min-h-0 flex-col border-l bg-secondary/30 xl:flex">
              <p className="kicker border-b px-5 py-3 text-[10px] text-muted-foreground">Preview · what the requester sees</p>
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div className="rounded-xl bg-card p-4 text-sm shadow-sm">
                  <p className="font-normal">{draft.name || "Untitled form"}</p>
                  {draft.description && <p className="mt-0.5 text-muted-foreground">{draft.description}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {draft.typeIds.length ? `Shown for: ${draft.typeIds.map((t) => typeById(t)?.label).filter(Boolean).join(" · ")}` : "Not shown to anyone yet — pick a request type under Used for."}
                  </p>
                </div>
                <div className="rounded-xl bg-card p-4 shadow-sm">
                  <CustomFields fields={draft.fields} answers={preview} onChange={(id, a) => setPreview((p) => ({ ...p, [id]: a }))} />
                </div>
              </div>
            </aside>
          </>
        ) : (
          <div className="grid place-items-center p-10 text-center text-sm text-muted-foreground xl:col-span-2">
            <div className="space-y-3">
              <p>No custom forms yet.</p>
              <Button onClick={create}>
                <Plus /> New form
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
