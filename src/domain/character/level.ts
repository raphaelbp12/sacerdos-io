import type { Stat } from "../stats";
import type { ClassDef } from "./class-def";

/**
 * Computes a character's BASE stats for a given class and level.
 *
 * base[stat] = baseStatsAtLevel1[stat] + perLevelGains[stat] * (level - 1)
 *
 * Pure: never mutates the class definition. The result is fed to a `Character`
 * as its `baseStats`; gear, buffs and passives layer on top as modifiers.
 */
export function baseStatsForLevel(
  classDef: ClassDef,
  level: number,
): Partial<Record<Stat, number>> {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error(`Level must be an integer >= 1 (got ${level}).`);
  }

  const result: Partial<Record<Stat, number>> = {
    ...classDef.baseStatsAtLevel1,
  };
  for (const [stat, gain] of Object.entries(classDef.perLevelGains) as [
    Stat,
    number,
  ][]) {
    result[stat] = (result[stat] ?? 0) + gain * (level - 1);
  }
  return result;
}
