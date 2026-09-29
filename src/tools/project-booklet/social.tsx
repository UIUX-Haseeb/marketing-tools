"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * Social posts from the same project data, two designs each:
 *   · Single post A · Stacked — the photo across the top, the copy in one group at its foot: a
 *     glass card, the agent card, wordmark and QR (feed 4:5 or story 9:16). Refined in Figma.
 *   · Single post B · Split — the photo across the top, the copy centred in one group at its
 *     foot: name and figures, an agent card, wordmark and QR. Refined in Figma.
 *   · Carousel A · Navy — the Organic Post Studio's Carousel template (4:5 slides).
 *   · Carousel B · White — the same slides on white with the photos as bands and rounded panels
 *     (brochure design B), in Campaign's light inks.
 * Every photo sits in a frame marked `data-frame` (its slot): the editor's photo picker lists a
 * page's frames and the preview drag moves the photo inside the one under the pointer. Layout
 * numbers live in social.module.css with the studio each one comes from.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { ChartLine, Landmark, Mail, Smartphone, TrendingUp, type LucideIcon } from "lucide-react";
import s from "./social.module.css";
import { Fit } from "./fit";
import { amenityIcon, detailIcon } from "./icons";
import { Wordmark } from "./wordmark";
import type { BookletPage } from "./pages";
import type { Adjust, Adjusts, Agent, FrameInfo, ImageSlots, PostFormat, ProjectData, SlotKey, SocialDesign } from "./types";

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter(Boolean)
    .map((n) => s[n as string] ?? "")
    .join(" ");

export type SocialInput = { d: ProjectData; agent: Agent; slots: ImageSlots; adjust: Adjusts; qr: string | null; design: SocialDesign };

/* ── shared parts ────────────────────────────────────────────────────────── */

/**
 * A photo's zoom and position as CSS: object-position shows the chosen point, and scaling round
 * that same point keeps it in place — so x / y pan the zoomed photo as well, and it always
 * covers its frame.
 */
function framing(a: Adjust): CSSProperties {
  const at = `${(a.x * 100).toFixed(2)}% ${(a.y * 100).toFixed(2)}%`;
  return a.zoom > 1.001 ? { objectPosition: at, transform: `scale(${a.zoom})`, transformOrigin: at } : { objectPosition: at };
}

function Img({ src, adj }: { src: string; adj?: Adjust }) {
  if (!src) return <span className={s.empty}>No picture</span>;
  return <img src={src} alt="" decoding="async" draggable={false} style={adj ? framing(adj) : undefined} />;
}

/** A photo frame. The picker and the preview drag find it by `data-frame`. */
function Frame({ slot, className, input }: { slot: SlotKey; className: string; input: SocialInput }) {
  return (
    <div className={className} data-frame={slot}>
      <Img src={input.slots[slot]} adj={input.adjust[slot]} />
    </div>
  );
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
      )}
    </>
  );
}

function Qr({ qr, className }: { qr: string | null; className?: string }) {
  return (
    <div className={c(className ?? "qr", !qr && "qr-empty")}>
      {qr ? <img src={qr} alt="Permit QR" draggable={false} /> : <span>Permit QR</span>}
    </div>
  );
}

const detail = (d: ProjectData, re: RegExp) => d.details.find((p) => re.test(p.label))?.value ?? "";
const heroStat = (d: ProjectData, re: RegExp) => d.heroStats.find((p) => re.test(p.label))?.value ?? "";
const place = (d: ProjectData) => (d.location ? `${d.location} · ${d.city}` : d.city);
const startingPrice = (d: ProjectData) => heroStat(d, /price/i) || detail(d, /price/i);
const paymentPlan = (d: ProjectData) => heroStat(d, /payment/i) || detail(d, /payment/i);
const handover = (d: ProjectData) => heroStat(d, /handover|completion/i) || detail(d, /handover|completion/i);
const propertyTypes = (d: ProjectData) => detail(d, /type/i);
/* ══ SINGLE POST — both designs as refined in Figma (ProvToys-Templates · Single post) ═══
   A · Stacked: the photo across the top; at its foot one group on a navy gradient — a glass
   card (the location in brass, name, developer — beside the name on the feed — the figures and
   on the story the amenity chips), the agent card, then the wordmark and the QR.
   B · Split: the photo across the top again, the copy centred in one group at its foot on a
   navy gradient — the cream location tag, name, the developer in brass, the figures (+ chips
   on the story), the agent card, then the wordmark and the QR. Both designs share the agent card: headshot (134 on the feed, 170 on the
   story), the name with the BRN at the right, the designation, then phone and email. */

