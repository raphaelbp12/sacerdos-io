/**
 * Gold on kill (M13) — gold is the main currency.
 *
 * Each kill pays **gold** that scales with the stage and differs by **source**: a weak
 * monster, a strong monster, a stage boss, and an act boss each pay a different amount, and
 * every source is **independently modifiable** (flat + percent) so the rune tree (M18) can buff
 * them separately. Anchors come from the overview: at act 1-1 a weak monster pays `1` and a
 * stage boss pays `10×`; the endgame `1k : 2k` weak/strong ratio fixes `strong = 2 × weak`.
 *
 * The absolute endgame numbers are reached via stage scaling **plus** rune buffs; balancing the
 * curve itself is deferred (D-026).
 */

/** The kind of kill being paid out. Distinct from XP's `KillSource` (weak vs strong split). */
export type GoldSource =
  | "weakMonster"
  | "strongMonster"
  | "stageBoss"
  | "actBoss";

/** Base gold a source pays at stage level 1, before scaling and modifiers. */
const BASE_GOLD: Readonly<Record<GoldSource, number>> = {
  weakMonster: 1,
  strongMonster: 2,
  stageBoss: 10,
  actBoss: 50,
};

/** Per-source gold modifiers (the rune hook). Flat is added before percent multiplies. */
export interface GoldModifiers {
  /** Flat gold added to this kill. */
  readonly flat?: number;
  /** Fractional increase, e.g. `0.5` for +50%. */
  readonly percent?: number;
}

/**
 * Gold a single kill is worth. Base gold for the `source` scales linearly with `stageLevel`,
 * then `flat` is added and `percent` applied — the same flat-then-percent order as the stat
 * engine. The result is floored to a whole gold amount.
 */
export function goldForKill(
  source: GoldSource,
  stageLevel: number,
  modifiers: GoldModifiers = {},
): number {
  if (!Number.isInteger(stageLevel) || stageLevel < 1) {
    throw new Error(`stageLevel must be an integer >= 1, got ${stageLevel}.`);
  }
  const { flat = 0, percent = 0 } = modifiers;
  const scaled = BASE_GOLD[source] * stageLevel;
  return Math.floor((scaled + flat) * (1 + percent));
}
