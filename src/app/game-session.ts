/**
 * GameSession — the application/orchestration layer (the seam the UI shell wraps).
 *
 * It owns the live game state and exposes the **player actions** the screens map to
 * (equip, allocate points, play a stage, open chests, synthesize, sell, buy runes,
 * save / load, simulate offline). Time and randomness are **injected** (`Rng`, and the
 * battle's own `Clock`-driven tick), so a whole flow is deterministic under a seed —
 * which is exactly what makes the integration tests reproducible without a DOM.
 *
 * Outer layer: `app → persistence → offline → domain`. Nothing under `src/domain/`
 * (or `src/persistence/`) imports this; the dependency only ever points inward.
 *
 * It deliberately holds **no game rules** — every decision is delegated to the domain
 * (compute-don't-store, data-not-code). Characters live as **recipes** (`SavedCharacter`)
 * and are rehydrated into live combatants on read via the M20 `buildMember` pipeline.
 */

import type {
  GameState,
  SaveState,
  SavedCharacter,
  SavedGroup,
  ProgressionState,
} from "../persistence";
import {
  serialize,
  deserialize,
  buildMember,
  buildRoster,
  buildGroupRoster,
} from "../persistence";

import type { Rng } from "../domain/rng";
import type { Stat } from "../domain/stats";
import { STATS } from "../domain/stats";
import type { Item, EquipmentSlot } from "../domain/items";
import {
  Inventory,
  Stash,
  Equipment,
  EQUIPMENT_SLOTS,
  generateItem,
} from "../domain/items";
import { Wallet } from "../domain/economy";
import { goldForKill } from "../domain/economy";
import type { GoldSource } from "../domain/economy";
import { RuneState } from "../domain/runes";
import { Build } from "../domain/character";
import { DEFAULT_HERO_SLOTS } from "../domain/roster";
import {
  DEFAULT_GROUP_SLOTS,
  DEFAULT_FORMATION_CAPACITY,
} from "../domain/roster";
import { StageRunner } from "../domain/battle";
import type { StageStatus } from "../domain/battle";
import {
  actByIndex,
  stageAt,
  buildStageWaves,
  stageItemLevel,
  stageMonsterLevel,
  xpForKill,
  advance,
  retreat,
} from "../domain/stages";
import type { StagePosition } from "../domain/stages";
import type { Difficulty } from "../domain/stages";
import { synthesize as synthesizeItems, sellValue } from "../domain/cube";
import type { SynthesisResult, Threshold } from "../domain/cube";
import { firstChest, openChest as drawChestItem } from "../domain/loot";
import type { Chest } from "../domain/loot";
import { simulateElapsed } from "../offline";
import type { OfflineReport, OfflineOptions } from "../offline";

/** Default inventory capacity for a fresh game (placeholder; rune-wired later — D-039). */
export const DEFAULT_INVENTORY_CAPACITY = 40;
/** Default per-tab stash capacity for a fresh game (placeholder — D-039). */
export const DEFAULT_STASH_TAB_CAPACITY = 40;
/** The starter class every default game begins with. */
export const STARTER_CLASS_ID = "knight";
/** The class's guaranteed first-drop weapon base id. */
export const STARTER_WEAPON_BASE_ID = "short-sword";

/** Battle-tick granularity used when running a stage to completion. */
const PLAY_TICK_STEP_MS = 100;
/** Safety cap so a never-resolving fight can't hang `playStage`. */
const MAX_STAGE_MS = 30 * 60 * 1000;

/** What clearing (or wiping) a stage paid out. Pure data the caller may surface. */
export interface StageReport {
  /** `"cleared"` or `"wiped"` — never `"ongoing"` once `playStage` returns. */
  readonly status: Exclude<StageStatus, "ongoing">;
  readonly gold: number;
  /** Pooled XP earned (reported only; no per-character home yet — D-037). */
  readonly xp: number;
  /** Chests dropped by the clear (added to {@link GameSession.pendingChests}). */
  readonly chests: readonly Chest[];
}

export class GameSession {
  declare readonly rng: Rng;
  declare private progression: ProgressionState;
  declare private readonly wallet: Wallet;
  declare private readonly runes: RuneState;
  declare private cubeLevel: number;
  declare private readonly inventory: Inventory;
  declare private readonly stash: Stash;
  declare private characters: SavedCharacter[];
  declare private groups_: SavedGroup[];
  declare private heroSlots: number;
  declare private groupSlots: number;
  private readonly chests: Chest[] = [];
  private firstChestDropped = false;

