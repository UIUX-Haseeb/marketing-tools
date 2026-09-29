"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The booklet pages, both designs. Each page is a fixed 1080 × 1350 canvas drawn with HTML/CSS
 * (booklet.module.css); `buildBooklet()` decides which pages a project gets — a page whose section
 * is missing on the site is left out — numbers them, and returns layout notes for the editor
 * (e.g. "showing 5 of 7 distances").
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { CircleCheck, Globe, IdCard, Mail, Smartphone } from "lucide-react";
import s from "./booklet.module.css";
import { Fit } from "./fit";
import { amenityIcon, detailIcon } from "./icons";
import { Wordmark } from "./wordmark";
import type { Agent, Design, FrameInfo, ImageSlots, ProjectData } from "./types";

/** Module class names by their CSS name: c("page", "dark", "p-cover"). */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter(Boolean)
    .map((n) => s[n as string] ?? "")
    .join(" ");

const BRIDGE = "url(/tools/project-booklet/closing-bridge.jpg)";
const FOOTER = "Provident Estate · Project Profile";
const pad = (i: number) => String(i).padStart(2, "0");

/** How many items each design has room for. */
const LIMITS: Record<Design, { highlights: number; amenities: number; distances: number }> = {
  a: { highlights: 10, amenities: 12, distances: 5 },
  b: { highlights: 8, amenities: 10, distances: 6 },
};

export type BookletInput = { d: ProjectData; agent: Agent; slots: ImageSlots; qr: string | null };
/** A finished page: its artwork and its canvas size (the brochure is always 1080 × 1350). */
export type BookletPage = { key: string; name: string; node: ReactNode; w: number; h: number; frames?: FrameInfo[] };
type PageProps = BookletInput & { n: string; kicker: string };

/* ── shared parts ────────────────────────────────────────────────────────── */

function Img({ src, style }: { src: string; style?: CSSProperties }) {
  if (!src) return <span className={s.empty}>No picture</span>;
  return <img src={src} alt="" style={style} decoding="async" draggable={false} />;
}

/** `**text**` → bold (the phrases the site highlights). */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
      )}
    </>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div className={s.kicker}>{kicker}</div>
      <div className={s.rule} />
      <h2 className={s.h}>{title}</h2>
    </>
  );
}

function Foot({ n }: { n: string }) {
  return (
    <div className={s.foot}>
      <span>{FOOTER}</span>
      <span>{n}</span>
    </div>
  );
}

const place = (d: ProjectData) => (d.location ? `${d.location} · ${d.city}` : d.city);

