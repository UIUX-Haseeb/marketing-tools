"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The brochure pages. Each page is a fixed 1080 × 1350 canvas drawn with HTML/CSS
 * (brochure.module.css) in the Project Booklet's look (Figma › Brochure A · Paper & navy),
 * kept short like the portal's old flyer:
 *
 *   one page per property — the booklet cover: the photo, wordmark, place, headline, the
 *   title's tags, price · beds · baths · size, a row of four more photos (three and the
 *   permit QR when there is one)
 *   one closing page — the booklet's closing: "Ask Us About…" (the upsell: second
 *   citizenship, conveyancing, currency), the agent, the company line
 *
 * One listing gives two pages; selecting several gives one page each plus the closing page.
 * Design A is navy, B white (the booklet's B). `buildBrochure()` also returns layout notes.
 */
import type { ReactNode } from "react";
import { IdCard, Mail, Smartphone } from "lucide-react";
import s from "./brochure.module.css";
import { Fit } from "./fit";
import { buildingLine, forLabel, headline, money, placeLine, priceTerm, sqft } from "./format";
import { Wordmark } from "./wordmark";
import { PAGE, type Agent, type Design, type Frame, type Item, type Listing } from "./types";

/** Module class names by their CSS name: c("page", "w", "p"). */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter(Boolean)
    .map((n) => s[n as string] ?? "")
    .join(" ");

const pad = (i: number) => String(i).padStart(2, "0");
const ASSETS = "/tools/secondary-brochure";

export type BrochureInput = {
  items: Item[];
  agent: Agent;
  /** Studio preview: show an empty QR plate as a reminder. Downloads pass false. */
  draft?: boolean;
};
export type BrochurePage = { key: string; name: string; node: ReactNode; w: number; h: number };

function Img({ src, frame }: { src?: string; frame?: Frame }) {
  if (!src) return <span className={s.empty}>No picture</span>;
  const style = frame && { objectPosition: `${frame.x * 100}% ${frame.y * 100}%`, transform: `scale(${frame.zoom})`, transformOrigin: `${frame.x * 100}% ${frame.y * 100}%` };
  return <img src={src} alt="" decoding="async" draggable={false} style={style || undefined} />;
}

function Foot({ text, n }: { text: string; n: string }) {
  return (
    <div className={s.foot}>
      <span>{text}</span>
      <span>{n}</span>
    </div>
  );
}

/** Building, sub-community, community and city, most specific first. */
const kickerOf = (l: Listing) => [buildingLine(l).split(", ").pop(), l.community, l.city].filter(Boolean).join(" · ");

/** The title's tags ("Fully Furnished · Ready To Move · Mid Floor"), or the title itself. */
const tagLine = (l: Listing) => (l.tags.length ? l.tags.join(" · ") : l.title);

/* ── property page ───────────────────────────────────────────────────────── */

function PropertyPage({ item, draft, n, design }: { item: Item; draft?: boolean; n: string; design: Design }) {
  const { l, slots, qr, frame } = item;
  const showQr = !!qr || !!draft;
  const term = priceTerm(l);
  const area = l.size ? (l.plot ? `${Math.round(l.size).toLocaleString("en-US")} · ${Math.round(l.plot).toLocaleString("en-US")}` : sqft(l.size)) : "—";
  const cells: [string, ReactNode][] = [
    [l.offering === "Rent" ? "Annual Rent" : "Price", <>{money(l)}{term && <small>{term.replace("per ", "/ ")}</small>}</>],
    ["Bedrooms", /studio/i.test(l.beds) ? "Studio" : l.beds],
    ["Bathrooms", l.baths],
    [l.plot ? "Built-up · Plot sq.ft" : "Built-up", area],
  ];
  const row = slots.slice(1, showQr ? 4 : 5);
  return (
    <section className={c("page", design === "b" && "w", "p")}>
      <div className={s.ph}>
        <Img src={l.photos[slots[0]] ?? l.photos[0]} frame={frame} />
      </div>
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={s.meta}>
          {forLabel(l)} · {l.ref}
        </span>
      </div>
      <div className={c("m", "blk")}>
        <div className={s.kicker}>{kickerOf(l)}</div>
        <div className={s.rule} />
        <Fit className={c("title", "fit")} watch={headline(l)} min={0.6} lines={1} label="Headline">
          {headline(l)}
        </Fit>
        <Fit className={c("sub", "fit")} watch={tagLine(l)} min={0.7} lines={1} label="Tags">
          {tagLine(l)}
        </Fit>
        <div className={s.figs} style={{ gridTemplateColumns: "1.7fr 0.7fr 0.75fr 1.25fr" }}>
          {cells.map(([k, v]) => (
            <div key={k}>
              <div className={s.label}>{k}</div>
              <div className={s.v}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={c("m", "row")} style={{ gridTemplateColumns: showQr ? "1fr 1fr 1fr 168px" : "repeat(4, 1fr)" }}>
        {row.map((i, k) => (
          <div key={k} className={s.pic}>
            <Img src={l.photos[i] ?? l.photos[0]} />
          </div>
        ))}
        {showQr && (
          <div className={c("qr", !qr && "qr-empty")}>
            {qr ? <img src={qr} alt="Permit QR" draggable={false} /> : <span>Permit<br />QR</span>}
          </div>
        )}
      </div>
      <Foot text={`Provident Estate · ${placeLine(l).split(" · ").slice(-2).join(" · ")}`} n={n} />
    </section>
  );
}

/* ── closing page: Ask Us About + the agent ─────────────────────────────── */

const SERVICES = [
  { img: "citizenship.jpg", name: "Second Citizenship", text: "Residency and citizenship options." },
  { img: "conveyancing.jpg", name: "Conveyancing", text: "The transfer and its paperwork." },
  { img: "currency.jpg", name: "Currency", text: "Exchange for your purchase or rent." },
];

function Shot({ agent }: { agent: Agent }) {
  return <div className={s.shot}>{agent.photo && <img src={agent.photo} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />}</div>;
}

function ClosingPage({ agent, design }: { agent: Agent; design: Design }) {
  return (
    <section className={c("page", design === "b" && "w", "c")}>
      <div className={s.ph} style={{ backgroundImage: `url(${ASSETS}/closing-bridge.jpg)` }} />
      <div className={s.shade} />
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <span className={s.meta}>Let’s Connect</span>
      </div>
      <div className={c("m", "msg")}>
        <div className={s.kicker}>Ask Us About</div>
        <div className={s.rule} />
        <h2 className={s.h}>More than the keys.</h2>
        <p className={s.body}>A move in Dubai often comes with more to arrange. We can help with that too — just ask your agent.</p>
      </div>
      <div className={c("m", "svc")}>
        {SERVICES.map((x) => (
          <div key={x.name}>
            <div className={s.pic}>
              <Img src={`${ASSETS}/services/${x.img}`} />
            </div>
            <h3>{x.name}</h3>
            <div className={s.s}>{x.text}</div>
          </div>
        ))}
      </div>
      <div className={c("m", "agent")}>
        {design === "b" && <Shot agent={agent} />}
        <div>
          <div className={s.nm}>{agent.name}</div>
          {agent.position && <div className={s.pos}>{agent.position}</div>}
          <div className={s.cl}>
            {agent.mobile && (
              <div>
                <Smartphone strokeWidth={1} /> {agent.mobile}
              </div>
            )}
            {agent.email && (
              <div>
                <Mail strokeWidth={1} /> {agent.email}
              </div>
            )}
            {agent.brn && (
              <div>
                <IdCard strokeWidth={1} />
                <span>
                  <b>BRN</b> {agent.brn}
                </span>
              </div>
            )}
          </div>
        </div>
        {design === "a" && <Shot agent={agent} />}
      </div>
      <div className={c("m", "legal")}>
        <div className={s.r}>
          <span>Provident Real Estate Broker L.L.C · ORN 1933</span>
          <span>800ESTATE · providentestate.com</span>
        </div>
        <p>PROVIDENT® is a registered trademark since 2008 · Copyright © {new Date().getFullYear()} Provident Real Estate</p>
      </div>
    </section>
  );
}

/* ── the brochure ─────────────────────────────────────────────────────────── */

export function buildBrochure(design: Design, input: BrochureInput): { pages: BrochurePage[]; notes: string[] } {
  const { items, agent, draft } = input;
  const pages: BrochurePage[] = items.map((item, i) => ({
    key: item.l.id,
    name: item.l.ref,
    node: <PropertyPage item={item} draft={draft} n={pad(i + 1)} design={design} />,
    w: PAGE.w,
    h: PAGE.h,
  }));
  pages.push({ key: "closing", name: "Ask Us About", node: <ClosingPage agent={agent} design={design} />, w: PAGE.w, h: PAGE.h });

  const notes: string[] = [];
  for (const { l, qr } of items) {
    if (l.photos.length < 5) notes.push(`${l.ref}: only ${l.photos.length} pictures, so some repeat.`);
    if (!qr) notes.push(`${l.ref}: no permit QR uploaded, so the page shows four photos instead.`);
  }
  return { pages, notes };
}
