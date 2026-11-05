/**
 * "Save to phone" on the contact page: a vCard 3.0 with everything on the page — name, title,
 * company, mobile, email, office address, website, BRN — and the profile photo embedded (JPEG,
 * base64), so the phone's contact gets the picture too. iPhone opens it in the "new contact" sheet;
 * Android hands it to Contacts.
 */
import { COMPANY, OFFICE, WEBSITE, digits, type Contact } from "./contact";

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

/** vCard lines over 75 characters continue on the next line after a space (RFC 6350 folding). */
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

/** The photo, square-cropped to 480 px, as base64 JPEG — or null if it can't be drawn. */
export async function photoBase64(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const cv = document.createElement("canvas");
    cv.width = cv.height = 480;
    cv.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 480, 480);
    return cv.toDataURL("image/jpeg", 0.85).split(",")[1] ?? null;
  } catch {
    return null;
  }
}

export function contactVCard(c: Contact, photo: string | null) {
  // first word is the given name, the rest the family name ("Fatima | Al Zahra")
  const [first = "", ...rest] = c.name.trim().split(/\s+/);
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(rest.join(" "))};${esc(first)};;;`,
    `FN:${esc(c.name.trim())}`,
    `ORG:${esc(COMPANY)}`,
    c.title.trim() && `TITLE:${esc(c.title.trim())}`,
    c.phone.trim() && `TEL;TYPE=CELL,VOICE:${digits(c.phone)}`,
    c.email.trim() && `EMAIL;TYPE=INTERNET,WORK:${esc(c.email.trim())}`,
    `ADR;TYPE=WORK:;;${esc(OFFICE.street)};${esc(OFFICE.city)};;;${esc(OFFICE.country)}`,
    `URL:${WEBSITE}`,
    c.brn.trim() && `NOTE:${esc(`BRN ${c.brn.trim()}`)}`,
    photo && fold(`PHOTO;ENCODING=b;TYPE=JPEG:${photo}`),
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Build the vCard and hand it to the phone. */
export async function saveContact(c: Contact) {
  const blob = new Blob([contactVCard(c, await photoBase64(c.photo))], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  if (isIOS()) {
    // Safari previews a .vcf it navigates to as the "new contact" sheet
    location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name.trim().replace(/[^\w\s-]+/g, "").replace(/\s+/g, "-") || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
