import type { Stat } from "../stats";

/**
 * A character class as DATA — not a subclass.
 *
 * A class defines how a character's BASE stats grow with level. Everything else
 * (passives, skills, gear) layers on top as modifiers. Adding a class is a new
 * row in `CLASSES`, never new engine code (data-not-code).
 *
 * Base stats at level L are: baseStatsAtLevel1[stat] + perLevelGains[stat] * (L - 1).
 */
export interface ClassDef {
  readonly id: string;
  readonly name: string;
  readonly baseStatsAtLevel1: Readonly<Partial<Record<Stat, number>>>;
  readonly perLevelGains: Readonly<Partial<Record<Stat, number>>>;
}

/**
 * The Knight — the v1 starter class. Simple, defensive per-level progression
 * (overview: "keep the knight's per-level progression simple: increase hp,
 * attack and armor").
 */
export const KNIGHT: ClassDef = {
  id: "knight",
  name: "Knight",
  baseStatsAtLevel1: { hp: 100, attack: 10, armor: 10 },
  perLevelGains: { hp: 10, attack: 1, armor: 3 },
};

/** All playable classes (only the Knight for now — see D-013). */
export const CLASSES: readonly ClassDef[] = [KNIGHT];
