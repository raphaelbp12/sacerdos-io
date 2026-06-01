# Milestone 5 Plan — Procedural Item Generation (PoE-style: Base Archetype + Level Curve)

> **Goal:** Replace hand-authored item _instances_ with a small **base-item database** of
> level-agnostic _archetypes_, plus a deterministic generator that rolls a concrete item
> instance for a given **item level**. This fills the dormant `Rng` seam and reuses the
> existing `scaleItem` / `rarityMultiplier` machinery.
>
> **Headline acceptance test:** with a seeded `Rng`, `generateItem(rng, { itemLevel: 5 })`
> returns a deterministic, fully-scaled `Item` whose base type, rarity, and modifier values
> are reproducible run-to-run.

---

## 0. Read this first (context for the implementer)

You are implementing inside an existing, **pure domain layer** under `src/domain/`. Before
writing any code, read these files to understand the contracts you must reuse — **do not
re-invent them**:

- [src/domain/items/item.ts](../src/domain/items/item.ts) — the `Item` interface and `ItemKind`.
- [src/domain/items/scale-item.ts](../src/domain/items/scale-item.ts) — `scaleItem(item)`; multiplies modifier values by rarity. **Reuse this; do not duplicate it.**
- [src/domain/items/rarity.ts](../src/domain/items/rarity.ts) — `Rarity`, `RARITIES`, `rarityMultiplier`.
- [src/domain/items/equipment-slot.ts](../src/domain/items/equipment-slot.ts) — `EquipmentSlot`, `EQUIPMENT_SLOTS`.
- [src/domain/items/seed-items.ts](../src/domain/items/seed-items.ts) — current hand-authored catalog (the thing we are evolving away from for equippables).
- [src/domain/stats/modifier.ts](../src/domain/stats/modifier.ts) — `Modifier`, `ModifierKind`, `Attribute`.
- [src/domain/rng/rng.ts](../src/domain/rng/rng.ts) — the `Rng` contract (`nextInt`, `nextFloat`). **Currently has no implementation. You will add one.**

### The core mental model (why we're doing this)

Today an `Item` conflates two concepts. We are splitting them:

| Concept      | Meaning                                                                           | Lives in                |
| ------------ | --------------------------------------------------------------------------------- | ----------------------- |
| **ItemBase** | _What kind of thing it is_ — "a sword", level-agnostic. Defines what it may roll. | the new "database" file |
| **Item**     | _A specific rolled instance_ — this Rare sword, itemLevel 5, +12 STR.             | output of the generator |

The generator's job: **pick a base → roll a rarity → roll modifier values scaled by item
level → run the existing `scaleItem`** → return a concrete `Item`.

---

## 1. Architecture laws to honor (do not violate)

- **Domain purity:** every new file lives under `src/domain/` and imports **zero** React/DOM/Vite. Tests run in milliseconds.
- **Inject randomness:** the generator receives an `Rng` instance. **Never call `Math.random()`** in domain code. Tests pass a seeded `Rng` and assert exact output.
- **Data, not code:** a new gear archetype is a **data entry** in the bases database, not a new class.
- **Reuse, don't duplicate:** rarity scaling already exists as `scaleItem`. The generator composes it; it must not re-implement multiplication.
- **Depend on contracts:** generator depends on the `Rng` interface and the `ItemBase` interface, not on concretes.
- **TDD:** for every step below, **write the failing test first**, then the minimal code to pass, then refactor. The order of steps _is_ the TDD order.
- **One responsibility per file (SRP):** keep the seeded-RNG, the level curve, the bases DB, the rarity roll, and the generator in separate files.

---

## 2. Proposed module layout

```
src/
  domain/
    rng/
      seeded-rng.ts            # NEW: deterministic Rng implementation (mulberry32)
      seeded-rng.test.ts       # NEW
    items/
      item-base.ts             # NEW: ItemBase interface (the archetype contract)
      item-bases.ts            # NEW: ITEM_BASES — the "database" of archetypes (data only)
      item-bases.test.ts       # NEW: invariants on the DB (valid slots, sane ranges)
      level-curve.ts           # NEW: baseValueForLevel(level) — the scaling formula
      level-curve.test.ts      # NEW
      roll-rarity.ts           # NEW: weighted rarity roll using Rng
      roll-rarity.test.ts      # NEW
      generate-item.ts         # NEW: the orchestrator — base + rarity + level -> Item
      generate-item.test.ts    # NEW
      index.ts                 # UPDATE: export the new public surface
```

