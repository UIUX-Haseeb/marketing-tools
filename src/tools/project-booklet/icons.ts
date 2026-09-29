/**
 * Line icons for the booklet, picked by keyword so any project's amenity names and detail labels
 * get a sensible icon. First match wins, so the more specific words come first ("Kids Pool" is a
 * kids' icon, not a pool). Anything unknown falls back to Sparkles.
 */
import {
  Activity,
  Baby,
  BedDouble,
  Building2,
  Car,
  ChartPie,
  Clapperboard,
  Coffee,
  ConciergeBell,
  Dumbbell,
  Flame,
  Flower2,
  Footprints,
  Gamepad2,
  HardHat,
  KeyRound,
  Laptop,
  MapPin,
  RulerDimensionLine,
  ShieldCheck,
  ShoppingBag,
  Sofa,
  Sparkles,
  Tag,
  Trees,
  Trophy,
  Umbrella,
  UsersRound,
  WavesLadder,
  type LucideIcon,
} from "lucide-react";

const AMENITY_RULES: [RegExp, LucideIcon][] = [
  [/kid|child|play ?area|nursery/i, Baby],
  [/bbq|barbecue|grill/i, Flame],
  [/gym|fitness|workout|crossfit/i, Dumbbell],
  [/pool|swim|jacuzzi|aqua|splash/i, WavesLadder],
  [/gaming|game|table tennis|billiard|arcade/i, Gamepad2],
  [/cinema|movie|theat/i, Clapperboard],
  [/lounge|majlis/i, Sofa],
  [/club|community|social|party/i, UsersRound],
  [/co-?working|business|office|meeting|study/i, Laptop],
  [/coffee|caf[eé]|bar\b/i, Coffee],
  [/grocery|retail|shop|f&b|restaurant|dining|mall/i, ShoppingBag],
  [/tennis|padel|paddle|court|basketball|football|sport/i, Trophy],
  [/martial|boxing|studio|dance/i, Activity],
  [/yoga|meditation|zen|wellness/i, Flower2],
  [/spa|sauna|steam|massage/i, Sparkles],
  [/jog|running|track|walk/i, Footprints],
  [/garden|park|landscap|green|lawn/i, Trees],
  [/beach|sun ?deck|cabana/i, Umbrella],
  [/security|cctv|guard/i, ShieldCheck],
  [/parking|car|valet/i, Car],
  [/concierge|reception|lobby/i, ConciergeBell],
];

export function amenityIcon(name: string): LucideIcon {
  return AMENITY_RULES.find(([re]) => re.test(name))?.[1] ?? Sparkles;
}

const DETAIL_RULES: [RegExp, LucideIcon][] = [
  [/price/i, Tag],
  [/payment/i, ChartPie],
  [/type/i, Building2],
  [/developer/i, HardHat],
  [/handover|completion/i, KeyRound],
  [/size|sq/i, RulerDimensionLine],
  [/bed/i, BedDouble],
  [/location|community|area/i, MapPin],
];

export function detailIcon(label: string): LucideIcon {
  return DETAIL_RULES.find(([re]) => re.test(label))?.[1] ?? Sparkles;
}
