"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The e-business card, 1080 × 1920 (a phone screen / story): the Provident wordmark, a round
 * headshot, name, job title, BRN, and a QR code to scan for the agent's contact or a link. Deep navy
 * with brass (#b0905b) as the hero colour, after the agent "Rented" posts: white name, stone caps
 * title, the BRN in a white pill, brass headshot ring and "Scan me". With a cover photo the top band
 * is the photo fading into the navy; without one the card is all navy. Native size here;
 * <ScaledCard> fits it to a box.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { QrCode } from "./qr";
import s from "./e-card.module.css";

export const CARD_W = 1080;
export const CARD_H = 1920;

export const DEFAULT_COVER = "/tools/e-business-card/cover.jpg";
const A = "/tools/e-business-card/";

export interface ECardData {
  name: string;
  title: string;
  /** Data URL or path; "" = initials. */
  photo: string;
  /** The photo's natural size (for the framing maths); null while it loads. */
  photoSize: { w: number; h: number } | null;
  /** Headshot framing inside the circle, as on Just Sold: zoom 1–3 and an offset in card px. */
  photoAt: PhotoAt;
  /** RERA broker number; "" = left off. */
  brn: string;
  /** Data URL or path; "" = no cover. */
  cover: string;
  /** What the QR code holds (a vCard or a link). */
  qr: string;
}

export interface PhotoAt {
  zoom: number;
  x: number;
  y: number;
}
export const PHOTO_AT_START: PhotoAt = { zoom: 1, x: 0, y: 0 };

/** Inside diameter of the headshot circle (460 less the 5 px ring and 14 px gap each side). */
export const SHOT_D = 422;

/**
 * The headshot covering the circle (like object-fit: cover), zoomed and moved, with the offset
 * clamped so the photo always fills the circle — the same rule as Just Sold's coverRect.
 */
export function shotRect(size: { w: number; h: number }, at: PhotoAt) {
  const scale = (SHOT_D / Math.min(size.w, size.h)) * at.zoom;
  const w = size.w * scale;
  const h = size.h * scale;
  const mx = (w - SHOT_D) / 2;
  const my = (h - SHOT_D) / 2;
  const x = Math.max(-mx, Math.min(mx, at.x));
  const y = Math.max(-my, Math.min(my, at.y));
  return { w, h, left: (SHOT_D - w) / 2 + x, top: (SHOT_D - h) / 2 + y, clamped: { ...at, x, y } };
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Long names and titles step down in size instead of running off the card. */
const fitSize = (text: string, base: number, room: number) => Math.min(base, Math.floor((base * room) / Math.max(1, text.length)));

export function ECard({ d }: { d: ECardData }) {
  const name = d.name.trim() || "Your name";
  const title = d.title.trim();
  const brn = d.brn.trim();
  return (
    <div className={`${s.card} ${d.cover ? s.withCover : s.noCover}`} style={{ width: CARD_W, height: CARD_H }}>
      {d.cover && (
        <div className={s.cover}>
          <img src={d.cover} alt="" />
          <div className={s.wash} />
        </div>
      )}
      <div className={s.sweep} />
      <div className={s.line} />
      <img className={s.wordmark} src={`${A}wordmark-white.svg`} alt="Provident" />

      <div className={s.shot} data-shot>
        <div className={s.shotIn}>
          {d.photo && d.photoSize ? (
            <img src={d.photo} alt="" draggable={false} style={(({ w, h, left, top }) => ({ width: w, height: h, left, top }))(shotRect(d.photoSize, d.photoAt))} />
          ) : (
            <span>{initials(name)}</span>
          )}
        </div>
      </div>

      <div className={s.name} style={{ fontSize: fitSize(name, 92, 18) }}>
        {name}
      </div>
      {title && (
        <div className={s.title} style={{ fontSize: fitSize(title, 36, 30) }}>
          {title}
        </div>
      )}
      {brn && <div className={s.brn}>BRN {brn}</div>}

      <div className={s.qrCard}>
        <QrCode text={d.qr} logo={`${A}mark-navy.svg`} />
      </div>

      <div className={s.scan}>Scan me</div>
      <div className={s.more}>For more information</div>
    </div>
  );
}

/**
 * The card scaled to its box's width. `cardRef` gets the native-size node, for the download.
 * Dragging inside the headshot circle calls `onMoveShot` with the move in card px.
 */
export function ScaledCard({ d, cardRef, onMoveShot }: { d: ECardData; cardRef?: (el: HTMLDivElement | null) => void; onMoveShot?: (dx: number, dy: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / CARD_W));
    ro.observe(el);
    setK(el.clientWidth / CARD_W);
    return () => ro.disconnect();
  }, []);
  const drag = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      ref={box}
      style={{ position: "relative", width: "100%", aspectRatio: `${CARD_W} / ${CARD_H}`, overflow: "hidden", borderRadius: 12 }}
      onPointerDown={(e) => {
        if (!onMoveShot || !d.photo || !(e.target as Element).closest("[data-shot]")) return;
        drag.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
      }}
      onPointerMove={(e) => {
        if (!drag.current || !k) return;
        onMoveShot?.((e.clientX - drag.current.x) / k, (e.clientY - drag.current.y) / k);
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <div ref={cardRef} style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${k})`, transformOrigin: "0 0", visibility: k ? "visible" : "hidden" }}>
        <ECard d={d} />
      </div>
    </div>
  );
}
