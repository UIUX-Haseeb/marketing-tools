"use client";

/**
 * The request pop-out, laid out like the portal's Photoshoot Request sheet: the step bar, the
 * request on the left, the history on the right, and "··· More" / Close / the next step in the
 * footer. ActionDialog asks for what a step needs (a designer, a note, the files) — the same
 * dialog opens when a card is dragged to that column.
 */
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowRightLeft, Ban, CalendarDays, Check as CheckIcon, CircleCheck, Clock, FilePlus2, Lock, Mail, MessageSquareReply, MoreHorizontal,
  Pencil, Play, RotateCcw, Send, Upload, UserRound, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { categoryLabel, LEAD_LABEL, typeById } from "./catalog";
import { colorOf, columnOf, type Move, type Role } from "./columns";
import { fmtDay, fmtStamp, needs } from "./rules";
import { designerAway, designerColor, settings } from "./settings";
import {
  assignDesigner, cancelRequest, decideUrgent, expireReply, move, requestRevision, returnRequest, revisionWindow, sendReminder,
} from "./store";
import type { Attachment, DesignRequest, HistoryEntry } from "./types";
import { Check, DropZone, FileRow, Menu, Modal, Sheet } from "./ui";

const STEPS = ["Submitted", "Confirmed", "In progress", "Delivered", "Completed"] as const;
/** Where each column sits on the step bar (Returned is still at the start, a revision is back before Delivered). */
const STEP_AT: Record<string, number> = { Submitted: 0, Returned: 0, Confirmed: 1, "In progress": 2, "Revision requested": 2, Delivered: 3, Completed: 4, Cancelled: -1 };

export const longDay = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const daysAgo = (iso: string) => {
  const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export function allFiles(r: DesignRequest): [string, Attachment[]][] {
  return (
    [
      ["Copy", r.copyFiles],
      ["Assets", r.assets],
      ["Reference", r.referenceFiles],
      ["Permit QR", r.permitQr],
      ["Developer approval", r.developerApproval],
      ["HR / department head approval", r.personApproval],
      ...settings().documents.map((doc) => [doc.name, r.docs?.[doc.id] ?? []]),
      ["Delivered", r.delivered ?? []],
    ] as [string, Attachment[]][]
  ).filter(([, f]) => f.length);
}

export function Avatar({ name, size = "sm" }: { name?: string; size?: "sm" | "md" }) {
  const initials = name ? name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("") : "U";
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-medium text-white", size === "sm" ? "size-5 text-[9px]" : "size-7 text-[11px]", !name && "bg-muted text-muted-foreground")}
      style={name ? { background: designerColor(name) === "#9ca3af" ? "#2f4960" : designerColor(name) } : undefined}
    >
      {initials}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm break-words whitespace-pre-line">{children || "—"}</div>
    </div>
  );
}

function Alert({ tone = "warn", icon, children }: { tone?: "warn" | "info" | "danger"; icon?: ReactNode; children: ReactNode }) {
  const c = { warn: "border-warning/30 bg-warning/10 text-warning", info: "border-info/30 bg-info/10 text-info", danger: "border-destructive/30 bg-destructive/10 text-destructive" }[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", c)}>
      {icon ?? <AlertTriangle />}
      <div>{children}</div>
    </div>
  );
}

function historyIcon(h: HistoryEntry) {
  const a = h.action.toLowerCase();
  if (a.startsWith("submitted") || a.startsWith("resubmitted")) return <FilePlus2 />;
  if (a.startsWith("returned")) return <MessageSquareReply />;
  if (a.startsWith("confirmed") || a.startsWith("designer")) return <UserRound />;
  if (a.includes("started")) return <Play />;
  if (a.startsWith("delivered")) return <Upload />;
  if (a.startsWith("revision")) return <Pencil />;
  if (a.startsWith("urgent")) return <Zap />;
  if (a.startsWith("reminder")) return <Mail />;
  if (a.includes("cancel") || a.includes("auto-closed")) return <Ban />;
  if (a.startsWith("closed")) return <CircleCheck />;
  return <ArrowRightLeft />;
}

