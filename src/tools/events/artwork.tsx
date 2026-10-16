"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The event banner (inside page, 1143 × 420) and grid thumbnail (443 × 243), drawn from the
 * event's own fields — Details (title, subtitle, types), Schedule (date, time) and Location
 * (venue · city). Nothing is typed twice: the artwork is a view of the record, and the Links &
 * media tab only picks the design and the photo. Native size here; <ScaledArt> fits it to a box.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Clock, Link2, MapPin, Phone } from "lucide-react";
import { Fit } from "./fit";
import { artDate, artTitle, placeLine, shortDate, shortLink } from "./format";
import { DEVELOPER_LOGOS, developerInText, developerLogoSrc } from "./photos";
import { ART_SIZES, LOGO_TYPES, NO_ADJUST, type Adjust, type ArtDesign, type ArtKind, type EventRecord } from "./types";
import s from "./artwork.module.css";

const c = (...names: (string | false | undefined)[]) => names.filter(Boolean).map((n) => s[n as string] ?? n).join(" ");

function framing(a: Adjust): CSSProperties {
  const at = `${(a.x * 100).toFixed(2)}% ${(a.y * 100).toFixed(2)}%`;
  return a.zoom > 1.001 ? { objectPosition: at, transform: `scale(${a.zoom})`, transformOrigin: at } : { objectPosition: at };
}

/**
 * Share of the picture that filling the frame would cut away (0 = same shape as the frame).
 * Real portal pictures are mostly finished posters — 9:16 stories, square tiles — with their own
 * text, which a wide frame would crop to pieces.
 */
export const cropShare = (imgW: number, imgH: number, frameW: number, frameH: number) =>
  1 - Math.min(imgW / imgH, frameW / frameH) / Math.max(imgW / imgH, frameW / frameH);

function Photo({ e, kind, align = "center" }: { e: EventRecord; kind: ArtKind; align?: "center" | "right" }) {
  const src = e.artwork.photo;
  const box = useRef<HTMLDivElement>(null);
  const [whole, setWhole] = useState(e.artwork.fit === "whole");
  const decide = (img: HTMLImageElement) => {
    const fit = e.artwork.fit ?? "auto";
    const el = box.current;
    if (fit !== "auto" || !el || !img.naturalWidth) return setWhole(fit === "whole");
    setWhole(cropShare(img.naturalWidth, img.naturalHeight, el.offsetWidth, el.offsetHeight) > 1 / 3);
  };
  // re-decide when the fit setting or the frame changes (design switch) without a new load
  useLayoutEffect(() => {
    const img = box.current?.querySelector<HTMLImageElement>("img[data-photo]");
    if (img?.complete) decide(img);
  });
  const adj = e.artwork.adjust[kind] ?? NO_ADJUST;
  return (
    <div ref={box} className={c("frame", whole && "whole")} data-frame={kind} data-fit={whole ? "whole" : "fill"}>
      {src && whole && <img className={s.backdrop} src={src} alt="" aria-hidden decoding="async" draggable={false} />}
      {src ? (
        <img
          data-photo
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          onLoad={(ev) => decide(ev.currentTarget)}
          style={whole ? { objectPosition: align === "right" ? "right center" : "center", ...(adj.zoom > 1.001 ? { transform: `scale(${adj.zoom})` } : {}) } : framing(adj)}
        />
      ) : (
        <div className={s.nophoto}>
          <img src="/tools/events/provident-wordmark-white.svg" alt="" draggable={false} />
        </div>
      )}
    </div>
  );
}

/** Library logos' width ÷ height, so each is sized to the same area rather than the same height. */
const LOGO_RATIO: Record<string, number> = { emaar: 152.38 / 31.55, beyond: 281.42 / 37.55, imtiaz: 78.44 / 13.64, meeras: 255.74 / 64.56 };

