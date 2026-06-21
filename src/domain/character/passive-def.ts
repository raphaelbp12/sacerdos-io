import type { Stat, Modifier, ModifierKind, ModifierSource } from "../stats";
import type { ChoiceNode } from "./choice-node";

/**
 * A passive as DATA: a build choice that, per rank, emits one `Modifier` per
 * target stat. Adding a passive is a new row in `KNIGHT_PASSIVES`, never new
 * engine code (data-not-code).
 *
 * Value model: a rank-`r` passive contributes `perLevel * r` to each target.
 * `kind` follows the stat schema — fraction stats (damage, resists, block) use
 * `flat` (their values sum), while multiplicative stats use `percentage`.
 */
export interface PassiveDef extends ChoiceNode {
  readonly label: string;
  readonly targets: readonly Stat[];
  readonly kind: ModifierKind;
  readonly perLevel: number;
}

const ELEMENTAL_RESISTS: readonly Stat[] = [
  "fireResist",
  "coldResist",
  "lightningResist",
  "chaosResist",
];

/**
 * The Knight's seven passives, assigned to bands 2/2/2/1 (confirmed with design):
 *   band 1 — increase attack, increase hp
 *   band 2 — increase damage %, increase armor
 *   band 3 — increase attack speed %, increase block chance
 *   band 4 — increase elemental resistance %
 */
export const KNIGHT_PASSIVES: readonly PassiveDef[] = [
  // ── Band 1 ────────────────────────────────────────────────────────────────
  {
    id: "attack",
    label: "Increase attack",
    band: 1,
    maxRank: 10,
    targets: ["attack"],
    kind: "flat",
    perLevel: 2,
  },
  {
    id: "hp",
    label: "Increase hp",
    band: 1,
    maxRank: 10,
    targets: ["hp"],
    kind: "flat",
    perLevel: 15,
  },
  // ── Band 2 ────────────────────────────────────────────────────────────────
  {
    id: "damage",
    label: "Increase damage %",
    band: 2,
    maxRank: 10,
    targets: ["damage"],
    kind: "flat",
    perLevel: 0.03,
  },
  {
    id: "armor",
    label: "Increase armor",
    band: 2,
    maxRank: 10,
    targets: ["armor"],
    kind: "flat",
    perLevel: 15,
  },
  // ── Band 3 ────────────────────────────────────────────────────────────────
  {
    id: "attack-speed",
    label: "Increase attack speed %",
    band: 3,
    maxRank: 10,
    targets: ["attackSpeed"],
    kind: "percentage",
    perLevel: 0.02,
  },
  {
    id: "block-chance",
    label: "Increase block chance",
    band: 3,
    maxRank: 10,
    targets: ["blockChance"],
    kind: "flat",
    perLevel: 0.03,
  },
  // ── Band 4 ────────────────────────────────────────────────────────────────
  {
    id: "elemental-resist",
    label: "Increase elemental resistance %",
    band: 4,
    maxRank: 5,
    targets: ELEMENTAL_RESISTS,
    kind: "flat",
    perLevel: 0.1,
  },
];

/**
 * Turns a passive rank allocation into modifiers.
 *
 * Held by reference like any `ModifierSource`, so editing the ranks (refund /
 * re-spec) is reflected on the next `getStat()` — no invalidation needed.
 */
export class PassiveAllocation implements ModifierSource {
  private readonly ranks: Readonly<Record<string, number>>;
  private readonly defs: readonly PassiveDef[];

  constructor(
    ranks: Readonly<Record<string, number>>,
    defs: readonly PassiveDef[] = KNIGHT_PASSIVES,
  ) {
    this.ranks = ranks;
    this.defs = defs;
  }

  getModifiers(): readonly Modifier[] {
    const mods: Modifier[] = [];
    for (const def of this.defs) {
      const rank = this.ranks[def.id] ?? 0;
      if (rank <= 0) continue;
      const value = def.perLevel * rank;
      for (const stat of def.targets) {
        mods.push({ attribute: stat, kind: def.kind, value });
      }
    }
    return mods;
  }
}
