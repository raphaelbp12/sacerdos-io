/**
 * Difficulties (M11). Two for now — `normal` and `hard`.
 *
 * v1 rule (overview): the only loot difference between difficulties is the
 * **item level** (higher on harder). Difficulty therefore contributes flat
 * bonuses to a stage's monster/item level; it never changes the wave *shape*.
 * Per-difficulty extra elements (e.g. hard act 2 → cold) are deferred (D-025).
 */

export type Difficulty = "normal" | "hard";

export interface DifficultyDef {
  readonly id: Difficulty;
  readonly name: string;
  /** Whether the difficulty is playable without unlocking it. */
  readonly unlockedByDefault: boolean;
  /** Added to a stage's base item level. */
  readonly itemLevelBonus: number;
  /** Added to a stage's base monster level. */
  readonly monsterLevelBonus: number;
}

export const DIFFICULTIES: readonly DifficultyDef[] = [
  {
    id: "normal",
    name: "Normal",
    unlockedByDefault: true,
    itemLevelBonus: 0,
    monsterLevelBonus: 0,
  },
  {
    id: "hard",
    name: "Hard",
    unlockedByDefault: false,
    itemLevelBonus: 10,
    monsterLevelBonus: 10,
  },
];

/** Look up a difficulty by id. Throws if the id is unknown. */
export function difficultyById(id: Difficulty): DifficultyDef {
  const def = DIFFICULTIES.find((d) => d.id === id);
  if (!def) throw new Error(`unknown difficulty: ${id}`);
  return def;
}