> Rationale: each file has a single responsibility and is unit-testable in isolation.
> `generate-item.ts` is the only file that knows about all the others; everything below it
> is independently testable.

---

## Phase 1 — Seeded RNG (fill the dormant seam)

> Goal: a deterministic `Rng` implementation so all generation is reproducible and assertable.
> Use **mulberry32** (a tiny, well-known seedable PRNG) — do not hand-roll a novel algorithm.

- [ ] **1.1** Write `seeded-rng.test.ts` first. Assert:
  - [ ] Two `SeededRng` created with the **same seed** produce the **same sequence** of `nextInt` / `nextFloat` results.
  - [ ] Two with **different seeds** diverge.
  - [ ] `nextFloat()` is always in `[0, 1)`.
  - [ ] `nextInt(min, max)` is always within `[min, max]` **inclusive** (match the contract in [src/domain/rng/rng.ts](../src/domain/rng/rng.ts)), including the edge case `nextInt(5, 5) === 5`.
  - [ ] A known seed produces a known, hard-coded first value (a regression lock).
- [ ] **1.2** Implement `seeded-rng.ts`: `export class SeededRng implements Rng` taking a numeric `seed` in the constructor. Implement `nextFloat` via mulberry32; derive `nextInt(min, max)` from `nextFloat` using `Math.floor(nextFloat() * (max - min + 1)) + min`.
- [ ] **1.3** Export `SeededRng` from the rng barrel ([src/domain/rng/index.ts](../src/domain/rng/index.ts)).
- [ ] **1.4** ✅ Confirm: all Phase 1 tests pass; no `Math.random()` anywhere.

---

## Phase 2 — The level curve (one formula replaces many hand-authored tiers)

> Goal: a single pure function that turns an `itemLevel` into a base modifier magnitude,
> so we never hand-author "L1 / L5 / L10" duplicate rows. This is the formula that the old
> per-tier idea was approximating by hand.

- [ ] **2.1** Write `level-curve.test.ts` first. Assert:
  - [ ] `baseValueForLevel(1)` equals the agreed level-1 baseline (pick a small integer, e.g. `5`).
  - [ ] The curve is **monotonically non-decreasing**: `baseValueForLevel(n+1) >= baseValueForLevel(n)`.
  - [ ] A couple of explicit anchor points are locked (e.g. level 1, 5, 10) so future tuning is a conscious change.
  - [ ] Output is always an **integer** (round/floor inside the function — stats are whole numbers).
- [ ] **2.2** Implement `level-curve.ts`: `export function baseValueForLevel(level: number): number`. Start with a simple linear-ish formula such as `floor(BASE + level * PER_LEVEL)`. Keep `BASE` and `PER_LEVEL` as named module constants so tuning is one edit. Document the chosen formula in a comment.
- [ ] **2.3** ✅ Confirm: Phase 2 tests pass.

> Note: this curve sets the **pre-rarity** magnitude (Common 1× baseline), consistent with
> how `SEED_ITEMS` authors values today. `scaleItem` applies rarity on top later.

---

## Phase 3 — The base-item database (the archetypes)

> Goal: the "database like" file the user asked for — but each row is a **level-agnostic
> archetype**, not a per-level duplicate. New gear _types_ unlock over the level curve via
> `minLevel`.

- [ ] **3.1** Write `item-base.ts`: define the `ItemBase` interface. Required fields:
  ```ts
  export interface ItemBase {
    readonly id: string; // "short-sword"
    readonly name: string; // "Short Sword"
    readonly kind: ItemKind; // reuse ItemKind from item.ts
    readonly slot: EquipmentSlot; // reuse EquipmentSlot
    readonly minLevel: number; // earliest itemLevel this base may drop (1, 5, 10…)
    readonly rollableAttributes: readonly Attribute[]; // which stats this base may roll
  }
  ```

  - [ ] Reuse `ItemKind`, `EquipmentSlot`, and `Attribute` from existing modules — do **not** redeclare them.