/** Starting price, property type and payment plan — A's feed puts the plan second. */
function Figures({ d, planSecond = false }: { d: ProjectData; planSecond?: boolean }) {
  const all = planSecond
    ? [["Starting price", startingPrice(d)], ["Payment plan", paymentPlan(d)], ["Property type", propertyTypes(d)]]
    : [["Starting price", startingPrice(d)], ["Property type", propertyTypes(d)], ["Payment plan", paymentPlan(d)]];
  const items = all.filter(([, v]) => v);
  if (!items.length) return null;
  return (
    <div className={s.specs}>
      {items.map(([l, v]) => (
        <div key={l} className={s.sc}>
          <div className={s.sl}>{l}</div>
          <Fit className={s.sv} watch={v} min={0.5} label={l}>
            {v}
          </Fit>
        </div>
      ))}
    </div>
  );
}

/** Up to four amenities as chips, shortest first so the rows pack evenly. */
function Chips({ d }: { d: ProjectData }) {
  const items = d.amenities.slice(0, 4).sort((a, b) => a.length - b.length);
  if (!items.length) return null;
  return (
    <div className={s.chips}>
      {items.map((a) => {
        const Icon = amenityIcon(a);
        return (
          <span key={a} className={s.chip}>
            <Icon strokeWidth={1.25} />
            {a}
          </span>
        );
      })}
    </div>
  );
}

/** Phone and email, each after its icon. */
function Contact({ agent }: { agent: Agent }) {
  return (
    <>
      {agent.mobile && (
        <div className={s.aline}>
          <Smartphone strokeWidth={1} />
          {agent.mobile}
        </div>
      )}
      {agent.email && (
        <div className={s.aline}>
          <Mail strokeWidth={1} />
          {agent.email}
        </div>
      )}
    </>
  );
}

/** The agent card, on both designs: headshot, the name with the BRN at the right, the designation, then phone and email. */
function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className={s.acard}>
      <div className={s.ashot}>{agent.photo && <img src={agent.photo} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />}</div>
      <div className={s.abody}>
        <div className={s.ahead}>
          {agent.name && <div className={s.an}>{agent.name}</div>}
          {agent.brn && <div className={s.brn}>BRN: {agent.brn}</div>}
        </div>
        {agent.position && <div className={s.ap}>{agent.position}</div>}
        <div className={s.acontact}>
          <Contact agent={agent} />
        </div>
      </div>
    </div>
  );
}

function StackedPost({ format, ...input }: SocialInput & { format: PostFormat }) {
  const { d, agent, qr } = input;
  const story = format === "story";
  return (
    <section className={c("post", story ? "story" : "feed", "stacked")}>
      <Frame slot="post" className={s.bg} input={input} />
      <div className={s.stack}>
        <div className={s.glassc}>
          <div className={s.titles}>
            <div className={s.loc}>{place(d)}</div>
            {/* the feed sets the developer beside the name, the story under it */}
            <div className={s.nrow}>
              <Fit className={s.pname} watch={d.name} lines={2} min={0.6} label="Project name">
                {d.name}
              </Fit>
              {d.developer && <div className={s.phook}>by {d.developer}</div>}
            </div>
          </div>
          <Figures d={d} planSecond={!story} />
          {story && <Chips d={d} />}
        </div>
        <AgentCard agent={agent} />
        <div className={s.foot}>
          <Wordmark className={s.wmi} />
          <Qr qr={qr} className="qrs" />
        </div>
      </div>
    </section>
  );
}

