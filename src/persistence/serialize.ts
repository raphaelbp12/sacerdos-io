/**
 * Save / load mapper (M20) — pure DTO ↔ domain, in the outer layer.
 *
 * `serialize` flattens a live {@link GameState} to a JSON-safe {@link SaveState};
 * `deserialize` rebuilds the live domain objects from it. Characters persist as
 * recipes and are rehydrated into live combatants by {@link buildRoster} through
 * the existing `createCharacter` pipeline (compute-don't-store, DRY).
 *
 * One-way deps: `persistence → domain`; nothing in the domain imports this.
 */

import type {
  GameState,
  SaveState,
  InventoryDto,
  StashDto,
  SavedCharacter,
} from "./save-state";
import { SAVE_VERSION } from "./save-state";

import { Wallet } from "../domain/economy";
import { RuneState, RUNE_TREE } from "../domain/runes";
import { Inventory, Stash, Equipment, EQUIPMENT_SLOTS } from "../domain/items";
import { asCombatant } from "../domain/combat";
import { skillById } from "../domain/skills";
import { Build, createCharacter, CLASSES } from "../domain/character";
import type { ClassDef } from "../domain/character";
import { Roster, Group, GroupRoster } from "../domain/roster";
import type { RosterMember } from "../domain/roster";

// ── capacity helpers (Infinity is not JSON-representable) ────────────────────

const capToDto = (n: number): number | null => (n === Infinity ? null : n);
const capFromDto = (v: number | null): number => (v === null ? Infinity : v);

// ── piece-wise serialize ─────────────────────────────────────────────────────

function serializeRunes(runes: RuneState): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const node of RUNE_TREE) {
    const level = runes.levelOf(node.id);
    if (level > 0) levels[node.id] = level;
  }
  return levels;
}

function serializeInventory(inv: Inventory): InventoryDto {
  return { capacity: capToDto(inv.capacity), items: [...inv.items] };
}

function serializeStash(stash: Stash): StashDto {
  return {
    capacityPerTab: capToDto(stash.tabs[0].capacity),
    tabs: stash.tabs.map((tab) => [...tab.items]),
  };
}

/** Flatten a live game state into a JSON-safe save object. */
export function serialize(state: GameState): SaveState {
  return {
    version: SAVE_VERSION,
    progression: state.progression,
    wallet: { balance: state.wallet.balance },
    runes: { levels: serializeRunes(state.runes) },
    cubeLevel: state.cubeLevel,
    inventory: serializeInventory(state.inventory),
    stash: serializeStash(state.stash),
    characters: state.characters,
    groups: state.groups,
    heroSlots: state.heroSlots,
    groupSlots: state.groupSlots,
  };
}

// ── piece-wise deserialize ───────────────────────────────────────────────────

function deserializeRunes(levels: Readonly<Record<string, number>>): RuneState {
  const runes = new RuneState();
  for (const [id, level] of Object.entries(levels)) {
    for (let i = 0; i < level; i++) runes.buy(id);
  }
  return runes;
}

function deserializeInventory(dto: InventoryDto): Inventory {
  const inv = new Inventory(capFromDto(dto.capacity));
  for (const item of dto.items) inv.add(item);
  return inv;
}

function deserializeStash(dto: StashDto): Stash {
  const stash = new Stash(dto.tabs.length, capFromDto(dto.capacityPerTab));
  dto.tabs.forEach((items, i) => {
    for (const item of items) stash.tabs[i].add(item);
  });
  return stash;
}

/** Rebuild a live game state from a save object. Rejects an unknown `version`. */
export function deserialize(save: SaveState): GameState {
  if (save.version !== SAVE_VERSION) {
    throw new Error(
      `unsupported save version ${save.version}; expected ${SAVE_VERSION}`,
    );
  }
  return {
    progression: save.progression,
    wallet: new Wallet(save.wallet.balance),
    runes: deserializeRunes(save.runes.levels),
    cubeLevel: save.cubeLevel,
    inventory: deserializeInventory(save.inventory),
    stash: deserializeStash(save.stash),
    characters: save.characters,
    groups: save.groups,
    heroSlots: save.heroSlots,
    groupSlots: save.groupSlots,
  };
}

// ── recipe → live combatant rehydration ──────────────────────────────────────

function classById(id: string): ClassDef {
  const def = CLASSES.find((c) => c.id === id);
  if (!def) throw new Error(`unknown class "${id}"`);
  return def;
}

/** Rehydrate one persisted character recipe into a live roster member. */
export function buildMember(saved: SavedCharacter): RosterMember {
  const build = new Build(saved.level);
  for (const [id, ranks] of Object.entries(saved.build)) {
    for (let i = 0; i < ranks; i++) build.spend(id);
  }

  const equipment = new Equipment();
  for (const slot of EQUIPMENT_SLOTS) {
    const item = saved.equipment[slot];
    if (item) equipment.equip(item, saved.level);
  }

  const character = createCharacter(
    classById(saved.classId),
    saved.level,
    build,
    [equipment],
  );
  const skills = saved.skills?.map((s) => ({
    def: skillById(s.id),
    rank: s.rank,
  }));

  return {
    id: saved.id,
    combatant: asCombatant(character, saved.name),
    skills,
    attackElement: saved.attackElement,
  };
}

/** Rebuild the live roster of combatants from the persisted character recipes. */
export function buildRoster(state: GameState): Roster {
  const roster = new Roster(state.heroSlots);
  for (const saved of state.characters) roster.add(buildMember(saved));
  return roster;
}

/** Rebuild the live group roster (formations) from the persisted group recipes. */
export function buildGroupRoster(state: GameState): GroupRoster {
  const groupRoster = new GroupRoster(state.groupSlots);
  for (const saved of state.groups) {
    const group = new Group(saved.id, saved.capacity);
    for (const memberId of saved.formation) group.add(memberId);
    groupRoster.add(group);
  }
  return groupRoster;
}
