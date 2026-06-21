# Milestone 14 Plan — Drop tables & chests

> **Goal:** defeated enemies and bosses roll **chests**; chests are stored in a capacity-capped
> store and, when **opened**, roll **one item** via the existing `generateItem` (DRY). A
> **drop table** is data — weighted **rarity** ("grade odds") and weighted **item category**
> (weapon / armor / accessory) rolled through the injected `Rng`. The very first drop is a
> **100% class weapon**. Resolves **D-005**.
>
> **Headline acceptance tests:** a seeded mass-roll of the first/common chest table reproduces
> the overview's grade odds (78% common / 20.6% uncommon / 1.37% rare) within tolerance; the
> first drop is always the class weapon; a `ChestInventory` rejects chests when full and an
> `open` is blocked when the inventory has no space.

---

## 0. Decisions (made up-front, no blocking questions)

1. **New pure module `src/domain/loot/`.** Zero React/DOM/Vite. It imports `items` (for
   `generateItem`, `ITEM_BASES`, `Item`, `Rarity`, `EquipmentSlot`) and `rng`. Nothing inner
   imports it — the outer shell / battle reward hook composes it.
2. **Reuse `generateItem` — do not duplicate generation.** `generate-item.ts` gains two
   **optional** `GenerateOptions` fields, `base` and `rarity`, that bypass the internal base /
   rarity rolls. With neither supplied the rng call order is **identical** to before, so every
   existing test (and snapshot) is unchanged. A drop table picks the base (by category) and the
   rarity, then hands both to `generateItem`.
3. **Drop tables are data (`DropTable`).** `rarityWeights` (grade odds) + `categoryWeights`
   (weapon / armor / accessory). A generic `weightedPick` rolls a key proportional to its weight
   via one `nextFloat` — the same banding pattern as `rollRarity` (DRY).
4. **Item category is derived from slot, not stored.** `categoryForSlot`: `weapon → weapon`;
   `helm/body/gloves/boots → armor`; `ring/amulet → accessory`. Compute-don't-store.
5. **First drop = 100% class weapon via a guaranteed base.** A `Chest` may carry an optional
   `guaranteedBaseId`; opening it forces that base at `Common` rarity (the player's starter
   weapon). No special-case branch leaks into the drop-table mechanism.
6. **`ChestInventory` depends on a `LootSink` contract, not concrete `Inventory`.** "Open
   requires inventory space" is checked via `sink.hasSpace()`. This keeps M14 decoupled from
   **M15** (which generalizes `Inventory` with real capacity); M14 only needs the contract.
   Spend/throw semantics mirror the rest of the domain (out-of-range / full → throw).

---

## 1. Design

- **`drop-table.ts`** — `ItemCategory`, `categoryForSlot`, `DropTable`, `weightedPick`,
  `rollDrop(table, rng, itemLevel)`.
- **`chest-def.ts`** — `ChestTier` (`common` / `rare` / `legendary`), `Chest`, the per-tier
  `DropTable` data (`COMMON_CHEST_TABLE` carries the overview's first-chest grade odds),
  `firstChest(classWeaponBaseId)`, `openChest(chest, rng, itemLevel)`.
- **`chest-inventory.ts`** — `LootSink` contract + `ChestInventory` (capacity-capped store;
  `add` returns false when full; `open` blocked when the sink is full).
- **`index.ts`** — public barrel.

### Drop model

`rollDrop(table, rng, itemLevel)`:

1. `rarity = weightedPick(table.rarityWeights, rng)` (grade odds).
2. `category = weightedPick(table.categoryWeights, rng)`.
3. pick a base of that category eligible for `itemLevel` (uniform `nextInt`).
4. `generateItem(rng, { itemLevel, base, rarity })`.

| Chest tier  | Grade odds (rarity weights)             | Notes                          |
| ----------- | --------------------------------------- | ------------------------------ |
| `common`    | Common 78 / Uncommon 20.6 / Rare 1.37   | overview's first-chest odds    |
| `rare`      | Uncommon 50 / Rare 35 / Epic 13 / Leg 2 | placeholder shift (D-005 tune) |
| `legendary` | Rare 40 / Epic 40 / Legendary 20        | placeholder shift (D-005 tune) |

## 2. Steps (TDD order)

- [x] **14.0 generateItem forced base/rarity** — `generateItem(rng, { itemLevel, base, rarity })`
      returns an item of exactly that base + rarity; with neither option the output is byte-for-byte
      identical to the previous behaviour (no regression).
- [x] **14.1 drop-table + chest-def** — `weightedPick` is proportional; `categoryForSlot` maps
      every slot; a seeded mass-roll of `COMMON_CHEST_TABLE` matches grade odds within tolerance;
      `rollDrop` returns an item of the rolled rarity & category; `openChest` on a `firstChest`
      always yields the class weapon (Common), deterministically.
- [x] **14.2 chest-inventory** — `add` caps at capacity (returns false when full, store
      unchanged); `open` throws when the sink is full and on out-of-range index; a successful
      `open` adds the rolled item to the sink, removes the chest, and returns the item.

## 3. Deferrals

- **D-005 tuning** — the per-source chest **drop chances** (overview: monster→common,
  stage-boss→rare, act-boss→legendary; first chest 16% in 1-1..1-3) and the rare/legendary grade
  odds are placeholders; real balancing waits on stage spread + rune drop-rate buffs (M18).
