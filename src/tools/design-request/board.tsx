"use client";

/**
 * The requests board, laid out like the portal's Support Tickets page: a column per status,
 * cards with the request's pills and people, and a pop-out with the request and its actions.
 * "Viewing as" switches between the requester (own requests, edit / cancel / revisions) and
 * Marketing (every request, return / confirm / start / deliver / close, urgent approvals).
 */
import { useEffect, useState, type ReactNode } from "react";
import { Ban, CalendarDays, Flag, FolderOpen, Lock, Mail, PauseCircle, Plus, RotateCcw, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { categoryLabel, typeById } from "./catalog";
import { RequestForm } from "./request-form";
import { FLAG_LIMIT, fmtDay, fmtStamp, needs, REVISION_ROUNDS } from "./rules";
import {
  cancelRequest, decideUrgent, DIRECTOR, expireReply, flagsOf, isPaused, MARKETING, move, PEOPLE, reinstate, requesterFrom, requestRevision,
  resetDemo, returnRequest, revisionWindow, runTimers, sendReminder, useDesignState,
} from "./store";
import { STATUSES, type Attachment, type DesignRequest, type Status } from "./types";
import { Check, Drawer, DropZone, FileRow, Pill, type Tone } from "./ui";

type Role = "requester" | "marketing";

const COLUMN: Record<Status, string> = {
  Submitted: "bg-secondary text-foreground",
  Returned: "bg-warning/20 text-warning",
  Confirmed: "bg-info/15 text-info",
  "In progress": "bg-navy-2/15 text-navy-2 dark:text-paper",
  Delivered: "bg-success/15 text-success",
  "Revision requested": "bg-brand/15 text-brand",
  Closed: "bg-muted text-muted-foreground",
};
const TONE: Record<Status, Tone> = { Submitted: "grey", Returned: "warn", Confirmed: "info", "In progress": "info", Delivered: "success", "Revision requested": "warn", Closed: "outline" };

function RequestCard({ r, onOpen, showRequester }: { r: DesignRequest; onOpen: () => void; showRequester: boolean }) {
  const t = typeById(r.typeId);
  return (
    <button type="button" onClick={onOpen} className="w-full space-y-2 rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-navy-2/60">
      <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{r.ref}</p>
      <p className="text-sm leading-snug font-normal">{r.title}</p>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <FolderOpen className="mt-px size-3.5 shrink-0" />
        <span className="line-clamp-2">
          {categoryLabel(r.category as never)} › {t?.label}
        </span>
      </p>
      <div className="flex flex-wrap gap-1">
        {r.urgent && (
          <Pill tone={r.urgentApproval === "pending" ? "warn" : "danger"}>
            <Zap /> {r.urgentApproval === "pending" ? "Urgent · awaiting approval" : "Urgent"}
          </Pill>
        )}
        {r.closeReason && r.closeReason !== "Completed" && <Pill tone="danger">{r.closeReason}</Pill>}
        <Pill tone="outline">
          <CalendarDays /> {fmtDay(r.deadline)}
        </Pill>
        {r.status === "Returned" && r.replyDue && <Pill tone="warn">Reply by {fmtDay(r.replyDue)}</Pill>}
      </div>
      {showRequester && (
        <p className="border-t pt-2 text-xs text-muted-foreground">
          <span className="kicker mr-2 text-[10px]">Requester</span>
          {r.requester.name}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">Created {fmtStamp(r.created)}</p>
    </button>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y rounded-xl border bg-card">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words whitespace-pre-line">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Files({ files, checkRes }: { files: Attachment[]; checkRes?: boolean }) {
  return files.length ? (
    <ul className="space-y-1.5">
      {files.map((f, i) => (
        <FileRow key={i} file={f} checkRes={checkRes} />
      ))}
    </ul>
  ) : null;
}

type Panel = null | "return" | "revision" | "deliver" | "cancel";

function Detail({ r, role, viewerName, onEdit }: { r: DesignRequest; role: Role; viewerName: string; onEdit: () => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState("");
  const [flag, setFlag] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const t = typeById(r.typeId);
  const n = needs(r);
  const win = revisionWindow(r);
  const locked = !["Submitted", "Returned"].includes(r.status);
  const open = (p: Panel) => {
    setPanel(p);
    setNote("");
    setFlag(false);
    setFiles([]);
  };
  const done = () => setPanel(null);

  const actions: ReactNode[] = [];
  if (role === "requester") {
    if (r.status === "Returned") actions.push(<Button key="edit" onClick={onEdit}>Edit and resubmit</Button>);
    if (r.status === "Delivered" && win?.open) actions.push(<Button key="rev" variant="outline" onClick={() => open("revision")}>Request a revision</Button>);
    if (r.status === "Delivered") actions.push(<Button key="close" onClick={() => move(r.id, "Closed")}>Accept and close</Button>);
    if (["Submitted", "Returned", "Confirmed", "In progress"].includes(r.status)) actions.push(<Button key="cancel" variant="ghost" onClick={() => open("cancel")}>Cancel request</Button>);
  } else {
    if (r.status === "Submitted" && r.urgentApproval === "pending") {
      actions.push(<Button key="ua" onClick={() => decideUrgent(r.id, true)}><Zap /> Approve urgent</Button>);
      actions.push(<Button key="ud" variant="outline" onClick={() => decideUrgent(r.id, false)}>Decline urgent</Button>);
    }
    if (r.status === "Submitted") {
      actions.push(<Button key="confirm" disabled={r.urgentApproval === "pending"} title={r.urgentApproval === "pending" ? "Waiting for the Marketing Director" : undefined} onClick={() => move(r.id, "Confirmed")}>Confirm</Button>);
      actions.push(<Button key="return" variant="outline" onClick={() => open("return")}>Return with a note</Button>);
    }
    if (r.status === "Confirmed") actions.push(<Button key="start" onClick={() => move(r.id, "In progress")}>Start design work</Button>);
    if (r.status === "In progress" || r.status === "Revision requested") actions.push(<Button key="deliver" onClick={() => open("deliver")}>Deliver</Button>);
    if (r.status === "Returned") {
      actions.push(<Button key="remind" variant="outline" disabled={r.reminderSent} onClick={() => sendReminder(r.id)}><Mail /> {r.reminderSent ? "Reminder sent" : "Send reminder"}</Button>);
      actions.push(<Button key="expire" variant="ghost" onClick={() => expireReply(r.id)}>Skip 2 working days (demo)</Button>);
    }
    if (r.status === "Delivered") actions.push(<Button key="close" variant="outline" onClick={() => move(r.id, "Closed")}>Close</Button>);
  }

  return (
    <div className="space-y-6 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={TONE[r.status]} className="text-xs">{r.status}</Pill>
        {r.closeReason && <Pill tone={r.closeReason === "Completed" ? "success" : "danger"}>{r.closeReason}</Pill>}
        {r.urgent && <Pill tone="danger"><Zap /> Urgent{r.urgentApproval === "pending" ? " · awaiting the Marketing Director" : ""}</Pill>}
        {locked && r.status !== "Closed" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Locked — changes need a new request
          </span>
        )}
      </div>

      {r.status === "Returned" && r.replyDue && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          Waiting for {role === "requester" ? "your" : `${r.requester.name}'s`} reply — due {fmtStamp(r.replyDue)}. After that the request closes and adds a flag.
        </p>
      )}
      {r.status === "Delivered" && win && (
        <p className="rounded-xl border bg-secondary/60 p-3 text-sm text-muted-foreground">
          {win.open
            ? `Send changes as one list by ${fmtStamp(win.until.toISOString())}. Revision ${r.revisionRounds + 1} of ${REVISION_ROUNDS}.`
            : r.revisionRounds >= REVISION_ROUNDS
              ? `All ${REVISION_ROUNDS} revision rounds used — more changes need a new request.`
              : "The 2-working-day revision window has closed."}
        </p>
      )}

      {actions.length > 0 && <div className="flex flex-wrap gap-2">{actions}</div>}

      {panel && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          {panel === "return" && (
            <>
              <p className="text-sm font-normal">What should {r.requester.name.split(" ")[0]} fix?</p>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The price says TBC — send the final price." />
              <Check id="flag" checked={flag} onChange={setFlag}>Flag it as a placeholder or incomplete submission</Check>
              <p className="text-xs text-muted-foreground">They have 2 working days to reply, then it auto-closes with a flag.</p>
            </>
          )}
          {panel === "revision" && (
            <>
              <p className="text-sm font-normal">All your changes, in one list</p>
              <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder={"1. Move the logo to the top right\n2. The price should read AED 3,400,000"} />
              <p className="text-xs text-muted-foreground">Covered: layout, brand errors, crops, a missed format, our typos, colours. Not covered: new copy, a new concept, extra sizes.</p>
            </>
          )}
          {panel === "deliver" && (
            <>
              <p className="text-sm font-normal">Upload the finished files</p>
              <DropZone id="delivered" compact files={files} onChange={setFiles} hint={`Formats booked: ${r.formats.join(", ")}${r.sourceFiles === "yes" ? " + editable source files" : ""}`} />
            </>
          )}
          {panel === "cancel" && (
            <p className={cn("text-sm", r.workStarted && "text-destructive")}>
              {r.workStarted ? "Design work has started — cancelling now adds a flag to your profile." : "Design work hasn't started, so cancelling adds no flag."}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant={panel === "cancel" ? "destructive" : "default"}
              disabled={(panel === "return" || panel === "revision") && !note.trim()}
              onClick={() => {
                if (panel === "return") returnRequest(r.id, note.trim(), flag);
                if (panel === "revision") requestRevision(r.id, note.trim());
                if (panel === "deliver") move(r.id, "Delivered", { delivered: files });
                if (panel === "cancel") cancelRequest(r.id, viewerName);
                done();
              }}
            >
              {{ return: "Send it back", revision: "Send revisions", deliver: "Deliver", cancel: "Cancel request" }[panel]}
            </Button>
            <Button variant="ghost" onClick={done}>
              Keep it
            </Button>
          </div>
        </div>
      )}

      <Rows
        rows={[
          ["Requester", `${r.requester.name} · ${r.requester.department}\n${r.requester.email}`],
          ["Request", `${categoryLabel(r.category as never)} › ${t?.label ?? "—"}`],
          ["Brief", r.brief],
          ["Formats", [...r.formats, r.customSize && `(${r.customSize})`].filter(Boolean).join(", ")],
          ["Used on", r.usages.join(", ")],
          ...(n.print ? ([["Print", `${r.printQuantity} copies${r.bleed ? " · with bleed" : ""}`]] as [string, ReactNode][]) : []),
          ["Language", r.language === "Both" ? "English and Arabic" : r.language],
          ["Source files", r.sourceFiles === "yes" ? "Yes" : "No"],
          ["Deadline", fmtDay(r.deadline)],
          ...(r.urgent || r.urgentReason ? ([["Urgent because", r.urgentReason]] as [string, ReactNode][]) : []),
          ...(n.permit ? ([["Permit number", r.permitNumber]] as [string, ReactNode][]) : []),
          ["Final copy", r.copy || "Attached"],
          ...(r.assetsLink ? ([["Drive link", <a key="l" href={r.assetsLink} target="_blank" rel="noreferrer" className="underline underline-offset-4">{r.assetsLink}</a>]] as [string, ReactNode][]) : []),
          ...(r.reference ? ([["Reference", r.reference]] as [string, ReactNode][]) : []),
        ]}
      />

      {[
        ["Copy", r.copyFiles],
        ["Assets", r.assets],
        ["Reference", r.referenceFiles],
        ["Permit QR", r.permitQr],
        ["Developer approval", r.developerApproval],
        ["HR / department head approval", r.personApproval],
        ["Delivered", r.delivered ?? []],
      ]
        .filter(([, f]) => (f as Attachment[]).length)
        .map(([k, f]) => (
          <section key={k as string} className="space-y-2">
            <p className="kicker text-muted-foreground">{k as string}</p>
            <Files files={f as Attachment[]} checkRes={k === "Assets"} />
          </section>
        ))}

      <section className="space-y-3">
        <p className="kicker text-muted-foreground">History and emails</p>
        <ol className="space-y-3 border-l pl-4">
          {[...r.history].reverse().map((h, i) => (
            <li key={i} className="relative text-sm">
              <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-navy-2 dark:bg-paper" />
              <p>
                <span className="font-normal">{h.action}</span> <span className="text-muted-foreground">· {h.by} · {fmtStamp(h.at)}</span>
              </p>
              {h.note && <p className="mt-1 rounded-lg bg-secondary/60 px-3 py-2 whitespace-pre-line">{h.note}</p>}
              {h.emailed?.length ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" /> Emailed {h.emailed.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function Board() {
  const state = useDesignState();
  const [viewerId, setViewerId] = useState(PEOPLE[0].id);
  const [role, setRole] = useState<Role>("requester");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<null | { editId?: string }>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => runTimers(), []);

  const viewer = requesterFrom(PEOPLE.find((p) => p.id === viewerId) ?? PEOPLE[0]);
  const flags = flagsOf(state, viewer.id);
  const paused = isPaused(state, viewer.id);
  const pausedPeople = PEOPLE.filter((p) => isPaused(state, p.id));

  const needle = q.trim().toLowerCase();
  const visible = state.requests
    .filter((r) => role === "marketing" || r.requester.id === viewer.id)
    .filter((r) => !needle || [r.ref, r.title, r.requester.name, typeById(r.typeId)?.label ?? ""].some((x) => x.toLowerCase().includes(needle)));

  const current = state.requests.find((r) => r.id === openId);
  const editing = form?.editId ? state.requests.find((r) => r.id === form.editId) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <Select value={viewerId} onChange={(e) => setViewerId(e.target.value)} className="w-56">
            {PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
                {flagsOf(state, p.id).length ? ` · ${flagsOf(state, p.id).length} flag${flagsOf(state, p.id).length > 1 ? "s" : ""}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Viewing as</p>
          <div className="flex h-9 rounded-lg border p-0.5">
            {(["requester", "marketing"] as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={cn("rounded-md px-3 text-sm", role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {r === "requester" ? "Requester" : "Marketing"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative min-w-48 flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground">Search</p>
          <Search className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Just Listed, DR-0003" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={resetDemo} title="Put the demo requests and flags back">
            <RotateCcw /> Reset
          </Button>
          <Button onClick={() => setForm({})} disabled={paused} title={paused ? "Requests are paused at 3 flags" : undefined}>
            <Plus /> New request
          </Button>
        </div>
      </div>

      {sent && (
        <p className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
          {sent} sent. You’ll get an email at each step — it’s only scheduled once it shows <span className="font-normal">Confirmed</span>.
          <button type="button" onClick={() => setSent(null)} className="ml-2 text-muted-foreground underline-offset-4 hover:underline">Dismiss</button>
        </p>
      )}

      {role === "requester" && (flags.length > 0 || paused) && (
        <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", paused ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}>
          {paused ? <PauseCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Flag className="mt-0.5 size-4 shrink-0 text-warning" />}
          <div className="space-y-1">
            <p className="font-normal">
              {paused ? `Your requests are paused — ${flags.length} flags.` : `${flags.length} of ${FLAG_LIMIT} flags on your profile.`}
            </p>
            {paused && <p className="text-muted-foreground">The {DIRECTOR} and your Head of Department need to review and reinstate your account.</p>}
            <ul className="list-disc pl-4 text-muted-foreground">
              {flags.map((f, i) => (
                <li key={i}>
                  {f.reason} — {fmtDay(f.at)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {role === "marketing" && pausedPeople.length > 0 && (
        <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-normal">
            <Ban className="size-4 text-destructive" /> Paused at {FLAG_LIMIT} flags
          </p>
          {pausedPeople.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <span>{p.fullName}</span>
              <Button size="sm" variant="outline" onClick={() => reinstate(p.id)}>Reinstate (Marketing Director + Head of Department)</Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {visible.length} request{visible.length === 1 ? "" : "s"} · {role === "requester" ? "Everything you've asked Marketing & Design for." : `Everything sent to ${MARKETING}.`}
      </p>

      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3 px-1">
          {STATUSES.map((s) => {
            const list = visible.filter((r) => r.status === s);
            return (
              <section key={s} className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-secondary/40 p-2">
                <header className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm font-normal", COLUMN[s])}>
                  {s}
                  <span className="rounded-full bg-card/70 px-2 text-xs tabular-nums">{list.length}</span>
                </header>
                {list.length ? (
                  list.map((r) => <RequestCard key={r.id} r={r} onOpen={() => setOpenId(r.id)} showRequester={role === "marketing"} />)
                ) : (
                  <p className="py-10 text-center text-xs text-muted-foreground">No requests.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {current && (
        <Drawer
          title={
            <span>
              <span className="mr-2 text-muted-foreground">{current.ref}</span>
              {current.title}
            </span>
          }
          onClose={() => setOpenId(null)}
        >
          <Detail
            key={current.id + current.status}
            r={current}
            role={role}
            viewerName={role === "marketing" ? MARKETING : viewer.name}
            onEdit={() => {
              setOpenId(null);
              setForm({ editId: current.id });
            }}
          />
        </Drawer>
      )}

      {form && (
        <RequestForm
          requester={editing ? editing.requester : viewer}
          initial={editing}
          onClose={() => setForm(null)}
          onSent={(r) => {
            setForm(null);
            setSent(r.ref);
          }}
        />
      )}
    </div>
  );
}
