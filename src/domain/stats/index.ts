// Public surface for the stats module.
// Internal helpers (none currently) are NOT re-exported.

export type { Stat, StatSchema } from "./stat";
export {
  STATS,
  STAT_SCHEMA,
  defaultStat,
  clampStat,
  statAcceptsKind,
} from "./stat";

export type { Modifier, ModifierKind, ModifierSource } from "./modifier";

export { computeStat } from "./compute-stat";

export { Character } from "./character";