  constructor(state: GameState, rng: Rng) {
    this.rng = rng;
    this.progression = state.progression;
    this.wallet = state.wallet;
    this.runes = state.runes;
    this.cubeLevel = state.cubeLevel;
    this.inventory = state.inventory;
    this.stash = state.stash;
    this.characters = [...state.characters];
    this.groups_ = [...state.groups];
    this.heroSlots = state.heroSlots;
    this.groupSlots = state.groupSlots;
  }

  /** Re-assemble the live {@link GameState} aggregate (for serialize / offline). */
  get gameState(): GameState {
    return {
      progression: this.progression,
      wallet: this.wallet,
      runes: this.runes,
      cubeLevel: this.cubeLevel,
      inventory: this.inventory,
      stash: this.stash,
      characters: this.characters,
      groups: this.groups_,
      heroSlots: this.heroSlots,
      groupSlots: this.groupSlots,
    };
  }

  // ── reads ───────────────────────────────────────────────────────────────────

  get gold(): number {
    return this.wallet.balance;
  }

  get characterIds(): readonly string[] {
    return this.characters.map((c) => c.id);
  }

  get inventoryItems(): readonly Item[] {
    return this.inventory.items;
  }

  get position(): StagePosition {
    return this.progression.position;
  }

  get pendingChests(): readonly Chest[] {
    return this.chests;
  }

  /** The active difficulty (drives monster / item level). */
  get difficulty(): Difficulty {
    return this.progression.difficulty;
  }

  /** The owned groups (read-only recipes; formation order drives battle position). */
  get groups(): readonly SavedGroup[] {
    return this.groups_;
  }

  /** Total inventory slot capacity (placeholder; rune-wired later — D-039). */
  get inventoryCapacity(): number {
    return this.inventory.capacity;
  }

  /** A character's saved recipe (class / level / build / equipment) for display. */
  character(charId: string): SavedCharacter {
    return this.requireCharacter(charId);
  }

  /** Final stats of a character, rehydrated from its recipe (compute-don't-store). */
  statsOf(charId: string): Record<Stat, number> {
    const member = buildMember(this.requireCharacter(charId));
    const out = {} as Record<Stat, number>;
    for (const stat of STATS) out[stat] = member.combatant.getStat(stat);
    return out;
  }

  /** Skill points the character can still spend (earned − spent). */
  availablePoints(charId: string): number {
    const saved = this.requireCharacter(charId);
    const spent = Object.values(saved.build).reduce((a, b) => a + b, 0);
    return saved.level - spent;
  }

  runeLevel(nodeId: string): number {
    return this.runes.levelOf(nodeId);
  }

  // ── inventory / dev helpers ───────────────────────────────────────────────────

  /** Add an item to the inventory; returns `false` (no-op) when the bag is full. */
  grantItem(item: Item): boolean {
    return this.inventory.add(item);
  }

  /** Add gold to the wallet (dev / reward helper). */
  addGold(amount: number): void {
    this.wallet.add(amount);
  }

  /** Generate a random item into the inventory (dev helper); returns it, or
   * `undefined` when the bag is full. Uses the injected `Rng` (deterministic). */
  grantRandomItem(itemLevel = 1): Item | undefined {
    const item = generateItem(this.rng, { itemLevel });
    return this.inventory.add(item) ? item : undefined;
  }

  // ── character actions ─────────────────────────────────────────────────────────

  /** Equip an inventory item onto a character; hard-blocks below level (throws). */
  equip(charId: string, item: Item): void {
    const saved = this.requireCharacter(charId);
    if (!this.inventory.items.includes(item)) {
      throw new Error(`item "${item.name}" is not in the inventory`);
    }
    // Rebuild a live Equipment from the recipe, then equip (reuses the hard-block rule).
    const equipment = new Equipment();
    for (const slot of EQUIPMENT_SLOTS) {
      const equipped = saved.equipment[slot];
      if (equipped) equipment.equip(equipped, saved.level);
    }
    const displaced = equipment.equip(item, saved.level); // throws on level block

    const nextEquipment: Partial<Record<EquipmentSlot, Item>> = {};
    for (const slot of EQUIPMENT_SLOTS) {
      const equipped = equipment.getEquipped(slot);
      if (equipped) nextEquipment[slot] = equipped;
    }

    this.inventory.remove(item);
    if (displaced) this.inventory.add(displaced);
    this.updateCharacter(charId, { equipment: nextEquipment });
  }

