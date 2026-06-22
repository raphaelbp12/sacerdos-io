/**
 * Persistence DTOs (M20).
 *
 * The plain, JSON-safe shapes the player's durable state serializes to, plus the
 * live {@link GameState} aggregate the shell owns. This module lives in the
 * **outer layer** (`src/persistence/`, not `src/domain/`) so the domain stays
 * pure — persistence depends inward on the domain, never the reverse.
 *
 * Design: the save is the **source of truth**; live combatants are recomputed
 * from recipes on load (compute-don't-store). Items are already pure data, so
 * inventory / stash / equipment persist by copying the item objects (DRY).
 */

import type { Item, EquipmentSlot } from "../domain/items";
import type { DamageElement } from "../domain/combat";
import type { Difficulty, StagePosition } from "../domain/stages";
import type { Wallet } from "../domain/economy";
import type { RuneState } from "../domain/runes";
import type { Inventory, Stash } from "../domain/items";

/** Bumped whenever the {@link SaveState} shape changes (D-035 covers migrations). */
export const SAVE_VERSION = 1;

/** A character's chosen skill, persisted by id + rank (the heavy def stays in the registry). */
export interface SavedSkill {
  readonly id: string;
  readonly rank: number;
}

/**
 * A character persisted as a **recipe** — never a live `Combatant`. On load,
 * `buildMember` rehydrates it through `createCharacter` + `Equipment.equip`.
 */
export interface SavedCharacter {
  /** Stable roster identity. */
  readonly id: string;
  /** Display name (becomes the combatant's name). */
  readonly name: string;
  /** Class registry id (e.g. `"knight"`). */
  readonly classId: string;
  /** Character level — drives base stats and the point budget. */
  readonly level: number;
  /** Point allocation: passive/skill node id → ranks (replayed via `Build.spend`). */
  readonly build: Readonly<Record<string, number>>;
  /** Equipped items by slot (items are pure data, copied verbatim). */
  readonly equipment: Readonly<Partial<Record<EquipmentSlot, Item>>>;
  /** Auto-cast damage skills (default: none). */
  readonly skills?: readonly SavedSkill[];
  /** Element of basic attacks (default: physical). */
  readonly attackElement?: DamageElement;
}

/** A group persisted as its capacity + ordered formation (member ids, front-to-back). */
export interface SavedGroup {
  readonly id: string;
  readonly capacity: number;
  readonly formation: readonly string[];
}

/** Latest-stage progression state. */
export interface ProgressionState {
  readonly position: StagePosition;
  readonly difficulty: Difficulty;
  readonly clearedNormalFinalActBoss: boolean;
}

/** A serialized inventory: capacity (`null` = unlimited / `Infinity`) + its items in order. */
export interface InventoryDto {
  readonly capacity: number | null;
  readonly items: readonly Item[];
}

/** A serialized stash: the (uniform) per-tab capacity + each tab's items in order. */
export interface StashDto {
  readonly capacityPerTab: number | null;
  readonly tabs: readonly (readonly Item[])[];
}

/** The full, JSON-safe save object. `Infinity` is encoded as `null` in capacities. */
export interface SaveState {
  readonly version: number;
  readonly progression: ProgressionState;
  readonly wallet: { readonly balance: number };
  readonly runes: { readonly levels: Readonly<Record<string, number>> };
  readonly cubeLevel: number;
  readonly inventory: InventoryDto;
  readonly stash: StashDto;
  readonly characters: readonly SavedCharacter[];
  readonly groups: readonly SavedGroup[];
  readonly heroSlots: number;
  readonly groupSlots: number;
}

/**
 * The live aggregate the shell owns. Holds live domain objects where they exist
 * (`Wallet`, `RuneState`, `Inventory`, `Stash`) and **recipes** for characters /
 * groups (the live `Roster` is rebuilt on demand via `buildRoster`).
 */
export interface GameState {
  readonly progression: ProgressionState;
  readonly wallet: Wallet;
  readonly runes: RuneState;
  readonly cubeLevel: number;
  readonly inventory: Inventory;
  readonly stash: Stash;
  readonly characters: readonly SavedCharacter[];
  readonly groups: readonly SavedGroup[];
  readonly heroSlots: number;
  readonly groupSlots: number;
}