- [ ] **3.2** Write `item-bases.ts`: `export const ITEM_BASES: readonly ItemBase[]`. Seed it with a small, sensible set — **one archetype per slot is enough to start** (no per-level duplicates):
  - [ ] `short-sword` → slot `weapon`, `minLevel 1`, rolls `STR`.
  - [ ] `leather-helm` → slot `helm`, `minLevel 1`, rolls `HP`.
  - [ ] `leather-body` → slot `body`, `minLevel 1`, rolls `HP`.
  - [ ] `leather-gloves` → slot `gloves`, `minLevel 1`, rolls `AGI`.
  - [ ] `leather-boots` → slot `boots`, `minLevel 1`, rolls `AGI`.
  - [ ] `copper-ring` → slot `ring`, `minLevel 1`, rolls `INT` or `STR`.
  - [ ] `copper-amulet` → slot `amulet`, `minLevel 1`, rolls `MP`.
  - [ ] Add **one** higher-tier archetype to prove the gate works, e.g. `plate-body` → slot `body`, `minLevel 10`, rolls `HP`, `STR`.
- [ ] **3.3** Write `item-bases.test.ts`. Assert DB invariants (these catch future data-entry mistakes):
  - [ ] Every `slot` is a member of `EQUIPMENT_SLOTS`.
  - [ ] Every `rollableAttributes` entry is a valid `Attribute`, and the list is non-empty.
  - [ ] Every `id` is unique.
  - [ ] Every `minLevel >= 1`.
- [ ] **3.4** ✅ Confirm: Phase 3 tests pass.

> Design note for the implementer: keep this file **pure data** (no functions, no logic).
> A designer must be able to add a row without touching engine code. This is the "data, not
> code, defines content" law in action.

---

## Phase 4 — Rarity roll (weighted)

> Goal: roll a `Rarity` using the injected `Rng`, with common rarities common and legendary rare.

- [ ] **4.1** Write `roll-rarity.test.ts` first. Assert:
  - [ ] `rollRarity(rng)` always returns a member of `RARITIES`.
  - [ ] With a **seeded** rng, the result is deterministic (lock a known seed → known rarity).
  - [ ] Over many rolls with a seeded rng, the distribution is **weighted** (Common appears far more often than Legendary). Assert counts, not exact frequencies — e.g. `commonCount > legendaryCount`.
- [ ] **4.2** Implement `roll-rarity.ts`: `export function rollRarity(rng: Rng): Rarity`. Use a weight table (a `Record<Rarity, number>` or parallel array) and a single `rng.nextFloat()` to pick a band. Keep the weights as a named constant so they're tunable in one place.
- [ ] **4.3** ✅ Confirm: Phase 4 tests pass.

---

## Phase 5 — The generator (orchestrator)

> Goal: compose Phases 1–4 into the public `generateItem`. This is the only file that knows
> about bases, the curve, the rarity roll, and `scaleItem`.

- [ ] **5.1** Write `generate-item.test.ts` first. Assert (with a `SeededRng`):
  - [ ] **Determinism:** `generateItem(new SeededRng(42), { itemLevel: 5 })` deep-equals a second call with a fresh `new SeededRng(42)`. (Lock the whole returned `Item`.)
  - [ ] **Base eligibility:** the chosen base always has `minLevel <= itemLevel`. Generate at `itemLevel: 1` many times and assert the `plate-body` (minLevel 10) base is **never** chosen; generate at `itemLevel: 10+` and assert it _can_ appear.
  - [ ] **Slot correctness:** the returned `Item.slot` matches the chosen base's slot.
  - [ ] **Rollable attributes only:** every modifier's `attribute` is in the base's `rollableAttributes`.
  - [ ] **Level scaling:** a higher `itemLevel` yields modifier values `>=` those at a lower level (compare same base / same rarity by seeding to force them, or compare pre-scale magnitudes).
  - [ ] **Rarity scaling applied:** the final modifier values equal `baseValueForLevel(itemLevel) × rarityMultiplier(rolledRarity)` (i.e. `scaleItem` ran). Confirm a Rare item's value is 3× the Common baseline.
  - [ ] **Valid Item shape:** `kind === 'equippable'`, `levelReq` set sensibly (see 5.2), `modifiers` non-empty, unique `id`.
