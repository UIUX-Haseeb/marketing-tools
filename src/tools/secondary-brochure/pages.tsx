"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The brochure pages. Each page is a fixed 1080 × 1350 canvas drawn with HTML/CSS
 * (brochure.module.css) in the Project Booklet's look (Figma › Brochure A · Paper & navy),
 * kept short like the portal's old flyer:
 *
 *   one page per property — the wordmark with the property ID and a For Sale / For Rent chip
 *   on the right; the property type chip and the location in an outlined pill (Material
 *   "location_on" icon), the property ID again in the footer, the title's tags as the headline ("Fully Furnished · Ready
 *   To Move · Mid Floor"), four key figures (`keyFigures`: residential price · beds · baths · size,
 *   commercial price · size · fit-out · plot / payment), under the wordmark and an inset mosaic
 *   of five photos (two across, three below; rounded, inside the margins) in one fixed size on
 *   every page — the cells are about 1.42 : 1, between the portal's 3:2 and 4:3 pictures, so at
 *   most ~6% is trimmed off two edges and the portal's watermark stays; the permit QR beside
 *   the headline. Pages of different property types sit in one
 *   brochure side by side: each page reads its own listing, the layout is the same.
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
import { buildingLine, forLabel, keyFigures, priceTerm } from "./format";
import { Wordmark } from "./wordmark";
import { PAGE, type Agent, type Design, type Item, type Listing } from "./types";

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

function Img({ src }: { src?: string }) {
  if (!src) return <span className={s.empty}>No picture</span>;
  return <img src={src} alt="" decoding="async" draggable={false} />;
}

function Foot({ text, n }: { text: string; n: string }) {
  return (
    <div className={s.foot}>
      <span>{text}</span>
      <span>{n}</span>
    </div>
  );
}

/** Sub-community / building, community and (when short enough) city, most specific first. */
function kickerOf(l: Listing) {
  const parts = [buildingLine(l).split(", ").pop(), l.community].filter(Boolean) as string[];
  // The city is implied; it only goes in when it fits beside the type chip (≈13.5 px a letter in
  // the chip, ≈10.5 px in the pill, 586 px left for both) and no part already names it.
  const room = Math.floor((586 - l.propertyType.length * 13.5) / 10.5);
  const withCity = [...parts, l.city].join(" · ");
  return withCity.length <= room && !parts.some((p) => p.includes(l.city)) ? withCity : parts.join(" · ");
}

/** Google Material Symbols "location_on" (outlined), for the location pill. */
function LocationOn() {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
    </svg>
  );
}

/** The title's tags ("Fully Furnished · Ready To Move · Mid Floor") — the page's headline — or the title itself. */
const tagLine = (l: Listing) => (l.tags.length ? l.tags.join(" · ") : l.title);

/* ── property page ───────────────────────────────────────────────────────── */

function PropertyPage({ item, draft, n, design }: { item: Item; draft?: boolean; n: string; design: Design }) {
  const { l, slots, qr } = item;
  const showQr = !!qr || !!draft;
  const term = priceTerm(l);
  const figs = keyFigures(l);
  const pic = (i: number) => l.photos[slots[i]] ?? l.photos[0];
  return (
    <section className={c("page", design === "b" && "w", "p")}>
      <div className={c("m", "mosaic")}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={c("cell", i < 2 ? "half" : "third")}>
            <Img src={pic(i)} />
          </div>
        ))}
      </div>
      <div className={c("m", "top")}>
        <Wordmark className={s.wm} />
        <div className={s.idbar}>
          <span className={s.meta}>Property ID · {l.ref}</span>
          <span className={s.deal}>{forLabel(l)}</span>
        </div>
      </div>
      <div className={c("m", "blk", showQr && "withqr")}>
        <div className={s.chips}>
          <span className={s.deal}>{l.propertyType}</span>
          <div className={s.loc}>
            <LocationOn />
            <span>{kickerOf(l)}</span>
          </div>
        </div>
        <Fit className={c("title", "fit")} watch={tagLine(l)} min={0.6} lines={2} label="Headline">
          {tagLine(l)}
        </Fit>
      </div>
      {showQr && (
        <div className={c("qr", "pq", !qr && "qr-empty")}>
          {qr ? <img src={qr} alt="Permit QR" draggable={false} /> : <span>Permit<br />QR</span>}
        </div>
      )}
      <div className={c("m", "figs")} style={{ gridTemplateColumns: figs.map((f) => `${f.w}fr`).join(" ") }}>
        {figs.map((f, i) => (
          <div key={f.label}>
            <div className={s.label}>{f.label}</div>
            <Fit className={c("v", "fit")} watch={f.value} min={0.6} lines={1} label={f.label}>
              {f.value}
              {i === 0 && term && <small>{term.replace("per ", "/ ")}</small>}
            </Fit>
          </div>
        ))}
      </div>
      <Foot text={`Property ID · ${l.ref}`} n={n} />
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
  const types = [...new Set(items.map((x) => x.l.propertyType))];
  if (types.length > 1) notes.push(`Mixed property types (${types.join(", ")}): each page shows its own figures — commercial pages swap bedrooms and bathrooms for size and fit-out.`);
  for (const { l, qr } of items) {
    if (l.segment === "Commercial" && !l.intro.length) notes.push(`${l.ref}: no description on the listing.`);
    if (l.photos.length < 3) notes.push(`${l.ref}: only ${l.photos.length} pictures, so some repeat.`);
    if (!qr) notes.push(`${l.ref}: no permit QR uploaded, so the page leaves it off.`);
  }
  return { pages, notes };
}