/** The developer logo this event's artwork carries, or null (wrong type, none set, "none"). */
export function devLogo(e: EventRecord, tone: "white" | "navy", area: number) {
  if (!e.types.some((t) => LOGO_TYPES.includes(t))) return null;
  const v = e.artwork.logo ?? "";
  if (v === "none") return null;
  if (v) return { src: v, style: undefined, upload: true };
  // the portal links no developer; fall back to one named in the title ("THE OASIS BY EMAAR")
  const key = DEVELOPER_LOGOS[e.developer] ?? DEVELOPER_LOGOS[developerInText(e.title)];
  if (!key) return null;
  const h = Math.sqrt(area / LOGO_RATIO[key]);
  return { src: developerLogoSrc(key, tone), style: { width: Math.round(h * LOGO_RATIO[key]), height: Math.round(h) } as CSSProperties, upload: false };
}

function DevLogo({ e, tone, area, className }: { e: EventRecord; tone: "white" | "navy"; area: number; className?: string }) {
  const d = devLogo(e, tone, area);
  if (!d) return null;
  return <img className={c("dev", d.upload && (tone === "white" ? "tintWhite" : "tintNavy"), className)} src={d.src} alt="Developer" draggable={false} style={d.style} />;
}

/** Provident's wordmark, with the developer's logo before it when the event has one. */
function Lockup({ e, tone, area, provident }: { e: EventRecord; tone: "white" | "navy"; area: number; provident: string }) {
  const has = !!devLogo(e, tone, area);
  return (
    <div className={c("lockup", has && "paired")}>
      <DevLogo e={e} tone={tone} area={area} />
      {has && <i className={s.rule} />}
      <img className={s.pv} src={provident} alt="Provident" draggable={false} />
    </div>
  );
}

function Chips({ e, max }: { e: EventRecord; max: number }) {
  const types = e.types.length ? e.types : ["Event type"];
  const shown = types.slice(0, max);
  return (
    <div className={s.chips}>
      {shown.map((t) => (
        <span key={t} className={c("chip", !e.types.length && "placeholder")}>{t}</span>
      ))}
      {types.length > max && <span className={s.chip}>+{types.length - max}</span>}
    </div>
  );
}

function Title({ e, className, min = 0.7 }: { e: EventRecord; className?: string; min?: number }) {
  const t = artTitle(e);
  // Emoji by code point too: Node's ICU can be older than the browser's (🪻 → hydration mismatch).
  const last = [...t].pop() ?? "";
  const dot = t && !/[.!?\p{Extended_Pictographic}]/u.test(last) && (last.codePointAt(0) ?? 0) < 0x1f000;
  return (
    <Fit className={c("title", className, !t && "placeholder")} watch={t} min={min} label="Title">
      {t || "Event title"}
      {dot && <span className={s.dot}>.</span>}
    </Fit>
  );
}

function Meta({ e }: { e: EventRecord }) {
  const d = artDate(e);
  const place = placeLine(e);
  const time = e.artwork.show.time && d?.time;
  const loc = e.artwork.show.location && place;
  if (!time && !loc) return null;
  return (
    <div className={s.meta}>
      {time && (
        <div className={s.line}>
          <Clock size={18} strokeWidth={1.75} />
          <span>{d.time}</span>
        </div>
      )}
      {loc && (
        <div className={s.line}>
          <MapPin size={18} strokeWidth={1.75} />
          <span>{place}</span>
        </div>
      )}
    </div>
  );
}