function SplitPost({ format, ...input }: SocialInput & { format: PostFormat }) {
  const { d, agent, qr } = input;
  const story = format === "story";
  return (
    <section className={c("post", story ? "story" : "feed", "split")}>
      <Frame slot="post" className={s.bg} input={input} />
      <div className={s.stack}>
        <div className={s.titles}>
          <div className={s.tag}>{place(d)}</div>
          <Fit className={s.pname} watch={d.name} lines={2} min={0.6} label="Project name">
            {d.name}
          </Fit>
          {d.developer && <div className={s.phook}>by {d.developer}</div>}
        </div>
        <Figures d={d} />
        {story && <Chips d={d} />}
        <AgentCard agent={agent} />
        <div className={s.foot}>
          <Wordmark className={s.wmi} />
          <Qr qr={qr} className="qrs" />
        </div>
      </div>
    </section>
  );
}

/* ══ CAROUSEL — Organic Post Studio (A · Navy) and its white edition (B) ══ */

function Chevron() {
  return (
    <svg viewBox="0 0 14 22" fill="none" aria-hidden>
      <path d="M1.5 1.5 12 11 1.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Material's filled check_circle, in brass — the Bullets page's mark. */
function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#b0905c" />
      <path d="m7.8 12.4 2.9 2.9 5.6-5.8" fill="none" stroke="#1a2942" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Swipe({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className={s.swipe}>
      Swipe
      <Chevron />
    </div>
  );
}

type SlideProps = SocialInput & { last: boolean; eyebrow: string };

/** One carousel page. `kinds` are social.module.css class names; `bg` puts a slot's photo full bleed behind it. */
function Slide({ kinds = [], bg, input, children, last }: { kinds?: (string | false)[]; bg?: SlotKey; input: SocialInput; children: ReactNode; last: boolean }) {
  return (
    <section className={c("post", "slide", ...kinds)}>
      {bg && <Frame slot={bg} className={s.bg} input={input} />}
      <div className={s.scrim} />
      {children}
      <Swipe on={!last} />
    </section>
  );
}

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className={s.ceye}>{eyebrow}</div>
      <Fit className={s.ctitle} watch={title} lines={2} min={0.7} label="Title">
        {title}
      </Fit>
    </>
  );
}

