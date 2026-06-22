import type { Rng } from "../rng/rng";
import type { Modifier } from "../stats/modifier";
import type { Item } from "./item";
import type { Rarity } from "./rarity";
import type { EquipmentSlot } from "./equipment-slot";
import type { MaterialDef } from "./material";
import { rollMaterial } from "./material";

/**
 * The three item-modifier socket types (overview):
 *   1 = decoration, 2 = engraving, 3 = inscription.
 * They grant the same kinds of stats; rarity decides how many of each a socket layout has.
 */
export type SocketType = 1 | 2 | 3;

/** Equipment categories a material rolls different stats for. */
export type EquipCategory = "weapon" | "armor" | "accessory";

/** One socket on an item: its accepted type and the material modifier filling it (if any). */
export interface Socket {
  readonly type: SocketType;
  /** The rolled modifier from the applied material, present only when filled. */
  readonly modifier?: Modifier;
  /** The id of the applied material, for inspection / extraction. */
  readonly materialId?: string;
}

/**
 * Socket layout by rarity (DATA — adding a rarity row never edits the engine).
 *
 * Faithful to the overview table, mapped onto the 5-tier Rarity union. The overview's higher
 * tiers (Immortal/Mythical) add type-2/3 sockets; those rarities don't exist yet (see D-027).
 */
export const SOCKET_LAYOUT: Readonly<Record<Rarity, readonly SocketType[]>> = {
  Common: [],
  Uncommon: [],
  Rare: [1],
  Epic: [1, 1],
  Legendary: [1, 1],
};

/** The socket types a given rarity grants. */
export function socketLayout(rarity: Rarity): readonly SocketType[] {
  return SOCKET_LAYOUT[rarity];
}

/** Maps an equipment slot to the material category whose stats it receives. */
export function categoryForSlot(slot: EquipmentSlot): EquipCategory {
  switch (slot) {
    case "weapon":
      return "weapon";
    case "ring":
    case "amulet":
      return "accessory";
    default:
      return "armor";
  }
}

/** The empty socket layout for an item, derived from its rarity. */
export function emptySocketsFor(item: Item): readonly Socket[] {
  return socketLayout(item.rarity).map((type) => ({ type }));
}

/** The sockets currently on an item (its own, else the rarity-derived empty layout). */
function socketsOf(item: Item): readonly Socket[] {
  return item.sockets ?? emptySocketsFor(item);
}

/**
 * An item's effective modifiers: its base affixes plus every socketed material modifier.
 * This is the single aggregated ModifierSource the rest of the game reads.
 */
export function effectiveModifiers(item: Item): readonly Modifier[] {
  const socketed = socketsOf(item)
    .map((s) => s.modifier)
    .filter((m): m is Modifier => m !== undefined);
  return [...item.modifiers, ...socketed];
}

/**
 * Applies a material into the first free socket whose type matches the material's socketType.
 * The value is rolled for the item's equipment category via the injected `rng`.
 *
 * Returns a new Item with that socket filled, or `undefined` (item untouched) when the item is
 * not equippable, has no slot, or has no free matching socket. The original item is never mutated.
 */
export function applyMaterial(
  item: Item,
  material: MaterialDef,
  rng: Rng,
): Item | undefined {
  if (item.kind !== "equippable" || item.slot == null) return undefined;

  const sockets = socketsOf(item);
  const index = sockets.findIndex(
    (s) => s.modifier === undefined && s.type === material.socketType,
  );
  if (index === -1) return undefined;

  const modifier = rollMaterial(rng, material, categoryForSlot(item.slot));
  const next = sockets.map((s, i) =>
    i === index ? { type: s.type, modifier, materialId: material.id } : s,
  );
  return { ...item, sockets: next };
}

/**
 * Extracts the material from the socket at `index`, clearing it.
 * Returns the new Item and the removed `Modifier`, or `undefined` when the index is out of range
 * or that socket is empty. The original item is never mutated.
 */
export function extract(
  item: Item,
  index: number,
): { item: Item; modifier: Modifier } | undefined {
  const sockets = socketsOf(item);
  const socket = sockets[index];
  if (socket?.modifier === undefined) return undefined;

  const modifier = socket.modifier;
  const next = sockets.map((s, i) => (i === index ? { type: s.type } : s));
  return { item: { ...item, sockets: next }, modifier };
}
