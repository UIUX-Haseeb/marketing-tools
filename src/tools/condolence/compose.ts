/**
 * Condolence wording — ported 1:1 from the original General Post Generator (src/lib/condolence.ts).
 * Two mutually exclusive choices (relation, colleague's pronoun) plus the colleague's name
 * produce the exact sentences baked into the artwork's reference.
 */
export const RELATIONS = [
  { id: "mother", label: "mother", pronoun: "her" },
  { id: "father", label: "father", pronoun: "his" },
  { id: "wife", label: "wife", pronoun: "her" },
  { id: "husband", label: "husband", pronoun: "his" },
  { id: "son", label: "son", pronoun: "his" },
  { id: "daughter", label: "daughter", pronoun: "her" },
  { id: "brother", label: "brother", pronoun: "his" },
  { id: "sister", label: "sister", pronoun: "her" },
] as const;
export type RelationId = (typeof RELATIONS)[number]["id"];

export const COLLEAGUE_GENDERS = [
  { id: "male", label: "He", possessive: "his" },
  { id: "female", label: "She", possessive: "her" },
] as const;
export type GenderId = (typeof COLLEAGUE_GENDERS)[number]["id"];

export const getRelation = (id: string) => RELATIONS.find((r) => r.id === id) ?? RELATIONS[0];
export const getGender = (id: string) => COLLEAGUE_GENDERS.find((g) => g.id === id) ?? COLLEAGUE_GENDERS[0];

export function firstName(full: string) {
  const trimmed = full.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.split(" ")[0] : "";
}

function terminate(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function composeCondolence(input: { relationId: string; colleagueGender: string; colleagueName: string }) {
  const relation = getRelation(input.relationId);
  const gender = getGender(input.colleagueGender);
  const first = firstName(input.colleagueName);
  return {
    lead: `${relation.label} of our colleague`,
    name: terminate(input.colleagueName),
    // Word for word the wording baked into the supplied artwork, with pronouns and name filled in.
    message: `May ${relation.pronoun} soul rest in eternal peace. Our thoughts and prayers are with ${first} and ${gender.possessive} family in this difficult time.`,
  };
}