  /** Unequip a slot back to the inventory; throws if the bag has no room. */
  unequip(charId: string, slot: EquipmentSlot): Item | undefined {
    const saved = this.requireCharacter(charId);
    const item = saved.equipment[slot];
    if (!item) return undefined;
    if (!this.inventory.add(item)) {
      throw new Error("cannot unequip: inventory is full");
    }
    const nextEquipment = { ...saved.equipment };
    delete nextEquipment[slot];
    this.updateCharacter(charId, { equipment: nextEquipment });
    return item;
  }

  /** Spend one skill point into a build node (delegates the rules to `Build`). */
  allocate(charId: string, nodeId: string): void {
    const saved = this.requireCharacter(charId);
    const build = this.replayBuild(saved);
    build.spend(nodeId); // validates band / cap / available points (throws)
    const nextBuild = {
      ...saved.build,
      [nodeId]: (saved.build[nodeId] ?? 0) + 1,
    };
    this.updateCharacter(charId, { build: nextBuild });
  }

  /** Refund one skill point from a build node back to the pool. */
  refund(charId: string, nodeId: string): void {
    const saved = this.requireCharacter(charId);
    const current = saved.build[nodeId] ?? 0;
    if (current <= 0) throw new Error(`"${nodeId}" has no ranks to refund`);
    const nextBuild = { ...saved.build };
    if (current - 1 === 0) delete nextBuild[nodeId];
    else nextBuild[nodeId] = current - 1;
    this.updateCharacter(charId, { build: nextBuild });
  }

  // ── battle loop ───────────────────────────────────────────────────────────────

  /** Point the session at a specific stage (the player's stage selector). */
  selectStage(actIndex: number, stageIndex: number): void {
    this.progression = {
      ...this.progression,
      position: { actIndex, stageIndex },
    };
  }

  /**
   * Run the current stage to completion with the active group. On a clear: awards gold,
   * reports pooled xp, drops a chest, and advances one stage. On a wipe: retreats one
   * stage (never below 1-1) and pays nothing. Deterministic under the injected `Rng`.
   */
  playStage(): StageReport {
    const group = buildGroupRoster(this.gameState).groups[0];
    if (!group || group.size === 0) {
      throw new Error("no active group to field");
    }
    const { actIndex, stageIndex } = this.progression.position;
    const difficulty = this.progression.difficulty;
    const act = actByIndex(actIndex);
    const stage = stageAt(actIndex, stageIndex);

    const party = group.buildParty(buildRoster(this.gameState));
    const runner = new StageRunner(
      party,
      buildStageWaves(act, stage, difficulty),
      this.rng,
    );

    let elapsed = 0;
    while (runner.status === "ongoing" && elapsed < MAX_STAGE_MS) {
      runner.tick(PLAY_TICK_STEP_MS);
      elapsed += PLAY_TICK_STEP_MS;
    }

    if (runner.status !== "cleared") {
      this.progression = {
        ...this.progression,
        position: retreat(this.progression.position),
      };
      return { status: "wiped", gold: 0, xp: 0, chests: [] };
    }

    const level = stageMonsterLevel(stage, difficulty);
    const monsterSource: GoldSource =
      stage.index <= 5 ? "weakMonster" : "strongMonster";
    const monsterGold = goldForKill(
      monsterSource,
      level,
      this.runes.goldModifiersFor("monster"),
    );
    const bossGold = goldForKill(
      "stageBoss",
      level,
      this.runes.goldModifiersFor("boss"),
    );
    const monsterXp = xpForKill("monster", stage.xpPerMonster);
    const bossXp = xpForKill("stageBoss", stage.xpPerMonster);
    const regularMonsters = runner.totalMonsters - 1; // last "monster" is the stage boss
    const gold = regularMonsters * monsterGold + bossGold;
    const xp = regularMonsters * monsterXp + bossXp;

    const chest: Chest = this.firstChestDropped
      ? { tier: "common" }
      : firstChest(STARTER_WEAPON_BASE_ID);
    this.firstChestDropped = true;
    this.chests.push(chest);

    this.wallet.add(gold);
    this.progression = {
      ...this.progression,
      position: advance(this.progression.position),
    };

    return { status: "cleared", gold, xp, chests: [chest] };
  }

