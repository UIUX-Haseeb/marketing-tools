/** Wording for the marriage post — the Figma reference reads "on his engagement. May this journey ahead be filled with joy, love, and endless blessings. Best Wishes". */
export const OCCASIONS = [
  { id: "wedding", label: "Wedding", noun: "wedding" },
  { id: "engagement", label: "Engagement", noun: "engagement" },
  { id: "marriage", label: "Marriage", noun: "marriage" },
] as const;
export type OccasionId = (typeof OCCASIONS)[number]["id"];

export const COLLEAGUE_GENDERS = [
  { id: "male", label: "He", possessive: "his" },
  { id: "female", label: "She", possessive: "her" },
] as const;
export type GenderId = (typeof COLLEAGUE_GENDERS)[number]["id"];

export const getOccasion = (id: string) => OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[0];
export const getGender = (id: string) => COLLEAGUE_GENDERS.find((g) => g.id === id) ?? COLLEAGUE_GENDERS[0];

export function composeMarriage(input: { occasionId: string; colleagueGender: string }) {
  const o = getOccasion(input.occasionId);
  const g = getGender(input.colleagueGender);
  return `on ${g.possessive} ${o.noun}. May this journey ahead be filled with joy, love, and endless blessings. Best Wishes`;
}
