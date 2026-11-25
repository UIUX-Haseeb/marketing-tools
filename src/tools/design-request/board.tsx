"use client";

/**
 * The requests board, laid out like the portal's Photoshoot Requests page: a toolbar (search,
 * order, Calendar, Refresh, Columns, Settings), the "How it works" steps, the designers with
 * what they're booked on, then a column per status. Drag a card to the next column to take the
 * next step; click it for the pop-out with everything and all its buttons. "Viewing as" switches
 * between the requester (own requests) and Marketing (every request and the admin moves).
 */
import { useEffect, useState, type CSSProperties } from "react";
import {
  Ban, CalendarDays, ClipboardList, Columns3, Eye, EyeOff, FileText, Flag, Layers, Palette, PauseCircle, Plus, RefreshCw, RotateCcw, Search, Settings, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DesignCalendar } from "./calendar";
import { colorOf, COLUMNS, columnOf, HOW_IT_WORKS, moveTo, ROLE_LABEL, type Column, type Move, type Role } from "./columns";
import { ActionDialog, allFiles, Avatar, longDay, RequestSheet, type Intent } from "./detail";
import { RequestForm } from "./request-form";
import { fmtDay, isoDay } from "./rules";
import { resetSettings, settings, useSettings } from "./settings";
import { SettingsPanel } from "./settings-panel";
import { FormBuilder } from "./form-builder";
import { resetForms } from "./forms";
import { DIRECTOR, flagsOf, isPaused, MARKETING, move, PEOPLE, reinstate, requesterFrom, resetDemo, runTimers, useDesignState } from "./store";
import type { DesignRequest } from "./types";
import { Modal } from "./ui";

const ORDERS = {
  default: "Default order",
  deadline: "Deadline, soonest first",
  newest: "Newest first",
  oldest: "Oldest first",
} as const;
type Order = keyof typeof ORDERS;
const PAGE = 6;

