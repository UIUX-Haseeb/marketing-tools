"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The e-business card, 1080 × 1920 (a phone screen / story): the Provident wordmark, a round
 * headshot, name, job title, and a QR code to scan for the agent's contact or a link. Accents are
 * brass (#b0905b): the headshot ring, the title, the QR frame. With a cover photo the top band is
 * the photo under a navy wash with the white wordmark; without one the card is all paper with the
 * navy wordmark. Native size here; <ScaledCard> fits it to a box.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { QrCode } from "./qr";
import s from "./e-card.module.css";

export const CARD_W = 1080;
export const CARD_H = 1920;

export const DEFAULT_COVER = "/tools/agent-kit/e-card/cover.jpg";
const A = "/tools/agent-kit/e-card/";

export interface ECardData {
  name: string;
  title: string;
  /** Data URL or path; "" = initials. */
  photo: string;
  /** Data URL or path; "" = no cover. */
  cover: string;
  /** What the QR code holds (a vCard or a link). */
  qr: string;
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
  return (
    <div className={`${s.card} ${d.cover ? s.withCover : s.noCover}`} style={{ width: CARD_W, height: CARD_H }}>
      {d.cover && (
        <div className={s.cover}>
          <img src={d.cover} alt="" />
          <div className={s.wash} />
        </div>
      )}
      <img className={s.wordmark} src={`${A}${d.cover ? "wordmark-white.svg" : "wordmark-navy.svg"}`} alt="Provident" />

      <div className={s.shot}>{d.photo ? <img src={d.photo} alt="" /> : <span>{initials(name)}</span>}</div>

      <div className={s.name} style={{ fontSize: fitSize(name, 92, 18) }}>
        {name}
      </div>
      {title && (
        <div className={s.title} style={{ fontSize: fitSize(title, 36, 30) }}>
          {title}
        </div>
      )}

      <div className={s.qrCard}>
        <QrCode text={d.qr} logo={`${A}wordmark-navy.svg`} />
      </div>

      <div className={s.scan}>Scan me</div>
      <div className={s.more}>For more information</div>
    </div>
  );
}

/** The card scaled to its box's width. `cardRef` gets the native-size node, for the download. */
export function ScaledCard({ d, cardRef }: { d: ECardData; cardRef?: (el: HTMLDivElement | null) => void }) {
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
  return (
    <div ref={box} style={{ position: "relative", width: "100%", aspectRatio: `${CARD_W} / ${CARD_H}`, overflow: "hidden", borderRadius: 12 }}>
      <div ref={cardRef} style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${k})`, transformOrigin: "0 0", visibility: k ? "visible" : "hidden" }}>
        <ECard d={d} />
      </div>
    </div>
  );
}
