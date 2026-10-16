"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The brochure pages. Each page is a fixed 1080 × 1350 canvas drawn with HTML/CSS
 * (brochure.module.css), in the structure of the portal's old flyer:
 *
 *   one page per property — brand + agent header, five photos, title, spec table,
 *   a short description and "Offered at" (and the permit QR when there is one)
 *   one closing page — "Ask Us About…" (the upsell: second citizenship, conveyancing,
 *   currency) and the agent's contact
 *
 * One listing gives two pages, like the old flyer; selecting several listings gives one page
 * each plus the closing page. `buildBrochure()` also returns layout notes for the studio.
 */
import type { ReactNode } from "react";
import { BedDouble, Building2, FileText, Hash, Mail, MapPin, Ruler, Smartphone } from "lucide-react";
import s from "./brochure.module.css";
import { Fit } from "./fit";
import { bedsLabel, communityLine, forLabel, money, placeLine, priceTerm, sqft } from "./format";
import { Wordmark } from "./wordmark";
import { PAGE, type Agent, type Design, type Item, type Listing } from "./types";

/** Module class names by their CSS name: c("page", "a"). */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter(Boolean)
    .map((n) => s[n as string] ?? "")
    .join(" ");

const pad = (i: number) => String(i).padStart(2, "0");
const SERVICES = "/tools/secondary-brochure/services";

export type BrochureInput = {
  items: Item[];
  agent: Agent;
  /** Studio preview: show an empty QR plate as a reminder. Downloads pass false. */
  draft?: boolean;
};
export type BrochurePage = { key: string; name: string; node: ReactNode; w: number; h: number };

/* ── shared parts ────────────────────────────────────────────────────────── */

function Img({ src }: { src?: string }) {
  if (!src) return <span className={s.empty}>No picture</span>;
  return <img src={src} alt="" decoding="async" draggable={false} />;
}

/** The old flyer's header: wordmark + line on the left, the agent on the right. */
function Header({ agent }: { agent: Agent }) {
  return (
    <div className={s.head}>
      <div className={s.brand}>
        <Wordmark className={s.wm} />
        <p>
          The place to begin your search
          <br />
          for <b>property in Dubai.</b>
        </p>
      </div>
      <div className={s.who}>
        <div>
          <div className={s.nm}>{agent.name}</div>
          {agent.position && <div className={s.pos}>{agent.position}</div>}
          <div className={s.cl}>
            {agent.mobile && (
              <span>
                <Smartphone strokeWidth={1.25} /> {agent.mobile}
              </span>
            )}
            {agent.email && (
              <span>
                <Mail strokeWidth={1.25} /> {agent.email}
              </span>
            )}
          </div>
        </div>
        <div className={s.shot}>{agent.photo && <img src={agent.photo} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />}</div>
      </div>
    </div>
  );
}

function Foot({ n }: { n: string }) {
  return (
    <div className={s.foot}>
      <span>
        <b>PROVIDENT®</b> is a registered trademark since 2008
        <br />
        Copyright © {new Date().getFullYear()} Provident Real Estate · ORN 1933
      </span>
      <span className={s.n}>{n}</span>
    </div>
  );
}

/** The listing title with its separators tidied: "Fully Furnished · Ready To Move · Mid Floor". */
const titleLine = (l: Listing) => (l.tags.length ? l.tags.join(" · ") : l.title);

/** The first sentences of the description that fit the box (the full text stays in the portal). */
function excerpt(l: Listing) {
  const text = l.intro.join(" ");
  if (!text) return `${bedsLabel(l)} ${l.propertyType.toLowerCase()} ${l.offering === "Rent" ? "for rent" : "for sale"} in ${communityLine(l).replace(" · ", ", ")}.`;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = "";
  for (const t of sentences) {
    if (out && (out + t).length > 330) break;
    out += t;
  }
  return out.trim();
}

/* ── property page ───────────────────────────────────────────────────────── */

