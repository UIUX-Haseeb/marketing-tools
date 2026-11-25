"use client";

/**
 * A custom form's questions, as the requester sees them (the request form's "Details" step and
 * the builder's preview), and the answers as they show in a request's pop-out.
 */
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Answer, FormField } from "./forms";
import { fmtDay } from "./rules";
import type { Attachment } from "./types";
import { Check, Chips, DropZone, Field, FileRow } from "./ui";

export function CustomFields({ fields, answers, onChange, error }: { fields: FormField[]; answers: Record<string, Answer>; onChange: (id: string, a: Answer) => void; error?: (id: string) => string | undefined }) {
  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const id = `cf-${f.id}`;
        const a = answers[f.id];
        const err = error?.(f.id);
        const bad = err ? "border-destructive" : undefined;
        if (f.kind === "heading")
          return (
            <h3 key={f.id} className="kicker border-b pb-1.5 text-muted-foreground">
              {f.label}
            </h3>
          );
        if (f.kind === "checkbox")
          return (
            <div key={f.id} className="space-y-1">
              <Check id={id} checked={a === true} onChange={(v) => onChange(f.id, v)}>
                {f.label}
                {f.required && "*"}
              </Check>
              {err ? <p className="text-xs text-destructive">{err}</p> : f.help && <p className="pl-6.5 text-xs text-muted-foreground">{f.help}</p>}
            </div>
          );
        let input: ReactNode;
        const text = typeof a === "string" ? a : "";
        if (f.kind === "long") input = <Textarea id={id} rows={3} value={text} onChange={(e) => onChange(f.id, e.target.value)} className={bad} />;
        else if (f.kind === "select")
          input = (
            <Select id={id} value={text} onChange={(e) => onChange(f.id, e.target.value)} className={cn("sm:w-80", bad)}>
              <option value="">Pick one…</option>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          );
        else if (f.kind === "choice") input = <Chips id={id} options={f.options} value={Array.isArray(a) ? (a as string[]) : []} onChange={(v) => onChange(f.id, v)} />;
        else if (f.kind === "file") input = <DropZone id={id} compact files={Array.isArray(a) ? (a as Attachment[]) : []} onChange={(v) => onChange(f.id, v)} error={!!err} />;
        else
          input = (
            <Input
              id={id}
              type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : f.kind === "link" ? "url" : "text"}
              placeholder={f.kind === "link" ? "https://" : undefined}
              value={text}
              onChange={(e) => onChange(f.id, e.target.value)}
              className={cn(f.kind === "date" || f.kind === "number" ? "w-48" : undefined, bad)}
            />
          );
        return (
          <Field key={f.id} label={f.label || "Untitled question"} htmlFor={f.kind === "choice" || f.kind === "file" ? undefined : id} required={f.required} help={f.help || undefined} error={err}>
            {input}
          </Field>
        );
      })}
      {!fields.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No questions yet.</p>}
    </div>
  );
}

/** The answers in a request's pop-out. */
export function Answers({ fields, answers }: { fields: FormField[]; answers: Record<string, Answer> }) {
  return (
    <div className="space-y-3">
      {fields.map((f) => {
        if (f.kind === "heading") return <p key={f.id} className="kicker pt-1 text-[10px] text-muted-foreground">{f.label}</p>;
        const a = answers[f.id];
        let v: ReactNode = "—";
        if (f.kind === "checkbox") v = a === true ? "Yes" : "No";
        else if (f.kind === "file" && Array.isArray(a) && a.length)
          v = (
            <ul className="mt-1 space-y-1.5">
              {(a as Attachment[]).map((x, i) => (
                <FileRow key={i} file={x} />
              ))}
            </ul>
          );
        else if (Array.isArray(a) && a.length) v = (a as string[]).join(", ");
        else if (typeof a === "string" && a.trim())
          v =
            f.kind === "date" ? (
              fmtDay(a)
            ) : f.kind === "link" ? (
              <a href={a} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {a}
              </a>
            ) : (
              a
            );
        return (
          <div key={f.id}>
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <div className="text-sm break-words whitespace-pre-line">{v}</div>
          </div>
        );
      })}
    </div>
  );
}