function CoverStats({ d }: { d: ProjectData }) {
  const stats = d.heroStats.slice(0, 3);
  if (!stats.length) return null;
  return (
    <div className={s["cover-stats"]} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map((st, i) => (
        <div key={i}>
          <div className={s.label}>{st.label}</div>
          <div className={s.v}>{st.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Developer logos on the site are exported in a padded 152×133 box — crop to the mark when so. */
function DevLogo({ src }: { src: string }) {
  const [crop, setCrop] = useState(false);
  return (
    <div className={c("logo", crop && "crop")}>
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

/** Design A puts the text left and the photo right; design B the other way round. */
function Developer({ d, devOnly, photoFirst }: { d: ProjectData; devOnly: boolean; photoFirst: boolean }) {
  const photo = d.developerImage && (
    <div className={s.pic}>
      <Img src={d.developerImage} />
    </div>
  );
  return (
    <div className={c("m", "dev")}>
      {!devOnly && (
        <>
          <div className={s.kicker}>About the Developer</div>
          <div className={s.rule} />
        </>
      )}
      <div className={s["dev-row"]} style={d.developerImage ? undefined : { gridTemplateColumns: "1fr" }}>
        {photoFirst && photo}
        <div>
          {d.developerLogo && <DevLogo src={d.developerLogo} />}
          <h3>{d.developer}</h3>
          {d.developerText && (
            <Fit className={c("devp", "fit")} watch={d.developerText} label="Developer text">
              <p>{d.developerText}</p>
            </Fit>
          )}
        </div>
        {!photoFirst && photo}
      </div>
    </div>
  );
}

function Payment({ d, inCard }: { d: ProjectData; inCard?: boolean }) {
  const ms = d.payment.slice(0, 4);
  const shares = ms.map((m) => parseFloat(m.share) || 0);
  const total = shares.reduce((a, b) => a + b, 0);
  const bar = total > 0 ? shares.map((v) => `${Math.max(v, 3)}fr`).join(" ") : `repeat(${ms.length}, 1fr)`;
  // 70/30-style plans line the figures up with the bar; three or more steps (or a tiny step) share equal columns.
  const cols = ms.length === 2 && total > 0 && Math.min(...shares) >= 25 ? bar : `repeat(${ms.length}, 1fr)`;
  return (
    <>
      <div className={c(!inCard && "m", "bar")} style={{ gridTemplateColumns: bar }}>
        {ms.map((_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className={c(!inCard && "m", "pp", ms.length >= 3 && `n${ms.length}`)} style={{ gridTemplateColumns: cols }}>
        {ms.map((m, i) => (
          <div key={i}>
            <div className={s.n}>{pad(i + 1)}</div>
            <div className={s.pct}>{m.share || "—"}</div>
            <div className={s.label}>{m.label}</div>
            {m.amount && <div className={s.amt}>{m.amount}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function AgentShot({ agent }: { agent: Agent }) {
  return <div className={s.shot}>{agent.photo && <img src={agent.photo} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />}</div>;
}

/** The project's permit QR (Dubai: the DLD permit) on its white plate. Empty until uploaded (downloads wait for it). */
function Qr({ qr }: { qr: string | null }) {
  return <div className={c("qr", !qr && "qr-empty")}>{qr ? <img src={qr} alt="Permit QR" draggable={false} /> : <span>Permit QR</span>}</div>;
}

function AgentWho({ agent }: { agent: Agent }) {
  return (
    <div>
      <div className={s.nm}>{agent.name}</div>
      {agent.position && <div className={s.pos}>{agent.position}</div>}
      <div className={s.cl}>
        {agent.mobile && (
          <div>
            <Smartphone className={s.ico} strokeWidth={1} />
            <span>{agent.mobile}</span>
          </div>
        )}
        {agent.email && (
          <div>
            <Mail className={s.ico} strokeWidth={1} />
            <span>{agent.email}</span>
          </div>
        )}
        {agent.brn && (
          <div>
            <IdCard className={s.ico} strokeWidth={1} />
            <span>
              <b>BRN</b> {agent.brn}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Company block from the company profile's back page. */
function Company() {
  return (
    <>
      <div className={c("m", "cc")}>
        <div>
          <Smartphone className={s.ico} strokeWidth={1} />
          <span>800ESTATE</span>
        </div>
        <div>
          <Mail className={s.ico} strokeWidth={1} />
          <span>info@providentestate.com</span>
        </div>
        <div>
          <Globe className={s.ico} strokeWidth={1} />
          <span>www.providentestate.com</span>
        </div>
      </div>
      <div className={c("m", "legal")}>
        <div className={s.row}>
          <span>Provident Real Estate Broker L.L.C</span>
          <span>Beyond transactions — building lasting relationships</span>
        </div>
        <p>Dubai Marina · Media City · Palm Jumeirah · Dubai Hills Estate · Dubai World Trade Centre</p>
      </div>
    </>
  );
}

function Message() {
  return (
    <div className={c("m", "msg")}>
      <div className={s.kicker}>Start the Conversation</div>
      <div className={s.rule} />
      <h2 className={s.h}>
        Whatever the decision,
        <br />
        we will guide you through it.
      </h2>
      <div className={s.body}>
        <p>Whether you’re buying, selling, or investing, our team is here to guide you every step of the way. Contact us today.</p>
      </div>
    </div>
  );
}

const hasDeveloper = (d: ProjectData) => !!(d.developerText || d.developerLogo || d.developerImage);
const isLong = (paras: string[]) => paras.join(" ").length > 760;

/* ══ OPTION A · paper & navy ═════════════════════════════════════════════ */

function CoverA({ d, slots }: PageProps) {
  return (
    <section className={c("page", "dark", "p-cover")}>
      <div className={s.ph}>
        <Img src={slots.cover} />
      </div>
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={s.meta}>{place(d)}</span>
      </div>
      <div className={c("m", "blk")}>
        <div className={s.kicker}>Project Profile</div>
        <div className={s.rule} />
        <Fit className={s["cover-title"]} watch={d.name} min={0.4} lines={2} label="Project name">
          {d.name}
        </Fit>
        {d.developer && <p className={s["cover-by"]}>by {d.developer}</p>}
        <CoverStats d={d} />
      </div>
    </section>
  );
}

function OverviewA({ d, slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "p-ov", isLong(d.overview) && "long")}>
      <div className={s.ph}>
        <Img src={slots.overview} />
      </div>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Overview." />
        <Fit className={c("body", "fit")} watch={d.overview} label="Overview">
          {d.overview.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Fit>
      </div>
      <Foot n={n} />
    </section>
  );
}

function HighlightsA({ d, n, kicker }: PageProps) {
  const items = d.highlights.slice(0, LIMITS.a.highlights);
  return (
    <section className={c("page", "dark", "p-hl")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Highlights." />
      </div>
      <Fit className={c("m", "hl", "fit")} watch={items} label="Highlights">
        <ol>
          {items.map((h, i) => (
            <li key={i}>
              <span className={s.n}>{pad(i + 1)}</span>
              <div>
                <h3>{h.title || h.text}</h3>
                {h.title && h.text && <p>{h.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Fit>
      <Foot n={n} />
    </section>
  );
}

function DetailsA({ d, n, kicker }: PageProps) {
  return (
    <section className={c("page", "p-dt")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Details." />
      </div>
      <div className={c("m", "dt")}>
        {d.details.slice(0, 8).map((p, i) => {
          const Icon = detailIcon(p.label);
          const len = p.value.length;
          return (
            <div key={i} className={s.c}>
              <Icon className={s.ico} strokeWidth={1} />
              <div className={c("v", len > 24 ? "xlong" : len > 16 && "long")}>{p.value}</div>
              <div className={s.label}>{p.label}</div>
            </div>
          );
        })}
      </div>
      <Foot n={n} />
    </section>
  );
}

function GalleryA({ slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "dark", "p-ga")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Gallery." />
      </div>
      <div className={c("m", "gal")}>
        <div className={c("pic", "a")}>
          <Img src={slots.gallery1} />
        </div>
        {[slots.gallery2, slots.gallery3, slots.gallery4, slots.gallery5].map((src, i) => (
          <div key={i} className={s.pic}>
            <Img src={src} />
          </div>
        ))}
      </div>
      <Foot n={n} />
    </section>
  );
}

function AmenitiesA({ d, slots, n, kicker }: PageProps) {
  const items = d.amenities.slice(0, LIMITS.a.amenities);
  const many = items.length > 6;
  const xmany = items.length > 9;
  return (
    <section className={c("page", "p-am", many && "many", xmany && "xmany")}>
      <div className={s.ph}>
        <Img src={slots.amenities} />
      </div>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Amenities." />
        {d.amenitiesIntro && (
          <div className={s.body}>
            <p>{d.amenitiesIntro}</p>
          </div>
        )}
      </div>
      <div className={c("m", "am")}>
        {items.map((a, i) => {
          const Icon = amenityIcon(a);
          return (
            <div key={i} className={s.c}>
              <Icon className={s.ico} strokeWidth={1} />
              <div className={s.nm}>{a}</div>
            </div>
          );
        })}
      </div>
      <Foot n={n} />
    </section>
  );
}

function PaymentA({ d, slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "dark", "p-pp")}>
      <div className={s.ph}>
        <Img src={slots.payment} />
      </div>
      <div className={s.shade} />
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Payment Plan." />
      </div>
      <Payment d={d} />
      {d.paymentNote && <p className={c("m", "note")}>{d.paymentNote}</p>}
      <Foot n={n} />
    </section>
  );
}

function LocationA({ d, n, kicker }: PageProps) {
  const ds = d.distances.slice(0, LIMITS.a.distances);
  return (
    <section className={c("page", "p-lo", !ds.length && "nodist")}>
      <div className={c("ph", "map")}>
        <Img src={d.mapImage} />
      </div>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Location & Connectivity." />
        <Fit className={c("body", "fit")} watch={d.locationText} label="Location">
          {d.locationText.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Fit>
      </div>
      {ds.length > 0 && (
        <div className={c("m", "dist")} style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {ds.map((x, i) => (
            <div key={i}>
              <div className={s.t}>{x.time}</div>
              <div className={s.label}>Minutes</div>
              <div className={s.d}>{x.place}</div>
            </div>
          ))}
        </div>
      )}
      <Foot n={n} />
    </section>
  );
}

function InvestmentA({ d, n, kicker }: PageProps) {
  const stats = d.investmentStats.slice(0, 3);
  const mc = d.marketContext.slice(0, 4);
  return (
    <section className={c("page", "dark", "p-in")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Investment Potential." />
        {d.investmentIntro && (
          <Fit className={c("body", "fit")} watch={d.investmentIntro} label="Investment intro">
            <p>{d.investmentIntro}</p>
          </Fit>
        )}
      </div>
      {stats.length > 0 && (
        <div className={c("m", "stats")} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((st, i) => (
            <div key={i}>
              <div className={s.v}>{st.value}</div>
              <div className={s.label}>{st.label}</div>
            </div>
          ))}
        </div>
      )}
      {mc.length > 0 && (
        <div className={c("m", "mc")}>
          <h3>{d.marketTitle || "Market Context"}</h3>
          <Fit className={c("mclist", "fit")} watch={mc} label="Market context">
            <ul>
              {mc.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </Fit>
        </div>
      )}
      <Foot n={n} />
    </section>
  );
}

function FinancingA({ d, n, kicker }: PageProps) {
  const fin = d.financing.slice(0, 6);
  const devOnly = fin.length === 0;
  return (
    <section className={c("page", "p-fd", devOnly && "devonly")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title={devOnly ? "About the Developer." : "Flexible Financing Options."} />
      </div>
      {fin.length > 0 && (
        <div className={c("m", "fin")}>
          {fin.map((f, i) => (
            <div key={i} className={s.c}>
              <CircleCheck className={s.ico} strokeWidth={1} />
              {f}
            </div>
          ))}
        </div>
      )}
      {hasDeveloper(d) && <Developer d={d} devOnly={devOnly} photoFirst={false} />}
      <Foot n={n} />
    </section>
  );
}

function ClosingA({ agent, qr }: PageProps) {
  return (
    <section className={c("page", "dark", "a-last")}>
      <div className={c("ph", "bridge")} style={{ backgroundImage: BRIDGE }} />
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={c("meta", "gold")}>Let’s Connect</span>
      </div>
      <Message />
      <div className={c("m", "agent")}>
        <AgentWho agent={agent} />
        <AgentShot agent={agent} />
        <Qr qr={qr} />
      </div>
      <Company />
    </section>
  );
}

/* ══ OPTION B · white, chaptered flow ════════════════════════════════════ */

function CoverB({ d, slots }: PageProps) {
  return (
    <section className={c("page", "w", "b-cover")}>
      <div className={s.ph}>
        <Img src={slots.cover} />
      </div>
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={s.meta}>{place(d)}</span>
      </div>
      <div className={c("m", "blk")}>
        <div className={s.kicker}>Project Profile</div>
        <div className={s.rule} />
        <div className={c("tr", d.name.length > 9 && "stack")}>
          {/* One line on B: the title sits on the white panel and mustn't climb into the photo. */}
          <Fit className={s["cover-title"]} watch={d.name} min={0.4} lines={1} label="Project name">
            {d.name}
          </Fit>
          {d.developer && <p className={s["cover-by"]}>by {d.developer}</p>}
        </div>
        <CoverStats d={d} />
      </div>
    </section>
  );
}

function OverviewB({ d, slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "w", "b-ov", isLong(d.overview) && "long")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Overview." />
        <Fit className={c("body", "fit")} watch={d.overview} label="Overview">
          {d.overview.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Fit>
      </div>
      <div className={s.pic}>
        <Img src={slots.overview} />
      </div>
      <Foot n={n} />
    </section>
  );
}

function HighlightsB({ d, n, kicker }: PageProps) {
  const items = d.highlights.slice(0, LIMITS.b.highlights);
  return (
    <section className={c("page", "w", "b-hl")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Highlights." />
      </div>
      <Fit className={c("m", "hl6", "fit")} watch={items} label="Highlights">
        {items.map((h, i) => (
          <div key={i} className={s.c}>
            <div className={s.n}>{pad(i + 1)}</div>
            <h3>{h.title || h.text}</h3>
            {h.title && h.text && <p>{h.text}</p>}
          </div>
        ))}
      </Fit>
      <Foot n={n} />
    </section>
  );
}

function DetailsB({ d, n, kicker }: PageProps) {
  const heroAt = Math.max(0, d.details.findIndex((p) => /price/i.test(p.label)));
  const hero = d.details[heroAt];
  const rest = d.details.filter((_, i) => i !== heroAt).slice(0, 7);
  return (
    <section className={c("page", "dark", "b-dt")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Project Details." />
      </div>
      {hero && (
        <div className={c("m", "hero")}>
          <div className={s.label}>{hero.label}</div>
          <div className={s.v}>{hero.value}</div>
        </div>
      )}
      <div className={c("m", "spec")}>
        {rest.map((p, i) => (
          <div key={i} className={s.r}>
            <span className={s.k}>{p.label}</span>
            <span className={s.v}>{p.value}</span>
          </div>
        ))}
      </div>
      <Foot n={n} />
    </section>
  );
}

function GalleryB({ slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "dark", "b-ga")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Gallery." />
      </div>
      <div className={s.fb}>
        <div className={c("pic", "a")}>
          <Img src={slots.gallery1} />
        </div>
        {[slots.gallery2, slots.gallery3, slots.gallery4, slots.gallery5].map((src, i) => (
          <div key={i} className={s.pic}>
            <Img src={src} />
          </div>
        ))}
      </div>
      <Foot n={n} />
    </section>
  );
}

function AmenitiesB({ d, slots, n, kicker }: PageProps) {
  const items = d.amenities.slice(0, LIMITS.b.amenities);
  const rowH = Math.min(118, Math.floor(708 / Math.max(items.length, 1)));
  return (
    <section className={c("page", "w", "b-am")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Amenities." />
        {d.amenitiesIntro && (
          <div className={s.body}>
            <p>{d.amenitiesIntro}</p>
          </div>
        )}
      </div>
      <div className={c("m", "am-list", items.length > 6 && "dense")}>
        {items.map((a, i) => {
          const Icon = amenityIcon(a);
          return (
            <div key={i} className={s.r} style={{ height: rowH }}>
              <Icon className={s.ico} strokeWidth={1} />
              <span className={s.nm}>{a}</span>
            </div>
          );
        })}
      </div>
      <div className={c("m", "am-pics")}>
        <div className={s.pic} style={{ height: Math.max(354, items.length * rowH) }}>
          <Img src={slots.amenities} />
        </div>
      </div>
      <Foot n={n} />
    </section>
  );
}

function PaymentB({ d, slots, n, kicker }: PageProps) {
  return (
    <section className={c("page", "w", "b-pp")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Payment Plan." />
      </div>
      <div className={c("m", "pcard")}>
        <Payment d={d} inCard />
      </div>
      {d.paymentNote && <p className={c("m", "note")}>{d.paymentNote}</p>}
      <div className={c("pic", "band")}>
        <Img src={slots.payment} />
      </div>
      <Foot n={n} />
    </section>
  );
}

function LocationB({ d, n, kicker }: PageProps) {
  const ds = d.distances.slice(0, LIMITS.b.distances);
  return (
    <section className={c("page", "dark", "b-lo", !ds.length && "nodist")}>
      <div className={c("ph", "map")}>
        <Img src={d.mapImage} />
      </div>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Location & Connectivity." />
      </div>
      <div className={c("m", "cols")}>
        <Fit className={c("body", "fit")} watch={d.locationText} label="Location">
          {d.locationText.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Fit>
        {ds.length > 0 && (
          <div className={s.dlist}>
            {ds.map((x, i) => (
              <div key={i} className={s.r}>
                <span className={s.t}>{x.time}</span>
                <div>
                  <div className={s.label}>Minutes</div>
                  <div className={s.d}>{x.place}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Foot n={n} />
    </section>
  );
}

function InvestmentB({ d, slots, n, kicker }: PageProps) {
  const stats = d.investmentStats.slice(0, 3);
  const mc = d.marketContext.slice(0, 4);
  return (
    <section className={c("page", "w", "b-in")}>
      <div className={s.ph}>
        <Img src={slots.strip} />
      </div>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title="Investment Potential." />
        {d.investmentIntro && (
          <Fit className={c("body", "fit")} watch={d.investmentIntro} label="Investment intro">
            <p>{d.investmentIntro}</p>
          </Fit>
        )}
      </div>
      {stats.length > 0 && (
        <div className={s.nband}>
          <div className={s.stats} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map((st, i) => (
              <div key={i}>
                <div className={s.v}>{st.value}</div>
                <div className={s.label}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {mc.length > 0 && (
        <div className={c("m", "mc2")}>
          <h3>{d.marketTitle || "Market Context"}</h3>
          <Fit className={c("mclist", "fit")} watch={mc} label="Market context">
            <ul>
              {mc.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </Fit>
        </div>
      )}
      <Foot n={n} />
    </section>
  );
}

function FinancingB({ d, n, kicker }: PageProps) {
  const fin = d.financing.slice(0, 6);
  const devOnly = fin.length === 0;
  return (
    <section className={c("page", "w", "b-fd", devOnly && "devonly")}>
      <div className={c("m", "txt")}>
        <Head kicker={kicker} title={devOnly ? "About the Developer." : "Flexible Financing Options."} />
      </div>
      {fin.length > 0 && (
        <div className={c("m", "fin3")}>
          {fin.map((f, i) => (
            <div key={i} className={s.c}>
              <CircleCheck className={s.ico} strokeWidth={1} />
              <div className={s.nm}>{f}</div>
            </div>
          ))}
        </div>
      )}
      {hasDeveloper(d) && <Developer d={d} devOnly={devOnly} photoFirst />}
      <Foot n={n} />
    </section>
  );
}

function ClosingB({ agent, qr }: PageProps) {
  return (
    <section className={c("page", "w", "b-last")}>
      <div className={c("ph", "bridge")} style={{ backgroundImage: BRIDGE }} />
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={c("meta", "gold")}>Let’s Connect</span>
      </div>
      <Message />
      <div className={c("m", "agent")}>
        <AgentShot agent={agent} />
        <AgentWho agent={agent} />
        <Qr qr={qr} />
      </div>
      <Company />
    </section>
  );
}

/* ── the booklet ─────────────────────────────────────────────────────────── */

type Entry = { key: string; name: string; include: boolean; A: (p: PageProps) => ReactNode; B: (p: PageProps) => ReactNode };

export function buildBooklet(design: Design, input: BookletInput): { pages: BookletPage[]; notes: string[] } {
  const { d } = input;
  const limits = LIMITS[design];
  const kicker = [d.name, d.developer && `by ${d.developer}`].filter(Boolean).join(" ");
  const hasFin = d.financing.length > 0;
  const hasDev = hasDeveloper(d);

  const entries: Entry[] = [
    { key: "cover", name: "Cover", include: true, A: CoverA, B: CoverB },
    { key: "overview", name: "Project Overview", include: d.overview.length > 0, A: OverviewA, B: OverviewB },
    { key: "highlights", name: "Project Highlights", include: d.highlights.length > 0, A: HighlightsA, B: HighlightsB },
    { key: "details", name: "Project Details", include: d.details.length > 0, A: DetailsA, B: DetailsB },
    { key: "gallery", name: "Gallery", include: d.gallery.length > 0, A: GalleryA, B: GalleryB },
    { key: "amenities", name: "Amenities", include: d.amenities.length > 0, A: AmenitiesA, B: AmenitiesB },
    { key: "payment", name: "Payment Plan", include: d.payment.length > 0, A: PaymentA, B: PaymentB },
    { key: "location", name: "Location & Connectivity", include: d.locationText.length > 0 || d.distances.length > 0, A: LocationA, B: LocationB },
    { key: "investment", name: "Investment Potential", include: d.investmentStats.length > 0 || !!d.investmentIntro, A: InvestmentA, B: InvestmentB },
    { key: "financing", name: hasFin && hasDev ? "Financing & Developer" : hasFin ? "Financing" : "Developer", include: hasFin || hasDev, A: FinancingA, B: FinancingB },
    { key: "closing", name: "Company & Agent", include: true, A: ClosingA, B: ClosingB },
  ];

  const notes: string[] = [];
  for (const e of entries) if (!e.include) notes.push(`${e.name}: not on this project’s page, so that page is left out.`);
  if (d.highlights.length > limits.highlights) notes.push(`Highlights: showing ${limits.highlights} of ${d.highlights.length}.`);
  if (d.amenities.length > limits.amenities) notes.push(`Amenities: showing ${limits.amenities} of ${d.amenities.length}.`);
  if (d.distances.length > limits.distances) notes.push(`Location: showing ${limits.distances} of ${d.distances.length} distances.`);
  if (d.gallery.length > 0 && d.gallery.length < 5) notes.push(`Gallery: only ${d.gallery.length} pictures, so some repeat.`);
  if (!hasDev) notes.push("Developer: no developer section on this project’s page.");

  const included = entries.filter((e) => e.include);
  const pages = included.map((e, i) => {
    const Page = design === "a" ? e.A : e.B;
    return { key: e.key, name: e.name, node: <Page {...input} n={pad(i + 1)} kicker={kicker} />, w: 1080, h: 1350 };
  });
  return { pages, notes };
}
