import type { Modifier, ModifierSource } from "../stats";
import type { RunePerk, RuneNode } from "./rune-node";
import { runeCostAt } from "./rune-node";
import { RUNE_TREE } from "./rune-tree";

/** Which gold sources a flat gold perk applies to. Kept local to avoid coupling to `economy`. */
export type RuneGoldKind = "monster" | "boss";

/** Shape consumed by `goldForKill` (≈ economy's `GoldModifiers`); structural, no import. */
export interface RuneGoldModifiers {
  readonly flat: number;
  readonly percent: number;
}

/** Shape consumed by `effectiveRespawnMs` (≈ revive's `RespawnReduction`); structural, no import. */
export interface RuneRespawnReduction {
  readonly flatMs: number;
  readonly percent: number;
}

/** Shape consumed by `cubeExpForItem` (≈ cube's `CubeExpOptions`); structural, no import. */
export interface RuneCubeExpOptions {
  readonly expBonus: number;
}

/**
 * The player's purchased rune levels (M18). Holds the only stateful bit — a level per node —
 * and derives everything else on read (compute-don't-store).
 *
 * - As a `ModifierSource`, its stat nodes flow straight into `getStat` like passives/items.
 * - Its non-stat perks are summed by {@link perkValue} and shaped by the hook adapters below,
 *   each returning an object that **structurally** matches the consuming system's param so this
 *   module never imports `economy` / `revive` / `loot` / `cube` (one-way deps preserved).
 */
export class RuneState implements ModifierSource {
  private readonly levels = new Map<string, number>();
  private readonly nodesById: Map<string, RuneNode>;

  constructor(nodes: readonly RuneNode[] = RUNE_TREE) {
    this.nodesById = new Map(nodes.map((n) => [n.id, n]));
  }

  private node(id: string): RuneNode {
    const node = this.nodesById.get(id);
    if (!node) throw new Error(`RuneState: unknown rune node "${id}"`);
    return node;
  }

  /** Levels currently bought into `id` (0 if untouched). */
  levelOf(id: string): number {
    return this.levels.get(id) ?? 0;
  }

  /** Whether `id` has been bought to its `maxLevel`. */
  isMaxed(id: string): boolean {
    return this.levelOf(id) >= this.node(id).maxLevel;
  }

  /** Gold cost of the *next* level of `id`. Throws when the node is maxed. */
  costToBuy(id: string): number {
    return runeCostAt(this.node(id), this.levelOf(id));
  }

  /**
   * Buys one level of `id` and returns the gold it cost (the caller debits the wallet — runes
   * stay decoupled from `economy`). Throws when the node is already maxed.
   */
  buy(id: string): number {
    const current = this.levelOf(id);
    const cost = runeCostAt(this.node(id), current); // throws if maxed
    this.levels.set(id, current + 1);
    return cost;
  }

  /** Stat nodes → modifiers (`perLevel × level`). Picked up by `getStat` like any source. */
  getModifiers(): readonly Modifier[] {
    const mods: Modifier[] = [];
    for (const node of this.nodesById.values()) {
      const level = this.levelOf(node.id);
      if (level <= 0 || node.effect.kind !== "stat") continue;
      mods.push({
        attribute: node.effect.stat,
        kind: node.effect.modifierKind,
        value: node.effect.perLevel * level,
      });
    }
    return mods;
  }

  /** Summed value of a non-stat perk across all nodes (`perLevel × level`). */
  perkValue(perk: RunePerk): number {
    let total = 0;
    for (const node of this.nodesById.values()) {
      const level = this.levelOf(node.id);
      if (level <= 0 || node.effect.kind !== "perk") continue;
      if (node.effect.perk === perk) total += node.effect.perLevel * level;
    }
    return total;
  }

  // ── Hook adapters (structural matches; no sibling imports) ───────────────────

  /** Gold modifiers for a kill, for `goldForKill`. Monster vs boss picks the flat perk. */
  goldModifiersFor(kind: RuneGoldKind): RuneGoldModifiers {
    return {
      flat:
        kind === "boss"
          ? this.perkValue("goldFlatBoss")
          : this.perkValue("goldFlatMonster"),
      percent: this.perkValue("goldPercent"),
    };
  }

  /** Respawn shortening for `effectiveRespawnMs`. */
  respawnReduction(): RuneRespawnReduction {
    return {
      flatMs: this.perkValue("respawnFlatMs"),
      percent: this.perkValue("respawnPercent"),
    };
  }

  /** Cube-EXP bonus for `cubeExpForItem`. */
  cubeExpOptions(): RuneCubeExpOptions {
    return { expBonus: this.perkValue("cubeExpPercent") };
  }

  /** Inventory capacity = base + bought inventory slots. */
  inventoryCapacity(base: number): number {
    return base + this.perkValue("inventorySlots");
  }

  /** Unopened-chest capacity = base + bought chest capacity. */
  chestCapacity(base: number): number {
    return base + this.perkValue("chestCapacity");
  }

  /** Stash tab count = base + bought stash tabs. */
  stashTabCount(base: number): number {
    return base + this.perkValue("stashTabs");
  }

  /** Bonus drop chance (fraction). Read by the drop layer when it gains the hook (D-033). */
  dropChanceBonus(): number {
    return this.perkValue("dropChance");
  }

  /** Skill slots = base + bought skill slots. */
  skillSlots(base: number): number {
    return base + this.perkValue("skillSlots");
  }

  /** Hero slots = base + bought hero slots. */
  heroSlots(base: number): number {
    return base + this.perkValue("heroSlots");
  }

  /** Group slots = base + bought group slots. */
  groupSlots(base: number): number {
    return base + this.perkValue("groupSlots");
  }
}
