"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * The brochure pages. Each page is a fixed 1080 × 1350 canvas drawn with HTML/CSS
 * (brochure.module.css) in the Project Booklet's look (Figma › Brochure A · Paper & navy),
 * kept short like the portal's old flyer:
 *
 *   one page per property — the wordmark with a For Sale / For Rent chip on the right; under
 *   the photos the location (Material "location_on" icon), the headline, then two label / value pills — Offering · Residential Rent, Type · Apartment —
 *   the property ID in the footer, the title's tags as the headline ("Fully Furnished · Ready
 *   To Move · Mid Floor"), four key figures (`keyFigures`: residential price · beds · baths · size,
 *   commercial price · size · fit-out · plot / payment), under the wordmark and an inset mosaic
 *   of five photos (two across, three below; rounded, inside the margins) in one fixed size on
 *   every page — the cells are about 1.42 : 1, between the portal's 3:2 and 4:3 pictures, so at
 *   most ~6% is trimmed off two edges and the portal's watermark stays. Pages of different property types sit in one
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
  // The city is implied; it only goes in when the line stays short and no part already names it.
  const withCity = [...parts, l.city].join(" · ");
  return withCity.length <= 46 && !parts.some((p) => p.includes(l.city)) ? withCity : parts.join(" · ");
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

function PropertyPage({ item, n, design }: { item: Item; n: string; design: Design }) {
  const { l, slots } = item;
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
        <span className={s.deal}>{forLabel(l)}</span>
      </div>
      <div className={c("m", "place")}>
        <LocationOn />
        <span>{kickerOf(l)}</span>
      </div>
      <div className={c("m", "blk")}>
        <Fit className={c("title", "fit")} watch={tagLine(l)} min={0.6} lines={2} label="Headline">
          {tagLine(l)}
        </Fit>
        <div className={s.chips}>
          <span className={s.kv}>
            <b>Offering</b>
            {l.offeringName}
          </span>
          <span className={s.kv}>
            <b>Type</b>
            {l.propertyType}
          </span>
        </div>
      </div>
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

/** Material Symbols (Light), 960 × 960 on a -960 baseline; drawn in currentColor. */
const SERVICES = [
  {
    name: "Second Citizenship",
    text: "Residency and citizenship options.",
    icon: "M340-236h280v-28H340v28Zm140-128q72 0 123.5-51.5T655-540q0-72-51.5-123.5T480-715q-73 0-124.5 51.5T304-540q0 73 51.5 124.5T480-364Zm0-32q-19-28-30-61t-13-69h85q-2 36-13 69t-29 61Zm-37 0q-44-12-74-47t-37-83h77q1 30 9 62.5t25 67.5Zm67 0q18-32 28-65t12-65h77q-8 48-39.5 83T510-396ZM332-554q8-51 40.5-87t77.5-45q-19 26-29 59.5T409-554h-77Zm105 0q2-38 13-71.5t30-60.5q18 27 29 60.5t13 71.5h-85Zm113 0q-1-36-11-69.5T509-686q48 9 80.5 45.5T627-554h-77ZM212-132v-696h482q21.75 0 37.88 16.12Q748-795.75 748-774v588q0 21.75-16.12 37.87Q715.75-132 694-132H212Zm22-22h460q12 0 22-10t10-22v-588q0-12-10-22t-22-10H234v652Zm0 0v-652 652Z",
  },
  {
    name: "Conveyancing",
    text: "The transfer and its paperwork.",
    icon: "M380-644v-22h320v22H380Zm0 108v-22h320v22H380Zm98 382H194h284Zm0 22H236q-26.75 0-45.37-18.63Q172-169.25 172-196v-112h120v-520h496v308q-6.5 1-11.46 1.86-4.96.86-10.54 2.14v-290H314v498h222l-22 22H194v90q0 17.85 12.14 29.93Q218.27-154 235-154h243v22Zm94 0v-78l211-210q5-5 10-6.5t10-1.5q5 0 10.5 2t9.5 6l37 38q4 5 6 10t2 10q0 5-2.5 10t-5.41 10L650-132h-78Zm268-230-37-38 37 38ZM600-160h38l144-144-19-19-18-20-145 145v38Zm163-163-18-20 37 39-19-19Z",
  },
  {
    name: "Currency",
    text: "Exchange for your purchase or rent.",
    icon: "M528-464q-29 0-48.5-19.5T460-532q0-29 19.5-48.5T528-600q29 0 48.5 19.5T596-532q0 29-19.5 48.5T528-464ZM278-328q-21.5 0-37.75-16.25T224-382v-300q0-21.5 16.25-37.75T278-736h500q21.5 0 37.75 16.25T832-682v300q0 21.5-16.25 37.75T778-328H278Zm34-22h432q0-27 19.63-46.5Q783.25-416 810-416v-232q-27 0-46.5-19.63Q744-687.25 744-714H312q0 27-19.62 46.5Q272.75-648 246-648v232q27 0 46.5 19.62Q312-376.75 312-350Zm402 118H182q-21.5 0-37.75-16.25T128-286v-332h22v332q0 12 10 22t22 10h532v22ZM278-350h-32v-364h32q-13 0-22.5 9.5T246-682v300q0 13 9.5 22.5T278-350Z",
  },
];

function Shot({ agent }: { agent: Agent }) {
  return (
    <div className={s.shot}>
      <img src={agent.photo ?? undefined} alt="" draggable={false} style={{ transform: `scale(${agent.zoom})` }} />
    </div>
  );
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
            <div className={s.ico}>
              <svg viewBox="0 -960 960 960" aria-hidden>
                <path d={x.icon} fill="currentColor" />
              </svg>
            </div>
            <h3>{x.name}</h3>
            <div className={s.s}>{x.text}</div>
          </div>
        ))}
      </div>
      <div className={c("m", "agent")}>
        {agent.photo && <Shot agent={agent} />}
        <div className={s.who}>
          <div className={s.nm}>{agent.name}</div>
          {agent.position && <div className={s.pos}>{agent.position}</div>}
        </div>
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
  const { items, agent } = input;
  const pages: BrochurePage[] = items.map((item, i) => ({
    key: item.l.id,
    name: item.l.ref,
    node: <PropertyPage item={item} n={pad(i + 1)} design={design} />,
    w: PAGE.w,
    h: PAGE.h,
  }));
  pages.push({ key: "closing", name: "Ask Us About", node: <ClosingPage agent={agent} design={design} />, w: PAGE.w, h: PAGE.h });

  const notes: string[] = [];
  const types = [...new Set(items.map((x) => x.l.propertyType))];
  if (types.length > 1) notes.push(`Mixed property types (${types.join(", ")}): each page shows its own figures — commercial pages swap bedrooms and bathrooms for size and fit-out.`);
  for (const { l } of items) {
    if (l.segment === "Commercial" && !l.intro.length) notes.push(`${l.ref}: no description on the listing.`);
    if (l.photos.length < 3) notes.push(`${l.ref}: only ${l.photos.length} pictures, so some repeat.`);
  }
  return { pages, notes };
}