function sortBy(order: Order) {
  return (a: DesignRequest, b: DesignRequest) => {
    if (order === "newest") return b.created.localeCompare(a.created);
    if (order === "oldest") return a.created.localeCompare(b.created);
    if (order === "default" && !!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
    return a.deadline.localeCompare(b.deadline);
  };
}

/** The coloured line under the date on a card — what the request is waiting for. */
function statusLine(r: DesignRequest, role: Role): { text: string; tone: string } | null {
  if (r.urgentApproval === "pending") return { text: "Urgent — waiting for the Marketing Director", tone: "text-warning" };
  if (r.status === "Returned") return { text: `Waiting for ${role === "requester" ? "your" : `${r.requester.name.split(" ")[0]}’s`} reply${r.replyDue ? ` · by ${fmtDay(r.replyDue)}` : ""}`, tone: "text-warning" };
  if (r.status === "Revision requested") return { text: `Revision ${r.revisionRounds} of ${settings().revisionRounds} requested`, tone: "text-warning" };
  if (r.status === "Delivered") return { text: `Delivered · ${r.delivered?.length ?? 0} file${r.delivered?.length === 1 ? "" : "s"}`, tone: "text-success" };
  if (r.closeReason === "Completed") return { text: "Completed", tone: "text-success" };
  if (r.closeReason === "Auto-closed") return { text: "Auto-closed — no reply", tone: "text-destructive" };
  if (r.closeReason === "Cancelled") return { text: "Cancelled", tone: "text-muted-foreground" };
  return null;
}

function Card({ r, role, onOpen, onDrag, dragging }: { r: DesignRequest; role: Role; onOpen: () => void; onDrag: (id: string | null) => void; dragging: boolean }) {
  const col = columnOf(r);
  const line = statusLine(r, role);
  const docs = allFiles(r).reduce((n, [, f]) => n + f.length, 0);
  const past = r.status !== "Closed" && r.status !== "Delivered" && r.deadline < isoDay(new Date());
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", r.id);
        e.dataTransfer.effectAllowed = "move";
        onDrag(r.id);
      }}
      onDragEnd={() => onDrag(null)}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "cursor-grab space-y-2 rounded-xl border border-l-[3px] bg-card p-3 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[box-shadow,opacity] outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/40 active:cursor-grabbing",
        dragging && "opacity-40",
      )}
      style={{ borderLeftColor: colorOf(col) }}
    >
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 text-sm font-normal">
          <CalendarDays className="size-4 text-muted-foreground" /> {longDay(r.deadline)}
        </p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Layers className="size-3.5 shrink-0" /> {r.formats.join(", ") || "—"}
        </p>
        {line && <p className={cn("flex items-center gap-1.5 text-xs", line.tone)}>{r.urgentApproval === "pending" ? <Zap className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />} {line.text}</p>}
      </div>
      <p className="truncate text-xs">
        <Palette className="mr-1 inline size-3.5 align-[-2px] text-muted-foreground" />
        <span className="text-muted-foreground">{r.ref} ·</span> {r.title}
      </p>
      <p className="line-clamp-2 text-xs text-muted-foreground">{r.brief}</p>
      <div className="flex flex-wrap gap-1">
        {past && <span className="rounded-md bg-destructive/12 px-1.5 py-0.5 text-[11px] text-destructive">Past deadline</span>}
        {r.urgent && r.urgentApproval !== "pending" && <span className="rounded-md bg-destructive/12 px-1.5 py-0.5 text-[11px] text-destructive">Urgent</span>}
        {docs > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px]">
            <FileText className="size-3" /> {docs} document{docs === 1 ? "" : "s"}
          </span>
        )}
        {r.usages.includes("Print") && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px]">Print</span>}
      </div>
      <dl className="space-y-1 border-t pt-2 text-xs">
        {(
          [
            ["Designer", r.designer, true],
            ["Requester", r.requester.name, false],
            ["Department", r.requester.department, false],
          ] as const
        ).map(([k, v, avatar]) => (
          <div key={k} className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{k}</dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              {avatar && <Avatar name={v} />}
              <span className="truncate">{v ?? "Unassigned"}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted-foreground">Raised {fmtDay(r.created)}</p>
    </div>
  );
}

function HowItWorks({ onHide }: { onHide: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-normal">How it works</p>
        <button type="button" onClick={onHide} className="text-xs text-muted-foreground hover:text-foreground">
          Hide
        </button>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground marker:text-foreground">
        {HOW_IT_WORKS.map(([c, text]) => (
          <li key={c}>
            <span className="font-normal text-foreground">{c}.</span> {text}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Board() {
  const state = useDesignState();
  const [viewerId, setViewerId] = useState(PEOPLE[0].id);
  const cfg = useSettings();
  const [role, setRole] = useState<Role>("marketing");
  const [designerName, setDesignerName] = useState(cfg.designers[0]?.name ?? "");
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<Order>("default");
  const [howTo, setHowTo] = useState(true);
  const [hidden, setHidden] = useState<Column[]>([]);
  const [shown, setShown] = useState<Partial<Record<Column, number>>>({});
  const [dialog, setDialog] = useState<null | "calendar" | "columns" | "settings" | "forms">(null);
  const [calFocus, setCalFocus] = useState<string>();
  const [form, setForm] = useState<null | { editId?: string }>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Column | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => runTimers(), []);

  const viewer = requesterFrom(PEOPLE.find((p) => p.id === viewerId) ?? PEOPLE[0]);
  const viewerName = role === "marketing" ? MARKETING : role === "designer" ? designerName : viewer.name;
  const flags = flagsOf(state, viewer.id);
  const paused = isPaused(state, viewer.id);
  const pausedPeople = PEOPLE.filter((p) => isPaused(state, p.id));

  const needle = q.trim().toLowerCase();
  // Like the portal: managers see everything, a designer only what's assigned to them, a requester their own.
  const mine = state.requests.filter((r) => (role === "marketing" ? true : role === "designer" ? r.designer === designerName : r.requester.id === viewer.id));
  const visible = mine
    .filter((r) => !needle || [r.ref, r.title, r.brief, r.requester.name, r.designer ?? ""].some((x) => x.toLowerCase().includes(needle)))
    .sort(sortBy(order));
  const booked = (name: string) => state.requests.filter((r) => r.designer === name && ["Confirmed", "In progress", "Revision requested"].includes(r.status)).length;

  const current = state.requests.find((r) => r.id === openId);
  const editing = form?.editId ? state.requests.find((r) => r.id === form.editId) : undefined;
  const acting = intent ? state.requests.find((r) => r.id === intent.id) : undefined;
  const dragged = dragId ? state.requests.find((r) => r.id === dragId) : undefined;

  /** Run a move: plain ones happen at once, the rest open their dialog. */
  const act = (r: DesignRequest, m: Move) => {
    if (m === "edit") return setForm({ editId: r.id });
    if (m === "start") return move(r.id, "In progress");
    if (m === "complete" && role === "marketing") return move(r.id, "Closed");
    setIntent({ id: r.id, move: m });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed bg-card/60 px-3 py-2 text-sm">
        <span className="kicker text-[10px] text-muted-foreground">Demo · Viewing as</span>
        <div className="flex h-8 rounded-lg border bg-card p-0.5" role="group" aria-label="Viewing as">
          {(["requester", "designer", "marketing"] as Role[]).map((x) => (
            <button key={x} type="button" onClick={() => setRole(x)} className={cn("rounded-md px-3 text-sm", role === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {ROLE_LABEL[x]}
            </button>
          ))}
        </div>
        {role === "requester" && (
          <Select value={viewerId} onChange={(e) => setViewerId(e.target.value)} className="h-8 w-60" aria-label="Signed in as">
            {PEOPLE.map((p) => {
              const n = flagsOf(state, p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                  {n ? ` · ${n} flag${n > 1 ? "s" : ""}` : ""}
                </option>
              );
            })}
          </Select>
        )}
        {role === "designer" && (
          <Select value={designerName} onChange={(e) => setDesignerName(e.target.value)} className="h-8 w-52" aria-label="Designer">
            {cfg.designers.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
        <span className="text-xs text-muted-foreground">
          {role === "requester" ? "Your own requests · New request, edit a returned one, revisions, accept" : role === "designer" ? "Only the work assigned to you · start it and deliver it" : "Every request · assign, return, approve urgent, form builder, settings"}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => (resetDemo(), resetSettings(), resetForms())} title="Clear every request and flag, and put the settings and forms back">
          <RotateCcw /> Reset demo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, requester or brief" className="pl-9" />
        </div>
        <Select value={order} onChange={(e) => setOrder(e.target.value as Order)} className="w-52" aria-label="Order">
          {Object.entries(ORDERS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => (setCalFocus(undefined), setDialog("calendar"))}>
          <CalendarDays /> Calendar
        </Button>
        <Button variant="outline" onClick={() => runTimers()} title="Check reply deadlines and reload">
          <RefreshCw /> Refresh
        </Button>
        <Button variant="outline" onClick={() => setDialog("columns")}>
          <Columns3 /> Columns
        </Button>
        {role === "marketing" && (
          <>
            <Button variant="outline" onClick={() => setDialog("forms")}>
              <ClipboardList /> Form builder
            </Button>
            <Button variant="outline" onClick={() => setDialog("settings")}>
              <Settings /> Settings
            </Button>
          </>
        )}
        {role === "requester" && (
          <Button className="ml-auto" onClick={() => setForm({})} disabled={paused} title={paused ? `Requests are paused at ${cfg.flagLimit} flags` : undefined}>
            <Plus /> New request
          </Button>
        )}
      </div>

      {howTo ? (
        <HowItWorks onHide={() => setHowTo(false)} />
      ) : (
        <button type="button" onClick={() => setHowTo(true)} className="text-xs text-muted-foreground hover:text-foreground">
          Show how it works
        </button>
      )}

      {sent && (
        <p className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
          {sent} sent. You’ll get an email at each step — it’s only scheduled once it shows <span className="font-normal">Confirmed</span>.
          <button type="button" onClick={() => setSent(null)} className="ml-2 text-muted-foreground underline-offset-4 hover:underline">
            Dismiss
          </button>
        </p>
      )}

      {role === "requester" && (flags.length > 0 || paused) && (
        <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", paused ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}>
          {paused ? <PauseCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Flag className="mt-0.5 size-4 shrink-0 text-warning" />}
          <div className="space-y-1">
            <p className="font-normal">{paused ? `Your requests are paused — ${flags.length} flags.` : `${flags.length} of ${cfg.flagLimit} flags on your profile.`}</p>
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
            <Ban className="size-4 text-destructive" /> Paused at {cfg.flagLimit} flags
          </p>
          {pausedPeople.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <span>{p.fullName}</span>
              <Button size="sm" variant="outline" onClick={() => reinstate(p.id)}>
                Reinstate (Marketing Director + Head of Department)
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        Booked
        {cfg.designers.map((d) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 text-foreground">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} /> {d.name} <span className="text-muted-foreground tabular-nums">{booked(d.name)}</span>
          </span>
        ))}
        {role === "requester" && <span>· Showing your requests, signed in as {viewer.name}</span>}
        {role === "designer" && <span>· Showing the work assigned to {designerName}</span>}
      </p>

      <div className="-mx-1 overflow-x-auto pb-3">
        <div className="flex min-w-max items-start gap-3 px-1">
          {COLUMNS.filter((c) => !hidden.includes(c.id) && !(role === "designer" && (c.id === "Submitted" || c.id === "Returned"))).map(({ id: c, color }) => {
            const list = visible.filter((r) => columnOf(r) === c);
            const limit = shown[c] ?? PAGE;
            const target = dragged ? moveTo(dragged, c, role) : null;
            return (
              <section
                key={c}
                onDragOver={(e) => {
                  if (!target) return;
                  e.preventDefault();
                  setOverCol(c);
                }}
                onDragLeave={() => setOverCol((o) => (o === c ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverCol(null);
                  setDragId(null);
                  if (dragged && target) act(dragged, target);
                }}
                className={cn(
                  "flex w-[290px] shrink-0 flex-col gap-2 rounded-xl p-1.5 transition-colors",
                  dragged && !target && columnOf(dragged) !== c && "opacity-40",
                  target && "bg-secondary/60 ring-1 ring-dashed",
                  overCol === c && "bg-secondary ring-2",
                )}
                style={target ? ({ "--tw-ring-color": color } as CSSProperties) : undefined}
              >
                <header className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white" style={{ background: color }}>
                  {c}
                  <span className="grid min-w-6 place-items-center rounded-full bg-white/25 px-1.5 text-xs tabular-nums">{list.length}</span>
                </header>
                {list.slice(0, limit).map((r) => (
                  <Card key={r.id} r={r} role={role} onOpen={() => setOpenId(r.id)} onDrag={setDragId} dragging={dragId === r.id} />
                ))}
                {list.length > limit && (
                  <Button variant="ghost" size="sm" onClick={() => setShown((s) => ({ ...s, [c]: limit + PAGE }))}>
                    Load more
                  </Button>
                )}
                {!list.length && <p className="py-8 text-center text-xs text-muted-foreground">{target ? "Drop here" : "Nothing here."}</p>}
              </section>
            );
          })}
        </div>
      </div>

      {current && !intent && (
        <RequestSheet
          key={current.id + current.status}
          r={current}
          role={role}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            setOpenId(null);
            setForm({ editId: current.id });
          }}
          onAct={(m) => act(current, m)}
          onCalendar={() => {
            setCalFocus(current.deadline);
            setOpenId(null);
            setDialog("calendar");
          }}
        />
      )}

      {acting && intent && intent.move !== "edit" && <ActionDialog r={acting} move={intent.move} viewerName={viewerName} onClose={() => setIntent(null)} />}

      {dialog === "calendar" && (
        <DesignCalendar
          requests={mine}
          focus={calFocus}
          onOpen={(id) => {
            setDialog(null);
            setOpenId(id);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === "columns" && (
        <Modal label="Board columns" onClose={() => setDialog(null)} className="mt-[8vh] max-w-[560px]">
          <div className="space-y-3 p-6">
            <div>
              <p className="text-base font-normal">Board columns</p>
              <p className="text-sm text-muted-foreground">The order here is the order on the board.</p>
            </div>
            <ul className="divide-y rounded-xl border">
              {COLUMNS.map(({ id: c, color }) => {
                const off = hidden.includes(c);
                return (
                  <li key={c} className={cn("flex items-center gap-3 px-4 py-2.5", off && "opacity-50")}>
                    <span className="size-3 rounded-full" style={{ background: color }} />
                    <span className="flex-1 text-sm">
                      {c}
                      <span className="block text-xs text-muted-foreground">
                        {visible.filter((r) => columnOf(r) === c).length} request{visible.filter((r) => columnOf(r) === c).length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">System</span>
                    <Button variant="ghost" size="icon" aria-label={off ? `Show ${c}` : `Hide ${c}`} onClick={() => setHidden((h) => (off ? h.filter((x) => x !== c) : [...h, c]))}>
                      {off ? <EyeOff /> : <Eye />}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
          <footer className="flex justify-end border-t px-6 py-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Done
            </Button>
          </footer>
        </Modal>
      )}

      {dialog === "settings" && <SettingsPanel current={cfg} onClose={() => setDialog(null)} />}
      {dialog === "forms" && <FormBuilder onClose={() => setDialog(null)} />}

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
