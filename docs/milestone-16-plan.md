# Milestone 16 Plan — Item modifiers / gems (sockets & materials)

> **Goal:** equipments gain **item-modifier sockets** whose count & type depend on the item's
> rarity. A **material** ("gem") is data; applying one into a matching socket adds its rolled
> `Modifier` to the equip, and extraction removes it. The socketed equip still exposes **one**
> aggregated set of modifiers (base affixes + socketed materials) so everything downstream
> (`Equipment` → `getStat`) keeps working unchanged. Materials roll their value within a
> **min–max band** (this is where **D-002** lands).
>
> **Headline acceptance tests:**
>
> - A `Rare` item has **1 type-1 socket**; a `Legendary` item has **2 type-1 sockets**; `Common`
>   / `Uncommon` have **none** (overview socket table).
> - Applying _Minor Ruby_ (a type-1 decoration) into a socketed item adds its stat to the item's
>   effective modifiers; **extracting** it removes that stat again.
> - Applying a **type-2** material into a type-1-only socket is **rejected** (no free matching
>   socket), leaving the item unchanged.
> - `rollMaterial` returns a value **within** the material's `[min, max]` band for the item's
>   equipment category, deterministically under a seeded `Rng`.

---

## 0. Decisions (made up-front, no blocking questions)

1. **Sockets are data on the `Item`, not a wrapper class.** `Item` gains an optional
   `sockets?: readonly Socket[]`. A `Socket` is `{ type, modifier?, materialId? }`. Empty/absent
   sockets contribute nothing. This keeps the **single `ModifierSource`** rule: an item's
   _effective_ modifiers are `base.modifiers ++ socketed material modifiers`, computed by one
   pure function `effectiveModifiers(item)`. No new ModifierSource type, no Equipment redesign.
2. **`Equipment` reads `effectiveModifiers(item)`** instead of `item.modifiers` directly. For a
   socket-less item the two are identical, so every existing equipment/stat test stays green.
3. **Socket layout is rarity → socket-type list (data, OCP).** Faithful to the overview table,
   mapped onto our **5-tier** `Rarity` (`Common…Legendary`):

   | Rarity    | Sockets            |
   | --------- | ------------------ |
   | Common    | — (none)           |
   | Uncommon  | — (none)           |
   | Rare      | `[type 1]`         |
   | Epic      | `[type 1, type 1]` |
   | Legendary | `[type 1, type 1]` |

   The overview's higher tiers (Immortal/Mythical) introduce **type-2 / type-3** sockets; those
   rarities don't exist in our union yet, so type-2/3 sockets stay **deferred** (see §3) — the
   socket-**type matching** logic is still built and unit-tested with a type-2 material.

4. **A material rolls one stat per equipment category.** Equipment maps to a category:
   `weapon → weapon`; `helm/body/gloves/boots → armor`; `ring/amulet → accessory`. A `MaterialDef`
   carries a `byCategory` table of `{ attribute, kind, min, max }`. `rollMaterial(rng, mat, cat)`
   draws a **continuous** value in `[min, max]` via `rng.nextFloat()` and returns a `Modifier`.
5. **No material-rarity gate on sockets.** Sockets gate on **type** only (decoration/engraving/
   inscription), per the overview — a Common material fits any type-1 socket.
6. **`applyMaterial` auto-places into the first free matching socket** and is immutable (returns a
   new `Item`); `extract(item, index)` returns `{ item, modifier }`. No free matching socket ⇒
   rejected (returns `undefined`, item untouched) — mirrors the `add`-returns-false convention.
7. **Materials are a small representative data set, not the full 60-row table.** Transcribing
   every row from [material-effects.md](material-effects.md) is content work deferred to balancing;
   M16 ships a handful of faithful Common/Uncommon rows that exercise type-1, type-2, flat, and
   percentage rolls across all three categories.

---

## 1. Design

- **`socket.ts`** — `SocketType` (`1 | 2 | 3`), `EquipCategory`, `Socket`, `SOCKET_LAYOUT`
  (rarity → types), `socketLayout(rarity)`, `categoryForSlot(slot)`, `emptySocketsFor(item)`,
  `effectiveModifiers(item)`, `applyMaterial(item, material, rng)`, `extract(item, index)`.
- **`material.ts`** — `MaterialStatRange`, `MaterialDef`, `MATERIALS` (data), `materialById(id)`,
  `rollMaterial(rng, material, category)`.
- **`item.ts`** — add optional `sockets` field.
- **`equipment.ts`** — aggregate via `effectiveModifiers(item)`.

### Effective-modifier accounting

```
effectiveModifiers(item) = item.modifiers
                         ++ (item.sockets ?? []).filter(s => s.modifier).map(s => s.modifier)
```

## 2. Steps (TDD order)

- [x] **16.1 Sockets by rarity + apply/extract** — `socketLayout` returns `[]` for Common/
      Uncommon, `[1]` for Rare, `[1,1]` for Epic/Legendary; `applyMaterial` fills the first free
      socket whose `type` matches the material's `socketType`, adding the rolled `Modifier` to
      `effectiveModifiers`; `extract(item, index)` returns the modifier and clears the socket;
      applying a type-2 material to a type-1-only item returns `undefined` (item unchanged).
- [x] **16.2 Material data + roll ranges** — `rollMaterial(rng, mat, category)` returns a
      `Modifier` whose `attribute`/`kind` match the material's `byCategory` entry and whose
      `value` is within `[min, max]`; deterministic under a seeded `Rng`; distinct seeds can
      produce distinct values within the band.

## 3. Deferrals

- **Type-2 / type-3 sockets & Immortal/Mythical rarities** — our `Rarity` union is 5-tier, so no
  rarity currently grants a type-2 (engraving) or type-3 (inscription) socket. The type-matching
  machinery is built and tested, but the rarity → type-2/3 rows wait until the rarity tiers
  expand. (New deferral **D-027**.)
- **Engraving 50/50 dual-stat roll** — the doc's engraving materials roll one of two stats per
  slot; M16 models one stat per category. The second-stat coin-flip is deferred (**D-028**).
- **Full material catalogue** — only a representative subset of [material-effects.md](material-effects.md)
  is encoded; the complete table is content/balancing work (**D-029**).
- **Auto-socketing generated items** — `generateItem` is left untouched (keeps its snapshots);
  sockets are initialised on demand via `emptySocketsFor`. Wiring sockets into the drop/cube flow
  lands with the **cube** (M17), which is the system that actually inserts materials.