  /** Open the next pending chest into the inventory; throws when the bag is full. */
  openChest(): Item {
    const chest = this.chests[0];
    if (!chest) throw new Error("no chest to open");
    if (!this.inventory.hasSpace()) {
      throw new Error("cannot open chest: inventory is full");
    }
    const stage = stageAt(
      this.progression.position.actIndex,
      this.progression.position.stageIndex,
    );
    const itemLevel = stageItemLevel(stage, this.progression.difficulty);
    const item = drawChestItem(chest, this.rng, itemLevel);
    this.inventory.add(item);
    this.chests.shift();
    return item;
  }

  // ── cube + runes ──────────────────────────────────────────────────────────────

  /** Recycle items into one of the next rarity; consumes the inputs only on success. */
  synthesize(items: readonly Item[], threshold: Threshold): SynthesisResult {
    for (const item of items) {
      if (!this.inventory.items.includes(item)) {
        throw new Error(`item "${item.name}" is not in the inventory`);
      }
    }
    const result = synthesizeItems(this.rng, items, { threshold });
    if (result.ok) {
      for (const item of items) this.inventory.remove(item);
      this.inventory.add(result.item);
    }
    return result;
  }

  /** Melt an inventory item into gold; returns the gold gained. */
  sell(item: Item): number {
    if (!this.inventory.items.includes(item)) {
      throw new Error(`item "${item.name}" is not in the inventory`);
    }
    const value = sellValue(item);
    this.inventory.remove(item);
    this.wallet.add(value);
    return value;
  }

  /** Buy one level of a rune node, spending gold (throws if unaffordable / maxed). */
  buyRune(nodeId: string): number {
    const cost = this.runes.costToBuy(nodeId); // throws if maxed
    this.wallet.spend(cost); // throws if unaffordable — no purchase happens
    this.runes.buy(nodeId);
    return cost;
  }

  // ── persistence + offline ─────────────────────────────────────────────────────

  /** Flatten the live state to a JSON-safe save object. */
  save(): SaveState {
    return serialize(this.gameState);
  }

  /**
   * Apply offline farming for `deltaMs`: simulates the current stage (pure), then banks
   * the report's gold and items into the live state. Returns the report.
   */
  simulateOffline(deltaMs: number, options?: OfflineOptions): OfflineReport {
    const report = simulateElapsed(this.gameState, deltaMs, this.rng, options);
    this.wallet.add(report.gold);
    for (const item of report.items) this.inventory.add(item);
    return report;
  }

  // ── internals ─────────────────────────────────────────────────────────────────

  private requireCharacter(charId: string): SavedCharacter {
    const saved = this.characters.find((c) => c.id === charId);
    if (!saved) throw new Error(`unknown character "${charId}"`);
    return saved;
  }

  private updateCharacter(
    charId: string,
    patch: Partial<SavedCharacter>,
  ): void {
    this.characters = this.characters.map((c) =>
      c.id === charId ? { ...c, ...patch } : c,
    );
  }

  /** Rebuild a live `Build` from a recipe (replays the spent ranks). */
  private replayBuild(saved: SavedCharacter): Build {
    const build = new Build(saved.level);
    for (const [id, ranks] of Object.entries(saved.build)) {
      for (let i = 0; i < ranks; i++) build.spend(id);
    }
    return build;
  }
}

/**
 * Build a brand-new game: one Knight in one group, empty bags, no gold, parked at
 * act 1 / stage 1 on normal (overview: "1 group, 1 character created by default").
 */
export function createInitialGame(rng: Rng): GameSession {
  const hero: SavedCharacter = {
    id: "hero-1",
    name: "Knight",
    classId: STARTER_CLASS_ID,
    level: 1,
    build: {},
    equipment: {},
    attackElement: "physical",
  };
  const group: SavedGroup = {
    id: "group-1",
    capacity: DEFAULT_FORMATION_CAPACITY,
    formation: [hero.id],
  };
  const state: GameState = {
    progression: {
      position: { actIndex: 1, stageIndex: 1 },
      difficulty: "normal",
      clearedNormalFinalActBoss: false,
    },
    wallet: new Wallet(0),
    runes: new RuneState(),
    cubeLevel: 0,
    inventory: new Inventory(DEFAULT_INVENTORY_CAPACITY),
    stash: new Stash(1, DEFAULT_STASH_TAB_CAPACITY),
    characters: [hero],
    groups: [group],
    heroSlots: DEFAULT_HERO_SLOTS,
    groupSlots: DEFAULT_GROUP_SLOTS,
  };
  return new GameSession(state, rng);
}

/** Rebuild a live session from a save object. */
export function loadGame(save: SaveState, rng: Rng): GameSession {
  return new GameSession(deserialize(save), rng);
}
