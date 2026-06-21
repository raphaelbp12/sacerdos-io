import type { ModifierSource } from "../stats";
import { Character } from "../stats";
import type { ClassDef } from "./class-def";
import { baseStatsForLevel } from "./level";
import type { Build } from "./skill-points";

/**
 * Composes a `Character` from a class, a level, an optional point `Build`, and
 * any extra modifier sources (equipped items, buffs).
 *
 * Keeps `Character` generic: base stats come from `baseStatsForLevel(...)`, and
 * the build is passed as a live `ModifierSource` so refunds / re-spends show up
 * on the next `getStat()`. Extra sources stack on top in the order given.
 */
export function createCharacter(
  classDef: ClassDef,
  level: number,
  build?: Build,
  extraSources: readonly ModifierSource[] = [],
): Character {
  const baseStats = baseStatsForLevel(classDef, level);
  const sources: ModifierSource[] = build
    ? [build, ...extraSources]
    : [...extraSources];
  return new Character(baseStats, sources, level);
}