function StepBar({ r }: { r: DesignRequest }) {
  const col = columnOf(r);
  const at = STEP_AT[col];
  return (
    <div className="flex px-6 py-3">
      {STEPS.map((s, i) => {
        const active = i === at;
        const done = at > i;
        return (
          <div
            key={s}
            className={cn("relative -ml-2 flex h-8 flex-1 items-center justify-center text-xs first:ml-0", active ? "text-white" : done ? "text-foreground" : "text-muted-foreground")}
            style={{
              clipPath: i === 0 ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)" : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)",
              background: active ? colorOf(col) : done ? "color-mix(in oklab, var(--secondary) 100%, transparent)" : "color-mix(in oklab, var(--secondary) 50%, transparent)",
            }}
          >
            {active && col !== s ? col : s}
          </div>
        );
      })}
    </div>
  );
}

export type Intent = { id: string; move: Move };

export function RequestSheet({ r, role, onClose, onEdit, onAct, onCalendar }: { r: DesignRequest; role: Role; onClose: () => void; onEdit: () => void; onAct: (m: Move) => void; onCalendar: () => void }) {
  const col = columnOf(r);
  const t = typeById(r.typeId);
  const n = needs(r);
  const win = revisionWindow(r);
  const pendingUrgent = r.urgentApproval === "pending";
  const lastReturn = [...r.history].reverse().find((h) => h.action.startsWith("Returned"));
  const live = r.status !== "Closed";
  const canCancel = ["Submitted", "Returned", "Confirmed", "In progress"].includes(r.status);

  // The footer's main button: the next step for this role.
  let primary: ReactNode = null;
  const more: Parameters<typeof Menu>[0]["items"] = [];
  if (role === "marketing") {
    if (r.status === "Submitted" && pendingUrgent) primary = <Button onClick={() => decideUrgent(r.id, true)}><Zap /> Approve urgent</Button>;
    else if (r.status === "Submitted") primary = <Button onClick={() => onAct("assign")}><UserRound /> Assign designer</Button>;
    if (r.status === "Returned") primary = <Button disabled={r.reminderSent} onClick={() => sendReminder(r.id)}><Mail /> {r.reminderSent ? "Reminder sent" : "Send reminder"}</Button>;
    if (r.status === "Confirmed") primary = <Button onClick={() => onAct("start")}><Play /> Start design work</Button>;
    if (r.status === "In progress" || r.status === "Revision requested") primary = <Button onClick={() => onAct("deliver")}><Upload /> Deliver</Button>;
    if (r.status === "Delivered") primary = <Button onClick={() => onAct("complete")}><CircleCheck /> Mark as completed</Button>;

    if (r.status === "Submitted") more.push({ label: "Return with a note", icon: <MessageSquareReply />, onClick: () => onAct("return") });
    if (r.status === "Submitted" && pendingUrgent) more.push({ label: "Decline urgent", icon: <Clock />, onClick: () => decideUrgent(r.id, false) });
    if (["Confirmed", "In progress", "Revision requested"].includes(r.status)) more.push({ label: "Change designer", icon: <UserRound />, onClick: () => onAct("assign") });
    if (r.status === "Returned") more.push({ label: "Skip 2 working days (demo)", icon: <RotateCcw />, onClick: () => expireReply(r.id) });
  } else if (role === "designer") {
    if (r.status === "Confirmed") primary = <Button onClick={() => onAct("start")}><Play /> Start design work</Button>;
    if (r.status === "In progress" || r.status === "Revision requested") primary = <Button onClick={() => onAct("deliver")}><Upload /> Deliver</Button>;
  } else {
    if (r.status === "Returned") primary = <Button onClick={onEdit}><Pencil /> Edit and resubmit</Button>;
    if (r.status === "Delivered") primary = <Button onClick={() => onAct("complete")}><CheckIcon /> Accept and close</Button>;
    if (r.status === "Delivered") more.push({ label: "Request a revision", icon: <Pencil />, disabled: !win?.open, onClick: () => onAct("revision") });
  }
  more.push({ label: "Show on calendar", icon: <CalendarDays />, onClick: onCalendar });
  if (canCancel && role !== "designer") more.push("divider", { label: "Cancel request", icon: <X />, danger: true, onClick: () => onAct("cancel") });

  return (
    <Sheet label={`${r.ref} ${r.title}`} onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b px-6 pt-4 pb-3">
        <div className="min-w-0">
          <p className="kicker text-[10px] text-muted-foreground">Design request · {r.ref}</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-lg leading-snug font-normal">
            {r.title}
            <span className="rounded-md px-2 py-0.5 text-xs" style={{ color: colorOf(col), background: `${colorOf(col)}1f` }}>
              {col}
            </span>
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {role === "requester" && r.status === "Returned" && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>
      </header>

      {col !== "Cancelled" && <StepBar r={r} />}

      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1fr_380px] md:overflow-hidden">
        <div className="space-y-3.5 px-6 py-4 md:overflow-y-auto">
          {pendingUrgent && (
            <Alert icon={<Zap />}>
              Urgent — {r.urgentReason || "no reason given"}. It can’t be confirmed until the Marketing Director approves or declines the urgency.
            </Alert>
          )}
          {r.status === "Returned" && lastReturn && (
            <Alert>
              {lastReturn.by} sent it back: “{lastReturn.note}”. {r.replyDue && <>Waiting for {role === "requester" ? "your" : `${r.requester.name.split(" ")[0]}’s`} reply by {fmtStamp(r.replyDue)} — after that it closes and adds a flag.</>}
            </Alert>
          )}
          {r.status === "Delivered" && win && (
            <Alert tone="info" icon={<Pencil />}>
              {win.open
                ? `Changes go in one list by ${fmtStamp(win.until.toISOString())} — revision ${r.revisionRounds + 1} of ${settings().revisionRounds}.`
                : r.revisionRounds >= settings().revisionRounds
                  ? `All ${settings().revisionRounds} revision rounds used — more changes need a new request.`
                  : "The 2-working-day revision window has closed."}
            </Alert>
          )}
          {r.closeReason && r.closeReason !== "Completed" && <Alert tone="danger" icon={<Ban />}>{r.closeReason === "Auto-closed" ? "Closed by itself — no reply within 2 working days." : "Cancelled."}</Alert>}
          {live && !["Submitted", "Returned"].includes(r.status) && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Locked — changes need a new request.
            </p>
          )}

          <Field label="Deadline">
            {longDay(r.deadline)}
            {r.urgent && <span className="ml-2 text-xs text-destructive">Urgent{r.urgentApproval === "approved" ? " · approved" : ""}</span>}
          </Field>
          <Field label="Request">
            {categoryLabel(r.category as never)} › {t?.label ?? "—"}
            {t && <span className="block text-xs text-muted-foreground">Lead time: {LEAD_LABEL[t.lead]}</span>}
          </Field>
          <Field label="Requested by">
            {r.requester.name} · {r.requester.department}
            <span className="block text-xs text-muted-foreground">{r.requester.email}</span>
          </Field>
          <Field label="Brief">{r.brief}</Field>
          <Field label="Formats">{[...r.formats, r.customSize && `(${r.customSize})`].filter(Boolean).join(", ")}</Field>
          <Field label="Used on">{r.usages.join(", ")}</Field>
          {n.print && <Field label="Print">{`${r.printQuantity} copies${r.bleed ? " · with bleed" : ""}`}</Field>}
          <Field label="Language">{r.language === "Both" ? "English and Arabic" : r.language}</Field>
          <Field label="Editable source files">{r.sourceFiles === "yes" ? "Yes" : "No"}</Field>
          <Field label="Final copy">{r.copy || (r.copyFiles.length ? "Attached" : "")}</Field>
          {r.assetsLink && (
            <Field label="Assets link">
              <a href={r.assetsLink} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {r.assetsLink}
              </a>
            </Field>
          )}
          {r.reference && <Field label="Reference">{r.reference}</Field>}
          {n.permit && <Field label="Permit number">{r.permitNumber}</Field>}
          {(n.developer || n.person || n.people) && (
            <Field label="Approvals">
              {[n.developer && "Developer approval attached", n.person && "HR / department head approval attached", n.people && (r.peopleAgreed ? "People shown have agreed" : "People shown — consent not ticked")].filter(Boolean).join("\n")}
            </Field>
          )}
          {r.termsVersion && <Field label="Terms accepted">Version {r.termsVersion}</Field>}
          <Field label="Designer">
            <span className="inline-flex items-center gap-2">
              <Avatar name={r.designer} /> {r.designer ?? "Unassigned"}
            </span>
          </Field>

          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Supporting documents</p>
            {allFiles(r).length ? (
              <div className="space-y-3">
                {allFiles(r).map(([k, f]) => (
                  <div key={k} className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <ul className="space-y-1.5">
                      {f.map((x, i) => (
                        <FileRow key={i} file={x} checkRes={k === "Assets"} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
        </div>

        <aside className="space-y-3 border-t bg-secondary/30 px-5 py-4 md:overflow-y-auto md:border-t-0 md:border-l">
          <p className="text-sm font-normal">History</p>
          <ol className="relative space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-border">
            {[...r.history].reverse().map((h, i) => (
              <li key={i} className="relative flex gap-3">
                <span className="z-[1] grid size-8 shrink-0 place-items-center rounded-full bg-card text-navy-2 shadow-sm ring-1 ring-border dark:text-paper [&_svg]:size-4">{historyIcon(h)}</span>
                <div className="min-w-0 flex-1 rounded-xl border bg-card p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p>
                      <span className="font-normal">{h.by}</span> <span className="text-muted-foreground">· {h.action}</span>
                    </p>
                    <p className="shrink-0 text-right text-[11px] text-muted-foreground">
                      {fmtDay(h.at)}
                      <span className="block">{daysAgo(h.at)}</span>
                    </p>
                  </div>
                  {h.note && <p className="mt-2 whitespace-pre-line text-muted-foreground">{h.note}</p>}
                  {h.emailed?.length ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Mail className="size-3.5 shrink-0" /> Emailed {h.emailed.join(", ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t px-6 py-3">
        <Menu
          trigger={
            <>
              <MoreHorizontal className="size-4" /> More
            </>
          }
          items={more}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {primary}
        </div>
      </footer>
    </Sheet>
  );
}

const TITLE: Record<Exclude<Move, "edit">, string> = {
  assign: "Assign a designer",
  return: "Return with a note",
  start: "Start design work",
  deliver: "Deliver the design",
  complete: "Mark as completed",
  revision: "Request a revision",
  cancel: "Cancel this request",
};

/** What a step needs before the card moves — opened from the sheet's buttons or by dragging a card. */
export function ActionDialog({ r, move: m, viewerName, onClose }: { r: DesignRequest; move: Exclude<Move, "edit">; viewerName: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [flag, setFlag] = useState(false);
  const [designer, setDesigner] = useState(r.designer ?? "");
  const [files, setFiles] = useState<Attachment[]>([]);
  const first = r.requester.name.split(" ")[0];
  const needsNote = m === "return" || m === "revision";
  const ok = (m !== "assign" || designer) && (!needsNote || note.trim());

  const go = () => {
    if (m === "assign") assignDesigner(r.id, designer, note.trim() || undefined);
    if (m === "return") returnRequest(r.id, note.trim(), flag);
    if (m === "start") move(r.id, "In progress", { note: note.trim() || undefined });
    if (m === "deliver") move(r.id, "Delivered", { delivered: files, note: note.trim() || undefined });
    if (m === "complete") move(r.id, "Closed");
    if (m === "revision") requestRevision(r.id, note.trim());
    if (m === "cancel") cancelRequest(r.id, viewerName);
    onClose();
  };

  return (
    <Modal label={TITLE[m]} onClose={onClose} className="mt-[10vh] max-w-[520px]">
      <div className="space-y-4 p-6">
        <div>
          <p className="text-base font-normal">{TITLE[m]}</p>
          <p className="text-sm text-muted-foreground">
            {r.ref} · {r.title}
          </p>
        </div>

        {m === "assign" && (
          <div className="space-y-2">
            <Select value={designer} onChange={(e) => setDesigner(e.target.value)} aria-label="Designer">
              <option value="">Pick the designer…</option>
              {settings().designers.map((d) => {
                const away = designerAway(d.name, r.deadline);
                return (
                  <option key={d.name} value={d.name}>
                    {d.name}
                    {away ? ` — ${away} on ${fmtDay(r.deadline)}` : ""}
                  </option>
                );
              })}
            </Select>
            {designer && designerAway(designer, r.deadline) && (
              <p className="text-xs text-warning">
                {designer} — {designerAway(designer, r.deadline)} on {longDay(r.deadline)}, the deadline. Pick someone else or agree a new date with {first}.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {r.status === "Submitted" ? `That confirms it: the request is locked, and ${first} gets the confirmation with the deadline ${fmtDay(r.deadline)}.` : `${first} is told about the change.`}
            </p>
          </div>
        )}
        {m === "return" && (
          <>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should they fix? e.g. The price says TBC — send the final price." autoFocus />
            <Check id="flag" checked={flag} onChange={setFlag}>
              Flag it as a placeholder or incomplete submission
            </Check>
            <p className="text-xs text-muted-foreground">{first} has 2 working days to reply, then it closes by itself and adds a flag.</p>
          </>
        )}
        {m === "start" && <p className="text-sm text-muted-foreground">{r.designer ?? "The designer"} starts on it now. Cancelling from here on adds a flag to {first}.</p>}
        {m === "deliver" && (
          <DropZone id="delivered" compact files={files} onChange={setFiles} hint={`Formats booked: ${r.formats.join(", ")}${r.sourceFiles === "yes" ? " + editable source files" : ""}`} />
        )}
        {m === "complete" && <p className="text-sm text-muted-foreground">The request closes and {first} is told. That is the end.</p>}
        {m === "revision" && (
          <>
            <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder={"All your changes, in one list:\n1. Move the logo to the top right\n2. The price should read AED 3,400,000"} autoFocus />
            <p className="text-xs text-muted-foreground">
              Round {r.revisionRounds + 1} of {settings().revisionRounds}. Covered: layout, brand errors, crops, a missed format, our typos, colours. Not covered: new copy, a new concept, extra sizes.
            </p>
          </>
        )}
        {m === "cancel" && (
          <p className={cn("text-sm", r.workStarted ? "text-destructive" : "text-muted-foreground")}>
            {r.workStarted ? `Design work has started — cancelling now adds a flag to ${first}.` : "Design work hasn’t started, so cancelling adds no flag."}
          </p>
        )}
        {(m === "assign" || m === "start" || m === "deliver") && (
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment (optional)" />
        )}
      </div>
      <footer className="flex justify-end gap-2 border-t px-6 py-3">
        <Button variant="secondary" onClick={onClose}>
          {m === "cancel" ? "Keep it" : "Back"}
        </Button>
        <Button variant={m === "cancel" ? "destructive" : "default"} disabled={!ok} onClick={go}>
          {m === "cancel" ? <Ban /> : <Send />} {{ assign: r.status === "Submitted" ? "Confirm" : "Change designer", return: "Send it back", start: "Start", deliver: "Deliver", complete: "Complete", revision: "Send revisions", cancel: "Cancel request" }[m]}
        </Button>
      </footer>
    </Modal>
  );
}