function PropertyPage({ item, agent, draft, n, design }: { item: Item; agent: Agent; draft?: boolean; n: string; design: Design }) {
  const { l, slots, qr } = item;
  const term = priceTerm(l);
  const showQr = !!qr || !!draft;
  const rows: [ReactNode, string, string][] = [
    [<Hash key="i" className={s.ico} strokeWidth={1.25} />, "Reference", l.ref],
    [<BedDouble key="i" className={s.ico} strokeWidth={1.25} />, "Bedrooms", `${/studio/i.test(l.beds) ? "Studio" : `${l.beds} bed`} · ${l.baths} bath`],
    [<FileText key="i" className={s.ico} strokeWidth={1.25} />, "Offering", `Residential ${l.offering}`],
    [<MapPin key="i" className={s.ico} strokeWidth={1.25} />, "Location", placeLine(l).replace(` · ${l.city}`, "")],
    [<Building2 key="i" className={s.ico} strokeWidth={1.25} />, "Property Type", l.propertyType],
    [<Ruler key="i" className={s.ico} strokeWidth={1.25} />, "Size", [sqft(l.size), l.plot ? `plot ${sqft(l.plot)}` : ""].filter(Boolean).join(" · ") || "—"],
  ];
  return (
    <section className={c("page", design)}>
      <Header agent={agent} />
      <div className={c("m", "grid")}>
        {slots.slice(0, 5).map((i, k) => (
          <div key={k} className={s.pic}>
            <Img src={l.photos[i] ?? l.photos[0]} />
            {k === 0 && (
              <div className={s.badge}>
                <span>{l.propertyType}</span>
                <span>{forLabel(l)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={c("m", "ttl")}>
        <div className={s.kicker}>{placeLine(l)}</div>
        <Fit className={c("title", "fit")} watch={titleLine(l)} min={0.7} label="Title">
          {titleLine(l)}
        </Fit>
      </div>
      <div className={c("m", "spec")}>
        {rows.map(([icon, k, v]) => (
          <div key={k} className={s.c}>
            {icon}
            <span className={s.k}>{k}</span>
            <Fit className={c("v", "fit")} watch={v} min={0.75} label={k}>
              {v}
            </Fit>
          </div>
        ))}
      </div>
      <div className={c("m", "low", showQr && "withqr")}>
        <Fit className={c("desc", "fit")} watch={excerpt(l)} min={0.8} label="Description">
          {excerpt(l)}
        </Fit>
        {showQr && <div className={c("qrb", !qr && "none")}>{qr ? <img src={qr} alt="Permit QR" draggable={false} /> : <span>Permit<br />QR</span>}</div>}
        <div className={s.price}>
          <div className={s.label}>Offered at</div>
          <Fit className={s.v} watch={money(l)} min={0.7} lines={1} label="Price">
            {money(l)}
          </Fit>
          {term && <div className={s.t}>{term}{l.cheques ? ` · ${l.cheques} ${l.cheques === 1 ? "cheque" : "cheques"}` : ""}</div>}
        </div>
      </div>
      <Foot n={n} />
    </section>
  );
}

/* ── closing page: the upsell + contact ─────────────────────────────────── */

const SERVICE_CARDS = [
  { img: "citizenship.jpg", name: "Second Citizenship", text: "Residency and citizenship options." },
  { img: "conveyancing.jpg", name: "Conveyancing", text: "The transfer and its paperwork." },
  { img: "currency.jpg", name: "Currency", text: "Exchange for your purchase or rent." },
];

function ClosingPage({ agent, n, design }: { agent: Agent; n: string; design: Design }) {
  return (
    <section className={c("page", design)}>
      <Header agent={agent} />
      <div className={c("m", "ask")}>
        <div className={s.kicker}>Ask us about…</div>
        <h2>More than the keys.</h2>
        <p>A move in Dubai often comes with more to arrange. We can help with that too — just ask your agent.</p>
      </div>
      <div className={c("m", "svc")}>
        {SERVICE_CARDS.map((x) => (
          <div key={x.name}>
            <div className={s.pic}>
              <Img src={`${SERVICES}/${x.img}`} />
            </div>
            <h3>{x.name}</h3>
            <div className={s.s}>{x.text}</div>
          </div>
        ))}
      </div>
      <div className={c("m", "contact")}>
        <div>
          <div className={s.label}>Contact our agent</div>
          <h3>{agent.name}</h3>
        </div>
        <div className={s.lines}>
          {agent.mobile && (
            <span>
              <Smartphone strokeWidth={1.25} /> {agent.mobile}
            </span>
          )}
          {agent.email && (
            <span>
              <Mail strokeWidth={1.25} /> {agent.email}
            </span>
          )}
          <span>
            <Hash strokeWidth={1.25} /> BRN {agent.brn} · 800ESTATE
          </span>
        </div>
      </div>
      <Foot n={n} />
    </section>
  );
}

/* ── the brochure ─────────────────────────────────────────────────────────── */

export function buildBrochure(design: Design, input: BrochureInput): { pages: BrochurePage[]; notes: string[] } {
  const { items, agent, draft } = input;
  const pages: BrochurePage[] = items.map((item, i) => ({
    key: item.l.id,
    name: `${item.l.ref}`,
    node: <PropertyPage item={item} agent={agent} draft={draft} n={pad(i + 1)} design={design} />,
    w: PAGE.w,
    h: PAGE.h,
  }));
  pages.push({ key: "closing", name: "Ask Us About", node: <ClosingPage agent={agent} n={pad(items.length + 1)} design={design} />, w: PAGE.w, h: PAGE.h });

  const notes: string[] = [];
  for (const { l, qr } of items) {
    if (l.photos.length < 5) notes.push(`${l.ref}: only ${l.photos.length} pictures, so some repeat.`);
    if (!l.intro.length) notes.push(`${l.ref}: the description has no paragraph, so a line is made from the listing’s fields.`);
    if (!qr) notes.push(`${l.ref}: no permit QR uploaded, so the page leaves it off.`);
  }
  return { pages, notes };
}