function Banner({ e, design }: { e: EventRecord; design: ArtDesign }) {
  const d = artDate(e);
  const sub = e.artwork.show.subtitle && e.subtitle.trim();
  const head = (
    <div className={s.head}>
      <Title e={e} />
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  );
  const big = (cls = "big") => <span className={c(cls, d?.long && "long", !d && "placeholder")}>{d?.big ?? "00"}</span>;

  if (design === "a")
    return (
      <div className={c("art", "banner", "aBanner")}>
        <Photo e={e} kind="banner" />
        <div className={s.fade} />
        <div className={s.logoShade} />
        <div className={s.panel}>
          <Chips e={e} max={2} />
          {head}
          <div className={s.when}>
            {big()}
            <div className={s.month}>
              <b className={!d ? s.placeholder : undefined}>{d?.sub ?? "Month"}</b>
              {d && <i>{d.note}</i>}
            </div>
          </div>
          <Meta e={e} />
        </div>
        <Lockup e={e} tone="white" area={2480} provident="/tools/events/provident-wordmark-white.svg" />
      </div>
    );

  if (design === "b")
    return (
      <div className={c("art", "banner", "bBanner")}>
        <Photo e={e} kind="banner" align="right" />
        <div className={s.shade} />
        <div className={s.shade2} />
        <div className={s.panel}>
          <Chips e={e} max={2} />
          {head}
          <Meta e={e} />
        </div>
        <div className={s.card}>
          <span className={s.note}>{d?.note ?? "Date"}</span>
          {big()}
          <span className={s.mon}>{d?.sub ?? ""}</span>
        </div>
        <Lockup e={e} tone="white" area={2480} provident="/tools/events/provident-wordmark-white.svg" />
      </div>
    );

  return (
    <div className={c("art", "banner", "cBanner")}>
      <Photo e={e} kind="banner" />
      <div className={s.panel}>
        {/* logos first, type chip at the right (Figma, Event Tools · C Paper) */}
        <div className={s.top}>
          <Lockup e={e} tone="navy" area={1860} provident="/tools/events/provident-logo-navy.svg" />
          <Chips e={e} max={2} />
        </div>
        {head}
        <div className={s.when}>
          <div className={s.tile}>
            {big()}
            <span className={s.mon}>{d && !d.long ? d.sub : d?.sub ?? "MON"}</span>
          </div>
          <div className={c("meta")}>
            <div className={s.line}>
              <span>{[d?.note, e.artwork.show.time && d?.time].filter(Boolean).join(" · ") || "Date to be set"}</span>
            </div>
            {e.artwork.show.location && placeLine(e) && (
              <div className={c("line", "muted")}>
                <MapPin size={18} strokeWidth={1.75} />
                <span>{placeLine(e)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Thumb({ e, design }: { e: EventRecord; design: ArtDesign }) {
  const d = artDate(e);
  const date = shortDate(e) || "Date";
  if (design === "a")
    return (
      <div className={c("art", "thumb", "aThumb")}>
        <Photo e={e} kind="thumb" />
        <div className={s.fade} />
        <div className={s.panel}>
          <Chips e={e} max={1} />
          <Title e={e} min={0.75} />
          <span className={c("date", !d && "placeholder")}>{date}</span>
        </div>
        {devLogo(e, "white", 540) && <div className={s.devShade} />}
        <DevLogo e={e} tone="white" area={540} className="thumbDev" />
      </div>
    );
  if (design === "b")
    return (
      <div className={c("art", "thumb", "bThumb")}>
        <Photo e={e} kind="thumb" />
        <div className={s.shade} />
        <Chips e={e} max={1} />
        <div className={s.card}>
          <span className={c("big", d?.long && "long", !d && "placeholder")}>{d ? (d.long ? d.big : d.big) : "00"}</span>
          {d && !d.long && <span className={s.mon}>{d.sub.split(" ")[0]}</span>}
        </div>
        <Title e={e} min={0.75} className={devLogo(e, "white", 540) ? "withDev" : undefined} />
        <DevLogo e={e} tone="white" area={540} className="thumbDev" />
      </div>
    );
  return (
    <div className={c("art", "thumb", "cThumb")}>
      <Photo e={e} kind="thumb" />
      <div className={s.panel}>
        <Chips e={e} max={1} />
        <Title e={e} min={0.75} />
        <div className={s.foot}>
          <span className={c("date", !d && "placeholder")}>
            <i />
            {date}
          </span>
          <DevLogo e={e} tone="navy" area={465} />
        </div>
      </div>
    </div>
  );
}

/**
 * 9:16 story flyer (1080 × 1920) — the banner's content plus what a flyer is for: a short
 * description, the full address, the registration / livestream link and the contact. Still
 * never the long description, audience or status.
 */
function Flyer({ e, design }: { e: EventRecord; design: ArtDesign }) {
  const d = artDate(e);
  const tone = design === "c" ? "navy" : "white";
  const provident = design === "c" ? "/tools/events/provident-logo-navy.svg" : "/tools/events/provident-wordmark-white.svg";
  const sub = e.subtitle.trim();
  const desc = e.shortDescription.trim();
  const address = e.online ? "" : [e.address2, e.address1, e.city, e.country && e.country !== "United Arab Emirates" ? e.country : ""].filter(Boolean).join(", ");
  const contact = [e.contactName, e.contactPhone].filter(Boolean).join(" · ") || e.contactEmail;
  const link = e.online ? e.livestream || e.website : e.registrationUrl || e.website;
  const cta = e.online ? "Join online" : e.registrationUrl ? "Register" : e.website ? "More details" : e.registrationRequired ? "Registration required" : "No registration needed";
  const ic = { size: 30, strokeWidth: 1.6 };
  const lockup = <Lockup e={e} tone={tone} area={4450} provident={provident} />;
  return (
    <div className={c("art", "flyer", `${design}Flyer`)}>
      {design !== "c" && <Photo e={e} kind="flyer" />}
      <div className={s.shade} />
      {design !== "c" && <div className={s.fTop}>{lockup}</div>}
      <div className={s.body}>
        {/* C: the photo is the column's first item and grows into whatever the copy leaves */}
        {design === "c" && <Photo e={e} kind="flyer" />}
        <div className={s.row1}>
          {design === "c" && lockup}
          <Chips e={e} max={2} />
        </div>
        <Title e={e} min={0.62} />
        {sub && <div className={s.sub}>{sub}</div>}
        {desc && (
          <Fit className={s.desc} watch={desc} min={0.8} label="Description">
            {desc}
          </Fit>
        )}
        <div className={s.when}>
          <span className={c("big", d?.long && "long", !d && "placeholder")}>{d?.big ?? "00"}</span>
          <div className={s.month}>
            <b>{d?.sub ?? "Month"}</b>
            {d && <i>{d.note}</i>}
          </div>
        </div>
        <div className={s.rows}>
          {d?.time && (
            <div className={s.drow}>
              <Clock {...ic} />
              <span>{d.time}</span>
            </div>
          )}
          {placeLine(e) && (
            <div className={s.drow}>
              <MapPin {...ic} />
              <span>
                {placeLine(e)}
                {address && <small>{address}</small>}
              </span>
            </div>
          )}
          {contact && (
            <div className={s.drow}>
              <Phone {...ic} />
              <span>{contact}</span>
            </div>
          )}
        </div>
        <div className={s.cta}>
          <span className={s.ctaLabel}>{cta}</span>
          {link && (
            <span className={s.ctaLink}>
              <Link2 size={26} strokeWidth={1.6} />
              {shortLink(link)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** The artwork at its native size (what gets drawn into the PNG). */
export function Artwork({ e, kind, design }: { e: EventRecord; kind: ArtKind; design?: ArtDesign }) {
  const dz = design ?? e.artwork.design;
  if (kind === "flyer") return <Flyer e={e} design={dz} />;
  return kind === "banner" ? <Banner e={e} design={dz} /> : <Thumb e={e} design={dz} />;
}

/**
 * The artwork scaled to its box's width. `artRef` gets the native-size node (for download and
 * for the preview drag, which reads [data-frame] inside it).
 */
export function ScaledArt({ e, kind, design, className, artRef, rounded = true }: { e: EventRecord; kind: ArtKind; design?: ArtDesign; className?: string; artRef?: (el: HTMLDivElement | null) => void; rounded?: boolean }) {
  const { w, h } = ART_SIZES[kind];
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    setK(el.clientWidth / w);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className={className} style={{ position: "relative", width: "100%", aspectRatio: `${w} / ${h}`, overflow: "hidden", borderRadius: rounded ? 12 : 0 }}>
      <div ref={artRef} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0", visibility: k ? "visible" : "hidden" }}>
        <Artwork e={e} kind={kind} design={design} />
      </div>
    </div>
  );
}
