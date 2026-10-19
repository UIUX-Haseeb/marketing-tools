/** Words and numbers the brochure and the stage page print for a listing. */
import type { Listing } from "./types";

const int = (n: number) => Math.round(n).toLocaleString("en-US");

export const money = (l: Listing) => `${l.currency} ${int(l.price)}`;

/** "per year" on a yearly rental, nothing on a sale. */
export const priceTerm = (l: Listing) =>
  l.offering === "Rent" && l.rentFrequency ? `per ${l.rentFrequency.replace(/ly$/i, "").toLowerCase().replace("dai", "day")}` : "";

/** Short price for tight spots: AED 70K, AED 1.65M, AED 25M. */
export function moneyShort(l: Listing) {
  const p = l.price;
  const v = p >= 1e6 ? `${+(p / 1e6).toFixed(2)}M` : p >= 1e3 ? `${+(p / 1e3).toFixed(0)}K` : int(p);
  return `${l.currency} ${v}`;
}

export const sqft = (n: number | null) => (n ? `${int(n)} sq.ft` : "");

export const bedsLabel = (l: Listing) => (/studio/i.test(l.beds) ? "Studio" : `${l.beds} ${l.beds === "1" ? "Bedroom" : "Bedrooms"}`);
export const bathsLabel = (l: Listing) => `${l.baths} ${l.baths === "1" ? "Bathroom" : "Bathrooms"}`;

/** "1-Bedroom Apartment", "Studio Apartment", "5-Bedroom Villa"; commercial: the space type ("Co-working Space", "Business Centre"). */
export const headline = (l: Listing) =>
  l.segment === "Commercial" || !l.beds ? l.propertyType : /studio/i.test(l.beds) ? `Studio ${l.propertyType}` : `${l.beds}-Bedroom ${l.propertyType}`;

const cheques = (l: Listing) => (l.cheques ? `${l.cheques} ${l.cheques === 1 ? "cheque" : "cheques"}` : "");

/**
 * The four key figures under the headline. Residential: price · bedrooms · bathrooms · built-up
 * (· plot). Commercial has no bedrooms, so: price, then up to three of size · fit-out · plot ·
 * payment — whichever the listing has (the business centre only has a size). `w` is each
 * column's share of the row.
 */
export function keyFigures(l: Listing): { label: string; value: string; w: number }[] {
  const price = { label: l.offering === "Rent" ? "Annual Rent" : "Price", value: money(l), w: 1.7 };
  if (l.segment === "Residential") {
    const area = l.size ? (l.plot ? `${int(l.size)} · ${int(l.plot)}` : sqft(l.size)) : "—";
    return [
      price,
      { label: "Bedrooms", value: /studio/i.test(l.beds) ? "Studio" : l.beds || "—", w: 0.7 },
      { label: "Bathrooms", value: l.baths || "—", w: 0.75 },
      { label: l.plot ? "Built-up · Plot sq.ft" : "Built-up", value: area, w: 1.25 },
    ];
  }
  const rest = [
    { label: "Size", value: sqft(l.size) },
    { label: "Fit-out", value: l.furnishing ?? "" },
    { label: "Plot", value: sqft(l.plot) },
    { label: "Payment", value: l.offering === "Rent" ? cheques(l) : "" },
  ].filter((f) => f.value);
  return [price, ...rest.slice(0, 3).map((f) => ({ ...f, w: 1 }))];
}

export const forLabel = (l: Listing) => (l.offering === "Rent" ? "For Rent" : "For Sale");

/** The building / sub-community line under the headline, without repeating the community. */
export function buildingLine(l: Listing) {
  const parts = [l.tower, l.subCommunity].filter((p): p is string => !!p && p !== l.community);
  return [...new Set(parts)].join(", ");
}

/** "Sobha Hartland · Mohammed Bin Rashid City · Dubai" — most specific first, no repeats. */
export function placeLine(l: Listing, withBuilding = false) {
  const parts = [withBuilding ? l.tower : null, l.subCommunity, l.community, l.city].filter((p): p is string => !!p);
  return [...new Set(parts)].join(" · ");
}

export const communityLine = (l: Listing) => [...new Set([l.community, l.city])].join(" · ");

export function fmtDay(iso: string | null) {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return isNaN(+d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Availability as the brochure says it: a date still ahead, else "Ready to move". */
export function availableLine(l: Listing, today = new Date()) {
  if (!l.availability) return "";
  const d = new Date(`${l.availability}T00:00:00`);
  return d > today ? `From ${fmtDay(l.availability)}` : "Ready to move";
}

/** The spec rows the details page and the pop-out show, empty ones left out. */
export function specRows(l: Listing): { label: string; value: string }[] {
  const rows: [string, string | null | undefined][] = [
    [l.offering === "Rent" ? "Annual Rent" : "Price", `${money(l)}`],
    ["Property Type", l.propertyType],
    ["Offering", l.offeringName],
    ["Bedrooms", l.beds && (/studio/i.test(l.beds) ? "Studio" : l.beds)],
    ["Bathrooms", l.baths],
    [l.segment === "Commercial" ? "Size" : "Built-up Area", sqft(l.size)],
    ["Plot Size", sqft(l.plot)],
    [l.segment === "Commercial" ? "Fit-out" : "Furnishing", l.furnishing],
    ["Payment", l.offering === "Rent" ? cheques(l) : null],
    ["Parking", l.parking ? `${l.parking} ${l.parking === 1 ? "space" : "spaces"}` : null],
    ["Availability", availableLine(l)],
    ["Developer", l.developer],
    ["Reference", l.ref],
  ];
  return rows.filter(([, v]) => !!v).map(([label, value]) => ({ label, value: value as string }));
}
