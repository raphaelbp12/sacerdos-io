# Milestone 15 Plan — Inventory & stash capacity

> **Goal:** apply the overview's **capacity limitation**. Generalize the existing `Inventory`
> with a **capacity** (slot cap) and a **stacking policy** — **misc items stack** in a single
> slot, while **item modifiers and boss keys each consume their own slot**. A `Stash` is just
> **many `Inventory` tabs** (DRY — the overview: "reuse the inventory class for stash,
> inventory and equipment"), and items move **inventory ↔ stash** freely, limited only by both
> capacities. When inventory (and stash) are full, dropped loot is **lost** (M14's `LootSink`
> contract already routes through `hasSpace()`).
>
> **Headline acceptance tests:** two identical misc items share one slot (`slotsUsed === 1`);
> each equippable / modifier / boss-key item consumes its own slot; `add` past capacity is
> rejected without mutating the store; `moveItem` between two `Inventory` instances respects
> **both** the source (item present) and destination (capacity / stacking) limits and is atomic.

---

## 0. Decisions (made up-front, no blocking questions)

1. **Generalize `Inventory` in place — do not fork a new class.** The overview explicitly wants
   one abstraction reused for inventory, stash tabs, and (constrained) equipment. `Inventory`
   gains an optional `capacity` (default **`Infinity`** = unlimited) and an optional
   **`StackPolicy`**. With the defaults, every existing `Inventory` test and the UI
   (`new Inventory()`) behave **exactly** as before (no regression).
2. **Backward-compatible internal shape.** Keep the flat `Item[]` backing array so `items`
   (flat list) and `remove(item)` (by reference) are unchanged. **Slots are computed, not
   stored** (compute-don't-store): `slotsUsed` groups stackable items by `id` (one slot per
   group) and counts every non-stackable item as one slot.
3. **Stacking is a data policy, not a subclass.** `StackPolicy = (item) => boolean`.
   `DEFAULT_STACK_POLICY` stacks `kind === "misc"`; equippables, consumables, item modifiers and
   boss keys are non-stackable (each its own slot), matching the overview's locked rule. No max
   stack size for now (deferred — see §3).
4. **Two space checks, one for each caller.** `hasSpace()` (the M14 `LootSink` contract,
   item-agnostic) = `slotsUsed < capacity`. `canAccept(item)` (item-aware) is `true` when a
   stackable item joins an existing same-`id` stack **or** there is a free slot. `add(item)`
   returns `false` (and stores nothing) when `!canAccept`, mirroring `ChestInventory.add`.
5. **`Inventory` structurally satisfies `LootSink`** (`hasSpace()` + `add`) **without importing
   it** — `loot` imports `items`, so `items` must not import `loot` (one-way deps). Structural
   typing lets an `Inventory` be passed straight into `ChestInventory.open` as the sink.
6. **`Stash` = `Inventory[]` tabs; movement is a free function.** `Stash` holds N tabs (each an
   `Inventory`), starts with 1 (overview), is grown later by the rune tree (M18). `moveItem(from,
to, item)` checks `to.canAccept(item)` first, then removes from `from` and adds to `to`
   (atomic: the destination is verified before the source is mutated). Works for any pair —
   inventory↔stash-tab or tab↔tab.

---

## 1. Design

- **`inventory.ts`** (generalized) — `StackPolicy`, `DEFAULT_STACK_POLICY`, and an `Inventory`
  with `capacity`, `slotsUsed`, `isFull`, `hasSpace()`, `canAccept(item)`, `stacks` (grouped
  read model), plus the existing `items` / `add` / `remove`.
- **`stash.ts`** — `Stash` (ordered `Inventory` tabs) + `moveItem(from, to, item)`.

### Slot accounting

```
slotsUsed = (# distinct ids among stackable items) + (# non-stackable items)
```

| Item kind            | Stackable? | Slot cost                       |
| -------------------- | ---------- | ------------------------------- |
| `misc`               | ✅ yes     | 1 per distinct `id` (shared)    |
| `equippable`         | ❌ no      | 1 each                          |
| `consumable`         | ❌ no      | 1 each                          |
| item modifier / gem  | ❌ no      | 1 each (it is a non-misc kind)  |
| boss key (as `misc`) | ❌ no\*    | 1 each (\*policy excludes keys) |

> \*Boss keys are modelled separately today (`stages/boss-key.ts`), so the default policy never
> sees them. When keys become inventory `Item`s, the policy excludes them explicitly so each
> consumes its own slot (overview).

## 2. Steps (TDD order)

- [x] **15.1 Inventory capacity + stacking** — default `Inventory()` is unlimited & behaves as
      before; a capped `Inventory(n)` rejects the `(n+1)`-th distinct item via `add` (returns
      `false`, store unchanged) and reports `isFull` / `hasSpace()`; two identical misc items
      give `slotsUsed === 1` (and a single `stacks` entry with `count === 2`); two distinct misc
      ids give `slotsUsed === 2`; each equippable / consumable / modifier item adds a slot;
      `canAccept` lets a stackable item join its existing stack even when `isFull`.
- [x] **15.2 Stash multi-tab + moveItem** — `Stash` starts with the requested tab count (≥1),
      each tab an `Inventory` of the given capacity; `moveItem(from, to, item)` moves an item,
      removing it from `from` and adding to `to`, returns `true`; returns `false` (no mutation on
      either side) when `to` is full or `item` isn't in `from`; moving a stackable item into a
      tab that already holds its stack succeeds even when that tab is otherwise full.

## 3. Deferrals

- **Max stack size** — misc stacks are unbounded for now; a per-item `maxStack` cap (and the
  "stack overflow spills to a new slot" rule) is deferred until a concrete misc item needs it.
- **Capacity growth source** — inventory / stash-tab capacity is a plain constructor number;
  wiring it to the **rune tree** (gold-bought expansion, more stash tabs) lands in **M18**.
- **Equipment-as-Inventory** — the overview suggests reusing `Inventory` for the 7-slot
  equipment list too; that unification stays with the existing `Equipment` class for now (its
  one-item-per-slot rule differs) and can be revisited under persistence (M20).