- [ ] **5.2** Implement `generate-item.ts`:
  ```ts
  export interface GenerateOptions {
    readonly itemLevel: number;
  }
  export function generateItem(rng: Rng, opts: GenerateOptions): Item;
  ```
  Algorithm (keep it linear and readable):
  1. **Filter** `ITEM_BASES` to those with `minLevel <= opts.itemLevel`.
  2. **Pick** one base uniformly via `rng.nextInt(0, eligible.length - 1)`.
  3. **Roll** rarity via `rollRarity(rng)`.
  4. **Decide** how many modifiers to roll (start simple: **one** modifier; leave affix-count-by-rarity as a documented TODO for a later milestone).
  5. **Pick** the rolled attribute(s) from `base.rollableAttributes` via the rng.
  6. **Compute** the base (Common) modifier value via `baseValueForLevel(opts.itemLevel)`.
  7. **Construct** a Common-magnitude `Item` (id should be unique — derive from base id + a roll counter or rng value; name from base name).
  8. **Set** `levelReq = base.minLevel` (or `opts.itemLevel`; pick one and document it).
  9. **Return** `scaleItem(item)` so rarity multiplies the values — **reuse the existing function**.
- [ ] **5.3** Export `generateItem`, `GenerateOptions`, `ItemBase`, `ITEM_BASES`, `baseValueForLevel`, `rollRarity` from the items barrel ([src/domain/items/index.ts](../src/domain/items/index.ts)).
- [ ] **5.4** ✅ Confirm: Phase 5 tests pass; the headline acceptance test (deterministic generation at itemLevel 5) is green.

---

## Phase 6 — Wire into the UI (thin, optional but high-value)

> Goal: make the new system visible. A single button proves the loop end-to-end on the
> existing spreadsheet UI.

- [ ] **6.1** In [src/App.tsx](../src/App.tsx), create one `SeededRng` instance (e.g. seeded from `Date.now()` — this is the **UI/outer layer**, so a non-deterministic seed is fine _here_, never in domain).
- [ ] **6.2** Add a **"Generate Item"** button that calls `generateItem(rng, { itemLevel: <character level> })` and `inventory.add(...)` the result, then forces the existing re-render.
- [ ] **6.3** ✅ Manual test: click the button → a new rolled item appears in the Inventory panel → it can be equipped → stats update.

---

## Phase 7 — Cleanup & docs

- [ ] **7.1** Decide the fate of the equippable entries in `SEED_ITEMS`: either keep them as a small "starter gift" set, or replace them with generated items. Document the decision in a code comment. (Consumables in `SEED_ITEMS` stay — they are out of scope here.)
- [ ] **7.2** Run the full test suite (`npm test` / Vitest) — everything green.
- [ ] **7.3** Run the linter/build (`npm run lint`, `npm run build`) — no errors.
- [ ] **7.4** Mark this milestone complete and note follow-ups below.

---

## Explicitly NOT in this milestone (deferred on purpose)

- **Affix system** (prefixes/suffixes, multiple modifiers whose count scales with rarity). Phase 5 rolls a single modifier; the structure leaves room to expand.
- **Modifier value _ranges_** (rolling a random value within a min–max band per level). We start with a single curve value; ranges are a natural follow-up using the same `Rng`.
- **Named/unique items** and crafting.
- **Drop tables / loot sources** (what enemy or chest drops what `itemLevel`). Generation is standalone for now.
- **Consumable generation** — equippables only this milestone.

---

## Definition of done

- [ ] A seeded `Rng` implementation exists and is reused everywhere generation needs randomness.
- [ ] `ITEM_BASES` is a pure-data archetype database; new gear types are one-row additions.
- [ ] `generateItem(rng, { itemLevel })` returns deterministic, correctly slot-typed, rarity-scaled, level-scaled `Item`s.
- [ ] No `Math.random()` and no wall-clock reads in any `src/domain/` file.
- [ ] All new code is TDD'd (failing test first) and every phase's tests are green.
- [ ] The UI can generate an item and equip it end-to-end.
