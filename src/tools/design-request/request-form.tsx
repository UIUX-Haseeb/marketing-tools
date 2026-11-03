"use client";

/**
 * New request / edit a returned request — the portal's ticket dialog ("Tell us what's wrong")
 * stretched over six steps: Request, Format, Content, Approvals, Timing, Terms. Errors show for
 * a step once you've tried to leave it; Send checks every step and jumps to the first problem.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Briefcase, Building2, Check as CheckIcon, Clock, Monitor, ShoppingCart, Undo2, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORIES, FORMATS, LANGUAGES, REQUEST_TYPES, typeById, USAGES } from "./catalog";
import { BRIEF_MIN, earliestDeadline, fmtDay, isLowRes, needs, STEPS, stepErrors, validate, type StepId } from "./rules";
import { blankDraft, sampleDraft } from "./seed";
import { submitRequest } from "./store";
import { Terms } from "./terms";
import type { Category, DesignRequest, Requester, RequestDraft } from "./types";
import { Check, ChoiceCard, Chips, DropZone, Field, Modal } from "./ui";

const CATEGORY_ICON: Record<Category, ReactNode> = {
  agents: <Briefcase />,
  hr: <Users />,
  procurement: <ShoppingCart />,
  it: <Monitor />,
  other: <Building2 />,
};

const defaultCategory = (dept: string): Category | "" => ({ Sales: "agents", HR: "hr", Operations: "other", Finance: "other" })[dept] as Category | "" ?? "";

function TypeSelect({ category, value, onChange, error }: { category: Category | ""; value: string; onChange: (v: string) => void; error?: boolean }) {
  const types = category ? REQUEST_TYPES[category] : [];
  const groups = [...new Set(types.map((t) => t.group ?? ""))];
  return (
    <Select id="typeId" value={value} disabled={!category} onChange={(e) => onChange(e.target.value)} className={cn(!value && "text-muted-foreground", error && "border-destructive")}>
      <option value="">{category ? "Pick a request type" : "Pick who it's for first"}</option>
      {groups.map((g) =>
        g ? (
          <optgroup key={g} label={g}>
            {types.filter((t) => t.group === g).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </optgroup>
        ) : (
          types.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))
        ),
      )}
    </Select>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <p className="kicker text-muted-foreground">{title}</p>
      {children}
    </section>
  );
}

export function RequestForm({ requester, initial, onClose, onSent }: { requester: Requester; initial?: DesignRequest; onClose: () => void; onSent: (r: DesignRequest) => void }) {
  const [d, setD] = useState<RequestDraft>(() => (initial ? { ...initial, readTerms: false, proofread: false, approvalsAttached: false } : { ...blankDraft(), category: defaultCategory(requester.department) }));
  const [department, setDepartment] = useState(initial?.requester.department ?? requester.department);
  const [step, setStep] = useState<StepId>("request");
  const [tried, setTried] = useState<Set<StepId>>(new Set());
  const body = useRef<HTMLDivElement>(null);

  const set = (p: Partial<RequestDraft>) => setD((x) => ({ ...x, ...p }));
  const all = useMemo(() => validate(d), [d]);
  const shown = (k: string) => {
    const s = STEPS.find((x) => stepErrors(all, x.id).includes(k));
    return s && tried.has(s.id) ? all[k] : undefined;
  };
  const n = needs(d);
  const type = typeById(d.typeId);
  const min = earliestDeadline(d.typeId);
  const idx = STEPS.findIndex((s) => s.id === step);

  const goTo = (s: StepId) => {
    setStep(s);
    body.current?.scrollTo({ top: 0 });
  };
  const next = () => {
    setTried((t) => new Set(t).add(step));
    if (stepErrors(all, step).length) return;
    goTo(STEPS[idx + 1].id);
  };
  const send = useCallback(() => {
    setTried(new Set(STEPS.map((s) => s.id)));
    const bad = STEPS.find((s) => stepErrors(all, s.id).length);
    if (bad) return goTo(bad.id);
    onSent(submitRequest(d, { ...requester, department }, initial?.id));
  }, [all, d, department, initial?.id, onSent, requester]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && send();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [send]);

  const returnNote = initial?.history.findLast((h) => h.action.startsWith("Returned"))?.note;
  const lowRes = d.assets.filter(isLowRes).length;

  return (
    <Modal label={initial ? "Edit and resubmit" : "Request a design"} onClose={onClose} className="h-[min(860px,calc(100vh-4rem))] max-w-[680px]">
      <header className="space-y-4 px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h2">{initial ? `Edit and resubmit ${initial.ref}` : "Request a design"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">⌘↵ to send · Esc to cancel</p>
          </div>
          {!initial && (
            <button type="button" onClick={() => setD({ ...sampleDraft() })} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Fill with a sample
            </button>
          )}
        </div>
        <nav aria-label="Steps" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none]">
          {STEPS.map((s, i) => {
            const bad = tried.has(s.id) && stepErrors(all, s.id).length > 0;
            const ok = tried.has(s.id) && !bad;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={s.id === step ? "step" : undefined}
                className={cn("-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 pb-2.5 text-sm text-muted-foreground hover:text-foreground", s.id === step && "border-foreground text-foreground")}
              >
                <span className={cn("flex size-5 items-center justify-center rounded-full border text-[11px] tabular-nums", ok && "border-success bg-success text-white", bad && "border-destructive bg-destructive text-white")}>
                  {ok ? <CheckIcon className="size-3" /> : bad ? "!" : i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div ref={body} className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {step === "request" && (
          <>
            {returnNote && (
              <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                <Undo2 className="mt-0.5 size-4 shrink-0 text-warning" />
                <div>
                  <p className="font-normal">Marketing sent this back</p>
                  <p className="mt-1 text-muted-foreground">{returnNote}</p>
                </div>
              </div>
            )}
            <div className="grid gap-4 rounded-xl bg-secondary/60 p-4 text-sm sm:grid-cols-[1fr_1fr_12rem] sm:items-end">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="mt-1 truncate">{requester.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 truncate">{requester.email}</p>
              </div>
              <Field label="Department" htmlFor="department">
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-card" />
              </Field>
            </div>
            <Field label="Who is it for?" required error={shown("category")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <ChoiceCard key={c.id} selected={d.category === c.id} onClick={() => set({ category: c.id, typeId: d.category === c.id ? d.typeId : "" })} icon={CATEGORY_ICON[c.id]} title={c.label} help={c.help} />
                ))}
              </div>
            </Field>
            <Field
              label="Request type"
              htmlFor="typeId"
              required
              error={shown("typeId")}
              help={min && `Lead time: ${min.days} working days (${min.label}). ${type?.permit ? "Needs the permit number and QR code." : ""}`}
            >
              <TypeSelect category={d.category} value={d.typeId} onChange={(typeId) => set({ typeId })} error={!!shown("typeId")} />
            </Field>
            <Field label="What should we call this?" htmlFor="title" required error={shown("title")}>
              <Input id="title" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Just Listed — 2BR in Marina Gate 1" className={cn(shown("title") && "border-destructive")} />
            </Field>
            <Field
              label="Brief"
              htmlFor="brief"
              required
              error={shown("brief")}
              help={`One request covers one design. For a set (three unit types, a post and a story) list each one clearly. ${d.brief.trim().length}/${BRIEF_MIN} characters minimum.`}
            >
              <Textarea id="brief" rows={5} value={d.brief} onChange={(e) => set({ brief: e.target.value })} placeholder="What it's for, who it's for, what it must show…" className={cn(shown("brief") && "border-destructive")} />
            </Field>
          </>
        )}

        {step === "format" && (
          <>
            <Field label="Formats and sizes" required error={shown("formats")} help="We only deliver what's selected here.">
              <Chips id="formats" options={FORMATS} value={d.formats} onChange={(formats) => set({ formats })} />
            </Field>
            {n.custom && (
              <Field label="Custom size" htmlFor="customSize" required error={shown("customSize")}>
                <Input id="customSize" value={d.customSize} onChange={(e) => set({ customSize: e.target.value })} placeholder="e.g. 1200 × 628 px, or 3 × 2 m" />
              </Field>
            )}
            <Field label="Where will it be used?" required error={shown("usages")}>
              <Chips id="usages" options={USAGES} value={d.usages} onChange={(usages) => set({ usages })} />
            </Field>
            {n.print && (
              <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:items-end">
                <Field label="Print quantity" htmlFor="printQuantity" required error={shown("printQuantity")}>
                  <Input id="printQuantity" type="number" min={1} value={d.printQuantity} onChange={(e) => set({ printQuantity: e.target.value })} placeholder="e.g. 250" />
                </Field>
                <div className="pb-2">
                  <Check id="bleed" checked={d.bleed} onChange={(bleed) => set({ bleed })}>
                    Bleed required (the printer asked for it)
                  </Check>
                </div>
              </div>
            )}
            <Field label="Language" required error={shown("language")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {LANGUAGES.map((l) => (
                  <ChoiceCard key={l} selected={d.language === l} onClick={() => set({ language: l })} title={l === "Both" ? "English and Arabic" : l} />
                ))}
              </div>
            </Field>
            <Field label="Do you need the editable source files?" required error={shown("sourceFiles")}>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard selected={d.sourceFiles === "no"} onClick={() => set({ sourceFiles: "no" })} title="No" help="Final files only (PNG, JPG, PDF)." />
                <ChoiceCard selected={d.sourceFiles === "yes"} onClick={() => set({ sourceFiles: "yes" })} title="Yes" help="Editable files too — only delivered if ticked here." />
              </div>
            </Field>
          </>
        )}

        {step === "content" && (
          <>
            <Field label="Final copy" htmlFor="copy" required error={shown("copy")} help="Final, approved text — we lay it out, we don't write or rewrite it. Type it here or attach it.">
              <Textarea id="copy" rows={5} value={d.copy} onChange={(e) => set({ copy: e.target.value })} placeholder="Headline, details, prices, contact — exactly as it should read" className={cn(shown("copy") && "border-destructive")} />
            </Field>
            <DropZone id="copyFiles" compact files={d.copyFiles} onChange={(copyFiles) => set({ copyFiles })} hint="Or attach the copy (Word, PDF, text)." />
            <Field label="Assets" required error={shown("assets")} help="High-resolution photos, logos, renders, floor plans. Photos from WhatsApp or social media are usually too small for print.">
              <DropZone id="assets" checkRes files={d.assets} onChange={(assets) => set({ assets })} hint="Photos, logos, renders, floor plans — anything we need to use." error={!!shown("assets")} />
            </Field>
            {lowRes > 0 && (
              <p className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="size-3.5" />
                {lowRes === 1 ? "One picture is" : `${lowRes} pictures are`} low resolution. Fine for a small post, but it will look soft in print or on a big screen.
              </p>
            )}
            <Field label="…or a Drive link" htmlFor="assetsLink">
              <Input id="assetsLink" value={d.assetsLink} onChange={(e) => set({ assetsLink: e.target.value })} placeholder="https://drive.google.com/…" />
            </Field>
            <Field label="Reference or inspiration" htmlFor="reference" help="Optional. We adapt the idea to our brand, we don't copy another company's design.">
              <Input id="reference" value={d.reference} onChange={(e) => set({ reference: e.target.value })} placeholder="A link to a post or design you like" />
            </Field>
            <DropZone id="referenceFiles" compact files={d.referenceFiles} onChange={(referenceFiles) => set({ referenceFiles })} hint="Or attach screenshots." />
          </>
        )}

        {step === "approvals" && (
          <>
            <Section title="About this design">
              <div className="space-y-3">
                <Check id="developerMaterial" checked={n.developer} onChange={(developerMaterial) => !type?.developer && set({ developerMaterial })}>
                  It uses developer, partner or co-brand material (logos, renders, project names)
                  {type?.developer && <span className="text-muted-foreground"> — always, for this request type</span>}
                </Check>
                <Check id="aboutPerson" checked={n.person} onChange={(aboutPerson) => !type?.person && set({ aboutPerson })}>
                  It’s an announcement about a person (promotion, anniversary, new joiner, condolences)
                  {type?.person && <span className="text-muted-foreground"> — always, for this request type</span>}
                </Check>
                <Check id="peopleShown" checked={d.peopleShown} onChange={(peopleShown) => set({ peopleShown, peopleAgreed: peopleShown && d.peopleAgreed })}>
                  People appear or are named in the design
                </Check>
              </div>
            </Section>

            {n.permit && (
              <Section title="Permit">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Permit number" htmlFor="permitNumber" required error={shown("permitNumber")} help="Property and project ads can't be finalised without it.">
                    <Input id="permitNumber" value={d.permitNumber} onChange={(e) => set({ permitNumber: e.target.value })} placeholder="e.g. 7114992033" className={cn(shown("permitNumber") && "border-destructive")} />
                  </Field>
                  <Field label="Permit QR code" required error={shown("permitQr")}>
                    <DropZone id="permitQr" compact accept="image/*,.pdf" files={d.permitQr} onChange={(permitQr) => set({ permitQr })} error={!!shown("permitQr")} />
                  </Field>
                </div>
              </Section>
            )}
            {n.developer && (
              <Field label="Developer approval" required error={shown("developerApproval")} help="The developer's written approval, arranged before you submit.">
                <DropZone id="developerApproval" compact files={d.developerApproval} onChange={(developerApproval) => set({ developerApproval })} error={!!shown("developerApproval")} />
              </Field>
            )}
            {n.person && (
              <Field label="HR or department head approval" required error={shown("personApproval")}>
                <DropZone id="personApproval" compact files={d.personApproval} onChange={(personApproval) => set({ personApproval })} error={!!shown("personApproval")} />
              </Field>
            )}
            {n.people && (
              <div className="space-y-2">
                <Check id="peopleAgreed" checked={d.peopleAgreed} onChange={(peopleAgreed) => set({ peopleAgreed })}>
                  Everyone shown or named knows and has agreed — owners, tenants, clients and staff*
                </Check>
                {shown("peopleAgreed") && <p className="text-xs text-destructive">{shown("peopleAgreed")}</p>}
              </div>
            )}
            {!n.permit && !n.developer && !n.person && !n.people && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing else is needed for this request.</p>}
          </>
        )}

        {step === "timing" && (
          <>
            <Field
              label="Deadline"
              htmlFor="deadline"
              required
              error={shown("deadline")}
              help={min ? `A ${min.label} needs ${min.days} working days, so the earliest date is ${fmtDay(min.date)}. Weekends (Sat, Sun) don't count.` : "Pick a request type first to see its lead time."}
            >
              <Input id="deadline" type="date" min={min?.date} value={d.deadline} onChange={(e) => set({ deadline: e.target.value })} className={cn("w-48", shown("deadline") && "border-destructive")} />
            </Field>
            <Field label="How urgent is it?">
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard selected={!d.urgent} onClick={() => set({ urgent: false })} icon={<Clock />} title="Normal" help="First come, first served." />
                <ChoiceCard selected={d.urgent} onClick={() => set({ urgent: true })} icon={<Zap />} title="Urgent" help="Goes to the Marketing Director for approval." />
              </div>
            </Field>
            {d.urgent && (
              <Field label="Why is it urgent?" htmlFor="urgentReason" required error={shown("urgentReason")}>
                <Textarea id="urgentReason" rows={3} value={d.urgentReason} onChange={(e) => set({ urgentReason: e.target.value })} placeholder="e.g. The launch moved forward to Thursday" />
              </Field>
            )}
          </>
        )}

        {step === "terms" && (
          <>
            <div className="max-h-[42vh] overflow-y-auto rounded-xl border bg-background p-5">
              <Terms />
            </div>
            <div className="space-y-3">
              <Check id="readTerms" checked={d.readTerms} onChange={(readTerms) => set({ readTerms })}>
                I’ve read the terms and conditions
              </Check>
              <Check id="proofread" checked={d.proofread} onChange={(proofread) => set({ proofread })}>
                The copy is proofread and accurate — names, prices, figures, dates and spelling
              </Check>
              <Check id="approvalsAttached" checked={d.approvalsAttached} onChange={(approvalsAttached) => set({ approvalsAttached })}>
                The required approvals are attached
              </Check>
              {shown("terms") && <p className="text-xs text-destructive">{shown("terms")}</p>}
            </div>
          </>
        )}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button variant="secondary" onClick={onClose} className="mr-auto">
          Cancel
        </Button>
        {idx > 0 && (
          <Button variant="outline" onClick={() => goTo(STEPS[idx - 1].id)}>
            Back
          </Button>
        )}
        {step === "terms" ? <Button onClick={send}>{initial ? "Resubmit" : "Send it"}</Button> : <Button onClick={next}>Next</Button>}
      </footer>
    </Modal>
  );
}