function StatGrid({ items }: { items: { icon: LucideIcon; value: string; label: string }[] }) {
  const single = items.length <= 3;
  return (
    <div className={s.grid} style={single ? { gridTemplateColumns: `repeat(${items.length}, ${items.length === 3 ? 300 : 402}px)` } : undefined}>
      {items.map((it, i) => (
        <div key={i} className={s.stat}>
          <it.icon strokeWidth={1} />
          <Fit className={s.sval} watch={it.value} min={0.5} label="Figure">
            {it.value}
          </Fit>
          <div className={s.slab}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function CoverSlide(p: SlideProps) {
  const { d, qr, last } = p;
  const figures = [
    { label: "Starting price", value: startingPrice(d) },
    { label: "Payment plan", value: paymentPlan(d) },
    { label: "Handover", value: handover(d) },
  ].filter((f) => f.value);
  const copy = (
    <>
      <Fit className={s.fname} watch={d.name} lines={2} min={0.5} label="Project name">
        {d.name}
      </Fit>
      <div className={s.fsub}>{[d.developer && `by ${d.developer}`, d.location].filter(Boolean).join(" · ")}</div>
      {figures.length > 0 && (
        <div className={s.frow}>
          {figures.map((f) => (
            <div key={f.label}>
              <div className={s.fval}>{f.value}</div>
              <div className={s.flab}>{f.label}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
  if (p.design === "b") {
    return (
      <Slide kinds={["white", "wfront"]} input={p} last={last}>
        <Frame slot="post" className={s.band} input={p} />
        <Wordmark className={s.wm} />
        <div className={s.wpanel}>{copy}</div>
        <Qr qr={qr} />
      </Slide>
    );
  }
  return (
    <Slide kinds={["front"]} bg="post" input={p} last={last}>
      <Wordmark className={s.wm} />
      <div className={c("col", "bot")}>{copy}</div>
      <Qr qr={qr} />
    </Slide>
  );
}

function TextSlide({ p, slot, title, paras, label }: { p: SlideProps; slot: SlotKey; title: string; paras: string[]; label: string }) {
  const body = (
    <Fit className={c("cbody", "tbox", "fit")} watch={paras} label={label} min={p.design === "b" ? 0.75 : undefined}>
      {paras.map((x, i) => (
        <p key={i}>
          <Rich text={x} />
        </p>
      ))}
    </Fit>
  );
  if (p.design === "b") {
    return (
      <Slide kinds={["white", "wtext"]} input={p} last={p.last}>
        <div className={s.wtop}>
          <Head eyebrow={p.eyebrow} title={title} />
          {body}
        </div>
        <Frame slot={slot} className={s.inset} input={p} />
      </Slide>
    );
  }
  const long = paras.join(" ").length > 520;
  return (
    <Slide kinds={["topwash", long && "long"]} bg={slot} input={p} last={p.last}>
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title={title} />
        {body}
      </div>
    </Slide>
  );
}

const statsOf = (d: ProjectData, wanted: RegExp[]) =>
  wanted
    .map((re) => d.details.find((x) => re.test(x.label)))
    .filter((x): x is { label: string; value: string } => !!x && !!x.value)
    .map((x) => ({ icon: detailIcon(x.label), value: x.value, label: x.label }));

function DetailsSlide(p: SlideProps) {
  const items = statsOf(p.d, [/price/i, /payment/i, /type/i, /handover|completion/i, /size|sq/i, /bed/i]);
  const b = p.design === "b";
  return (
    <Slide kinds={b ? ["white"] : ["statwash"]} bg={b ? undefined : "details"} input={p} last={p.last}>
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title="Project Details" />
      </div>
      <StatGrid items={items} />
    </Slide>
  );
}

const GALLERY: SlotKey[] = ["gallery1", "gallery2", "gallery3", "gallery4"];

function GallerySlide(p: SlideProps) {
  return (
    <Slide kinds={[p.design === "b" ? "white" : "navy"]} input={p} last={p.last}>
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title="Gallery" />
      </div>
      <div className={s.mosaic}>
        {GALLERY.map((slot) => (
          <Frame key={slot} slot={slot} className={s.pic} input={p} />
        ))}
      </div>
    </Slide>
  );
}

function BulletSlide({ p, title, rows }: { p: SlideProps; title: string; rows: string[] }) {
  const b = p.design === "b";
  return (
    <Slide kinds={b ? ["white", "wam"] : ["botwash"]} bg={b ? undefined : "amenities"} input={p} last={p.last}>
      {b && <Frame slot="amenities" className={s.inset} input={p} />}
      <div className={s.bhead}>
        <Head eyebrow={p.eyebrow} title={title} />
      </div>
      <div className={s.blist}>
        {rows.map((r, i) => (
          <div key={i} className={s.brow}>
            <Check />
            <span>{r}</span>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function PaymentSlide(p: SlideProps) {
  const { d } = p;
  const ms = d.payment.slice(0, 4);
  const shares = ms.map((m) => parseFloat(m.share) || 0);
  const total = shares.reduce((a, b) => a + b, 0);
  const bar = total > 0 ? shares.map((v) => `${Math.max(v, 3)}fr`).join(" ") : `repeat(${ms.length}, 1fr)`;
  const cols = ms.length === 2 && total > 0 && Math.min(...shares) >= 25 ? bar : `repeat(${ms.length}, 1fr)`;
  return (
    <Slide kinds={[p.design === "b" ? "white" : "navy"]} input={p} last={p.last}>
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title="Payment Plan" />
      </div>
      <div className={s.pbar} style={{ gridTemplateColumns: bar }}>
        {ms.map((_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className={c("pcols", ms.length >= 3 && `n${ms.length}`)} style={{ gridTemplateColumns: cols }}>
        {ms.map((m, i) => (
          <div key={i}>
            <div className={s.pn}>{String(i + 1).padStart(2, "0")}</div>
            <div className={s.ppct}>{m.share || "—"}</div>
            <div className={s.plab}>{m.label}</div>
            {m.amount && <div className={s.pamt}>{m.amount}</div>}
          </div>
        ))}
      </div>
      {d.paymentNote && <p className={s.pnote}>{d.paymentNote}</p>}
    </Slide>
  );
}

function TypeSlide(p: SlideProps) {
  const items = statsOf(p.d, [/type/i, /bed/i, /size|sq/i]);
  const b = p.design === "b";
  return (
    <Slide kinds={b ? ["white", "wtype"] : ["statwash"]} bg={b ? undefined : "type"} input={p} last={p.last}>
      {b && <Frame slot="type" className={s.band} input={p} />}
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title="Property Type" />
      </div>
      <StatGrid items={items} />
    </Slide>
  );
}

function LocationSlide(p: SlideProps) {
  const { d } = p;
  const ds = d.distances.slice(0, 5);
  return (
    <Slide kinds={[p.design === "b" ? "white" : "navy"]} input={p} last={p.last}>
      <div className={s.mapband}>
        <Img src={d.mapImage} />
      </div>
      <div className={c("col", "locttl")}>
        <Head eyebrow={p.eyebrow} title="Location & Connectivity" />
        {!ds.length && (
          <Fit className={c("cbody", "fit")} style={{ maxHeight: 420 }} watch={d.locationText} label="Location text">
            {d.locationText.map((x, i) => (
              <p key={i}>
                <Rich text={x} />
              </p>
            ))}
          </Fit>
        )}
      </div>
      {ds.length > 0 && (
        <div className={s.dlist}>
          {ds.map((x, i) => (
            <div key={i} className={s.drow}>
              <span className={s.dtime}>{x.time} min</span>
              <span className={s.dplace}>{x.place}</span>
            </div>
          ))}
        </div>
      )}
    </Slide>
  );
}

const INVEST_ICONS: LucideIcon[] = [TrendingUp, ChartLine, Landmark];

function InvestmentSlide(p: SlideProps) {
  const { d } = p;
  const items = d.investmentStats.slice(0, 3).map((st, i) => ({ icon: INVEST_ICONS[i] ?? TrendingUp, value: st.value, label: st.label }));
  return (
    <Slide kinds={[p.design === "b" ? "white" : "navy"]} input={p} last={p.last}>
      <div className={c("col", "top")}>
        <Head eyebrow={p.eyebrow} title="Investment Potential" />
        {d.investmentIntro && (
          <Fit className={c("cbody", "fit")} style={{ maxHeight: 300 }} watch={d.investmentIntro} label="Investment intro">
            <p>{d.investmentIntro}</p>
          </Fit>
        )}
      </div>
      <StatGrid items={items} />
    </Slide>
  );
}

function DevLogo({ src }: { src: string }) {
  const [crop, setCrop] = useState(false);
  return (
    <div className={c("dlogo", crop && "crop")}>
      <img
        src={src}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const r = e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1);
          setCrop(r > 1.05 && r < 1.25);
        }}
      />
    </div>
  );
}

function DeveloperSlide(p: SlideProps) {
  const { d } = p;
  return (
    <Slide kinds={[p.design === "b" ? "white" : "navy"]} input={p} last={p.last}>
      <div className={c("col", "top")}>
        {d.developerLogo && <DevLogo src={d.developerLogo} />}
        <Head eyebrow="About the developer" title={d.developer} />
        {d.developerText && (
          <Fit className={c("cbody", "dtbox", "fit")} watch={d.developerText} label="Developer text">
            <p>{d.developerText}</p>
          </Fit>
        )}
      </div>
      {d.developerImage && (
        <div className={c("pic", "dpic")}>
          <Img src={d.developerImage} />
        </div>
      )}
    </Slide>
  );
}

function AgentSlide(p: SlideProps) {
  const { agent, qr } = p;
  return (
    <Slide kinds={p.design === "b" ? ["white", "wagent"] : []} bg="agent" input={p} last={p.last}>
      <div className={s.card}>
        <div className={s.crule} />
        <div className={s.cshot}>{agent.photo && <img src={agent.photo} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />}</div>
        <div className={s.cname}>{agent.name}</div>
        {agent.position && <div className={s.cpos}>{agent.position}</div>}
        <div className={s.clines}>
          {agent.mobile && (
            <div>
              <Smartphone strokeWidth={1} />
              {agent.mobile}
            </div>
          )}
          {agent.email && (
            <div>
              <Mail strokeWidth={1} />
              {agent.email}
            </div>
          )}
          {agent.brn && (
            <div>
              <b>BRN</b>
              {agent.brn}
            </div>
          )}
        </div>
        <Qr qr={qr} className="cqr" />
        <Wordmark className={s.cwm} />
      </div>
    </Slide>
  );
}

/* ── builders ────────────────────────────────────────────────────────────── */

export function buildSingle(format: PostFormat, input: SocialInput): { pages: BookletPage[]; notes: string[] } {
  const { d } = input;
  const notes: string[] = [];
  if (format === "story" && d.amenities.length > 4) notes.push(`Story: showing 4 of ${d.amenities.length} amenities.`);
  if (!startingPrice(d)) notes.push("No starting price on this project’s page.");
  const Post = input.design === "b" ? SplitPost : StackedPost;
  return {
    pages: [
      {
        key: format,
        name: format === "story" ? "Story · 9:16" : "Feed · 4:5",
        node: <Post {...input} format={format} />,
        w: 1080,
        h: format === "story" ? 1920 : 1350,
        frames: [{ key: "post", label: "Post photo" }],
      },
    ],
    notes,
  };
}

type Entry = { key: string; name: string; include: boolean; frames: FrameInfo[]; render: (p: SlideProps) => ReactNode };

export function buildCarousel(input: SocialInput): { pages: BookletPage[]; notes: string[] } {
  const { d } = input;
  const b = input.design === "b";
  const eyebrow = d.name;
  const hasDev = !!(d.developerText || d.developerLogo);
  const photo = (key: SlotKey, label = "Photo"): FrameInfo[] => [{ key, label }];
  const entries: Entry[] = [
    { key: "cover", name: "Cover", include: true, frames: photo("post", "Cover photo"), render: (p) => <CoverSlide {...p} /> },
    { key: "overview", name: "Project Overview", include: d.overview.length > 0, frames: photo("overview"), render: (p) => <TextSlide p={p} slot="overview" title="Project Overview" paras={d.overview} label="Overview" /> },
    { key: "details", name: "Project Details", include: d.details.length > 0, frames: b ? [] : photo("details", "Background photo"), render: (p) => <DetailsSlide {...p} /> },
    { key: "gallery", name: "Gallery", include: d.gallery.length > 0, frames: GALLERY.map((key, i) => ({ key, label: `Picture ${i + 1}` })), render: (p) => <GallerySlide {...p} /> },
    { key: "amenities", name: "Amenities", include: d.amenities.length > 0, frames: photo("amenities"), render: (p) => <BulletSlide p={p} title="Amenities" rows={d.amenities.slice(0, 6)} /> },
    { key: "payment", name: "Payment Plan", include: d.payment.length > 0, frames: [], render: (p) => <PaymentSlide {...p} /> },
    { key: "type", name: "Property Type", include: !!propertyTypes(d), frames: photo("type"), render: (p) => <TypeSlide {...p} /> },
    { key: "location", name: "Location & Connectivity", include: d.distances.length > 0 || d.locationText.length > 0, frames: [], render: (p) => <LocationSlide {...p} /> },
    { key: "investment", name: "Investment", include: d.investmentStats.length > 0, frames: [], render: (p) => <InvestmentSlide {...p} /> },
    { key: "developer", name: "Developer", include: hasDev, frames: [], render: (p) => <DeveloperSlide {...p} /> },
    { key: "agent", name: "Agent Contact", include: true, frames: photo("agent", "Background photo"), render: (p) => <AgentSlide {...p} /> },
  ];
  const notes: string[] = [];
  for (const e of entries) if (!e.include) notes.push(`${e.name}: not on this project’s page, so that slide is left out.`);
  if (d.amenities.length > 6) notes.push(`Amenities: showing 6 of ${d.amenities.length}.`);
  if (d.distances.length > 5) notes.push(`Location: showing 5 of ${d.distances.length} distances.`);
  const included = entries.filter((e) => e.include);
  const pages = included.map((e, i) => ({
    key: e.key,
    name: e.name,
    node: e.render({ ...input, last: i === included.length - 1, eyebrow }),
    w: 1080,
    h: 1350,
    frames: e.frames,
  }));
  return { pages, notes };
}
