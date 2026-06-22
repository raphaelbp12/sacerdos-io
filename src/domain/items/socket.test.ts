import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import type { Item } from "./item";
import {
  socketLayout,
  categoryForSlot,
  emptySocketsFor,
  effectiveModifiers,
  applyMaterial,
  extract,
} from "./socket";
import { materialById } from "./material";

function equip(rarity: Item["rarity"], slot: Item["slot"]): Item {
  return {
    id: "test-item",
    name: "Test Item",
    kind: "equippable",
    rarity,
    levelReq: 1,
    slot,
    modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
  };
}

describe("socket layout by rarity", () => {
  it("gives Common and Uncommon no sockets", () => {
    expect(socketLayout("Common")).toEqual([]);
    expect(socketLayout("Uncommon")).toEqual([]);
  });

  it("gives a Rare item one type-1 socket", () => {
    expect(socketLayout("Rare")).toEqual([1]);
  });

  it("gives a Legendary item two type-1 sockets", () => {
    expect(socketLayout("Legendary")).toEqual([1, 1]);
  });

  it("derives an item's empty sockets from its rarity", () => {
    expect(emptySocketsFor(equip("Rare", "weapon"))).toEqual([{ type: 1 }]);
    expect(emptySocketsFor(equip("Common", "weapon"))).toEqual([]);
  });
});

describe("categoryForSlot", () => {
  it("maps weapon to weapon, armor pieces to armor, jewellery to accessory", () => {
    expect(categoryForSlot("weapon")).toBe("weapon");
    expect(categoryForSlot("helm")).toBe("armor");
    expect(categoryForSlot("body")).toBe("armor");
    expect(categoryForSlot("gloves")).toBe("armor");
    expect(categoryForSlot("boots")).toBe("armor");
    expect(categoryForSlot("ring")).toBe("accessory");
    expect(categoryForSlot("amulet")).toBe("accessory");
  });
});

describe("effectiveModifiers", () => {
  it("equals the base modifiers when there are no socketed materials", () => {
    const item = equip("Rare", "weapon");
    expect(effectiveModifiers(item)).toEqual(item.modifiers);
  });
});

describe("applyMaterial / extract", () => {
  const ruby = materialById("minor-ruby")!;
  const goblinHide = materialById("goblin-hide")!;

  it("fills a matching socket and adds the material's stat to effective modifiers", () => {
    const item = equip("Rare", "weapon");
    const result = applyMaterial(item, ruby, new SeededRng(1));
    expect(result).toBeDefined();

    const mods = effectiveModifiers(result!);
    // base attack + the rolled fireDamage% from Minor Ruby (weapon category)
    expect(mods).toHaveLength(2);
    const added = mods.find((m) => m.attribute === "fireDamage");
    expect(added).toBeDefined();
    expect(added!.kind).toBe("percentage");
    expect(added!.value).toBeGreaterThanOrEqual(0.2);
    expect(added!.value).toBeLessThanOrEqual(0.3);
  });

  it("does not mutate the original item", () => {
    const item = equip("Rare", "weapon");
    applyMaterial(item, ruby, new SeededRng(1));
    expect(item.sockets).toBeUndefined();
    expect(effectiveModifiers(item)).toEqual(item.modifiers);
  });

  it("extraction removes the socketed stat again", () => {
    const item = equip("Rare", "weapon");
    const socketed = applyMaterial(item, ruby, new SeededRng(1))!;
    const out = extract(socketed, 0);
    expect(out).toBeDefined();
    expect(out!.modifier.attribute).toBe("fireDamage");
    expect(effectiveModifiers(out!.item)).toEqual(item.modifiers);
  });

  it("rejects a type-2 material in a type-1-only item (item unchanged)", () => {
    const item = equip("Rare", "weapon");
    expect(applyMaterial(item, goblinHide, new SeededRng(1))).toBeUndefined();
  });

  it("rejects a material when no free socket remains", () => {
    const item = equip("Rare", "weapon");
    const first = applyMaterial(item, ruby, new SeededRng(1))!;
    // Rare has a single type-1 socket; a second type-1 material has nowhere to go.
    expect(applyMaterial(first, ruby, new SeededRng(2))).toBeUndefined();
  });

  it("fills two sockets on a Legendary item independently", () => {
    const item = equip("Legendary", "weapon");
    const one = applyMaterial(item, ruby, new SeededRng(1))!;
    const two = applyMaterial(one, ruby, new SeededRng(2))!;
    expect(
      effectiveModifiers(two).filter((m) => m.attribute === "fireDamage"),
    ).toHaveLength(2);
  });

  it("returns undefined when extracting an empty or out-of-range socket", () => {
    const item = equip("Rare", "weapon");
    expect(extract(item, 0)).toBeUndefined();
    expect(extract(item, 5)).toBeUndefined();
  });

  it("rejects applying to a non-equippable item", () => {
    const misc: Item = {
      id: "junk",
      name: "Junk",
      kind: "misc",
      rarity: "Rare",
      levelReq: 1,
      modifiers: [],
    };
    expect(applyMaterial(misc, ruby, new SeededRng(1))).toBeUndefined();
  });
});
