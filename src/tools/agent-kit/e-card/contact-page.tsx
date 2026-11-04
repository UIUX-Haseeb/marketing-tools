"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The page a client lands on after scanning the e-card's QR (/card/<id>) — the portal's contact page
 * in the e-card's look: navy hero with the skyline, brass-ringed photo, name and title, then Call /
 * WhatsApp / Email / Directions, the details, Provident's social channels, and Save to phone (a
 * vCard with the photo, vcard.ts). Phone-first; centred on a desktop.
 */
import { useState, type ReactNode } from "react";
import { BadgeCheck, Briefcase, Check, Globe, Mail, MapPin, MessageCircle, Phone, Share2, UserPlus } from "lucide-react";
import { siFacebook, siInstagram, siTelegram, siWhatsapp, siX, siYoutube } from "simple-icons";
import { COMPANY, MAP_URL, OFFICE, SOCIALS, WEBSITE, digits, type Contact } from "./contact";
import { saveContact } from "./vcard";

const BRAND: Record<string, { path: string } | undefined> = { instagram: siInstagram, facebook: siFacebook, youtube: siYoutube, x: siX, telegram: siTelegram };

export function ContactPage({ c }: { c: Contact }) {
  const tel = digits(c.phone);
  const wa = tel.replace(/^\+/, "");
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveContact(c);
    } finally {
      setSaving(false);
    }
  };
  const share = async () => {
    const data = { title: `${c.name} · ${COMPANY}`, url: location.href };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9e5dd]">
      <main className="relative mx-auto min-h-screen max-w-md bg-paper pb-28 text-navy shadow-sm">
        {/* hero */}
        <header className="relative overflow-hidden bg-[linear-gradient(180deg,#1a2942_0,#1a2942_14rem,#131d36_100%)] text-white">
          <img src="/tools/agent-kit/e-card/cover.jpg" alt="" className="absolute inset-x-0 top-0 h-56 w-full object-cover" />
          <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(19,29,54,0.6)_0%,rgba(26,41,66,0.45)_45%,#1a2942_100%)]" />
          <div className="relative flex flex-col items-center px-6 pb-7 pt-8 text-center">
            <img src="/tools/agent-kit/e-card/wordmark-white.svg" alt="Provident" className="h-6 w-auto" />
            <div className="mt-7 size-36 rounded-full border-[3px] border-[#b0905b] bg-[#1a2942] p-1.5">
              {c.photo ? (
                <img src={c.photo} alt={c.name} className="size-full rounded-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center rounded-full bg-[#2f4960] text-4xl">{c.name.trim()[0]}</div>
              )}
            </div>
            <h1 className="mt-5 text-[28px] font-normal leading-tight">{c.name}</h1>
            {c.title && <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[#d4cfc4]">{c.title}</p>}
            <p className="mt-1 text-sm text-[#c9d0db]">{COMPANY}</p>
            {c.brn && <p className="mt-3 rounded-full bg-white px-3.5 py-1 text-[11px] font-medium tracking-[0.16em] text-[#b0905b]">BRN {c.brn}</p>}
          </div>
          <nav className="relative grid auto-cols-fr grid-flow-col border-t border-white/10">
            {tel && <Action href={`tel:${tel}`} icon={<Phone />} label="Call" />}
            {wa && <Action href={`https://wa.me/${wa}`} icon={<MessageCircle />} label="WhatsApp" />}
            {c.email && <Action href={`mailto:${c.email}`} icon={<Mail />} label="Email" />}
            <Action href={MAP_URL} icon={<MapPin />} label="Directions" />
          </nav>
        </header>

        {/* details */}
        <section className="px-5 py-2">
          {c.brn && <Row icon={<BadgeCheck />} value={c.brn} label="BRN · RERA broker number" />}
          {c.phone && <Row icon={<Phone />} value={<a href={`tel:${tel}`}>{c.phone}</a>} label="Mobile" />}
          {c.email && <Row icon={<Mail />} value={<a href={`mailto:${c.email}`} className="break-all">{c.email}</a>} label="Email" />}
          <Row icon={<Briefcase />} value={COMPANY} label={c.title || "Company"} />
          <Row
            icon={<MapPin />}
            value={
              <>
                {OFFICE.street}
                <br />
                {OFFICE.city}, {OFFICE.country}
              </>
            }
            label={
              <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-medium uppercase tracking-[0.14em] text-[#b0905b]">
                Show on map
              </a>
            }
          />
          <Row icon={<Globe />} value={<a href={WEBSITE}>www.providentestate.com</a>} label="Website" />
        </section>

        <section className="px-5 pb-6 pt-2">
          <p className="pl-12 text-xs font-medium uppercase tracking-[0.14em] text-[#5b6472]">Follow Provident</p>
          <div className="mt-3 flex flex-wrap gap-3 pl-12">
            {wa && <Social href={`https://wa.me/${wa}`} label="WhatsApp" path={siWhatsapp.path} />}
            {SOCIALS.map((s) => (
              <Social key={s.id} href={s.url} label={s.label} path={BRAND[s.id]?.path} />
            ))}
          </div>
        </section>

        {/* save + share, pinned to the bottom */}
        <div className="fixed inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-md gap-3 bg-gradient-to-t from-paper via-paper/95 to-paper/0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
            <button type="button" onClick={save} disabled={saving} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-navy text-[15px] text-white shadow-lg transition-opacity disabled:opacity-70">
              <UserPlus className="size-5 text-[#b0905b]" /> {saving ? "Preparing…" : "Save to phone"}
            </button>
            <button type="button" onClick={share} aria-label="Share" className="flex size-12 items-center justify-center rounded-full border border-[#d4cfc4] bg-white text-navy shadow-lg">
              {shared ? <Check className="size-5" /> : <Share2 className="size-5" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Action({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 border-r border-white/10 py-4 last:border-r-0 hover:bg-white/5 [&_svg]:size-5 [&_svg]:text-[#b0905b]">
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-[0.14em]">{label}</span>
    </a>
  );
}

function Row({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-[#ece7df] py-4 last:border-b-0">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center text-[#5b6472] [&_svg]:size-5 [&_svg]:stroke-[1.5]">{icon}</span>
      <div className="min-w-0 space-y-0.5">
        <div className="text-[15px] leading-snug">{value}</div>
        <div className="text-sm text-[#5b6472]">{label}</div>
      </div>
    </div>
  );
}

function Social({ href, label, path }: { href: string; label: string; path?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex size-11 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-[#b0905b]">
      {path ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
          <path d={path} />
        </svg>
      ) : (
        <span className="text-[15px] font-medium leading-none">in</span>
      )}
    </a>
  );
}
