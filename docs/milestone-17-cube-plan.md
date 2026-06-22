# Milestone 17 — Cube system (synthesis · alchemy · cube leveling)

> **Goal (from the roadmap).** The Cube is the item recycler / seller / leveler. This milestone
> ships the three foundational operations: **synthesis** (recycle N same-rarity items → 1 fresh
> higher-rarity roll), **alchemy** (sell an item for gold), and **cube leveling** (consumed items
> grant Cube EXP; levels unlock operations and recipe tiers). Crafting / decoration / engraving /
> inscription / offering / extraction stay **deferred** (`D-018`) — they are listed as data here so
> unlock-gating is testable, but their behaviors are not implemented.
>
> Specs: [cube.md](cube.md) (formulas, EXP table, unlock ladder) and
> [game-overview.md](game-overview.md) §"Cube system" / §"selling items" (3-to-1 ratio, fresh
> roll, item-level thresholds, sell anchors).

All new code lives under `src/domain/cube/` and obeys the architecture laws: pure (no DOM/React),
injected `Rng`, compute-don't-store, data-not-code, one-way deps (`cube → items → …`, nothing inner
imports cube). TDD: failing test first, minimal pass, refactor.

## Locked design decisions (I decided the open ones)

- **Item level becomes a first-class, optional field on `Item`** (`itemLevel?`). `generateItem`
  records it; hand-authored items omit it. `itemLevelOf(item) = item.itemLevel ?? item.levelReq`
  is the single accessor. The cube needs an item's level for thresholds, sell value and EXP, and
  that concept was previously discarded after generation.
- **Synthesis ratio = 3-to-1** (`SYNTHESIS_RATIO`, override per call). Inputs must share rarity and
  kind; only **equippable** inputs are supported (misc/consumable synthesis deferred). Output is a
  **fresh roll** via `generateItem` at the next rarity, item level = the max input level. The
  active **threshold band** gates eligible item levels (out-of-band ⇒ rejected).
- **Rarity ladder maps onto our 5 tiers geometrically.** The overview/cube.md tables name tiers we
  don't have (Immortal/Mythical/Arcana…) and skip Epic. We keep the ×3 geometric ladder over our
  `Common · Uncommon · Rare · Epic · Legendary`:
  - **Alchemy grade factor:** `1 · 3 · 9 · 18 · 27` (Epic interpolated; anchored so L10 Legendary
    = 6750g, matching the overview).
  - **Cube-EXP grade factor:** `2 · 6 · 18 · 54 · 162` (pure ×3 — cube.md's `Common 2 … Immortal
162`, shifted onto our top tier).
- **Alchemy:** `sellValue = ⌊ 10 × gradeFactor × levelFactor ⌋`. `levelFactor` is piecewise-linear
  through the overview anchors `{1→1, 10→25, 15→88}` (extrapolated past 15). Anchors: **L1 Common =
  10g**, **L10 Legendary = 6750g**.
- **Cube EXP** follows cube.md: `⌊ grade × itemLvFactor × gearTypeFactor × itemTypeFactor ×
levelMatch × (1 + expBonus) ⌋`. `itemLvFactor` interpolates cube.md's level table; `gearTypeFactor`
  maps our slots (weapon/body ×1, helm ×0.8, gloves ×0.75, boots ×0.7, ring ×3, amulet ×4);
  `itemTypeFactor` = gear ×1 (material ×12 deferred); `levelMatch = max(MIN, 1 − |itemLv − cubeLv| ×
FALLOFF)` (full at distance 0). Anchors: L1 Common weapon @ cube L1 = **2**, L5 Common @ L5 = **20**.
- **Cube levels** use cube.md's **sparse** EXP thresholds; `cubeLevelForExp` returns the highest
  reached anchor level (fine-grained per-level curve deferred). **Operation unlocks** are data
  (`CUBE_OPERATIONS`): Synthesis L1 · Alchemy L1 · Crafting L5 · Decoration L8 · Extraction L10 ·
  Engraving L15 · Offering L20 · Inscription L25.

## Steps

- [x] **17.0** Add `itemLevel?` to `Item`; set it in `generateItem`; add `itemLevelOf` helper +
      export. Update the generate-item snapshot. _Test:_ generated item carries its level; helper
      falls back to `levelReq`.
- [x] **17.1a** `threshold.ts`: `THRESHOLDS` bands (1–10, 10–15, 15–30, 30–40, 50–60) +
      `withinThreshold`. _Test:_ in-band true, out-of-band false at boundaries.
- [x] **17.1b** `synthesis.ts`: `synthesize(rng, items, { threshold, ratio? })` → discriminated
      result. _Test:_ 3 commons → 1 fresh uncommon (next rarity, fresh modifiers); wrong count,
      mixed rarity, mixed kind, max-rarity, non-equippable, and out-of-threshold all rejected.
- [x] **17.2** `alchemy.ts`: `sellValue(item)`. _Test:_ L1 Common = 10g; L10 Legendary = 6750g;
      grade ladder monotonic.
- [x] **17.3** `cube-exp.ts`: `cubeExpForItem`, `CUBE_EXP_THRESHOLDS`, `cubeLevelForExp`,
      `CUBE_OPERATIONS`, `isOperationUnlocked`. _Test:_ EXP anchors; level lookup at anchors;
      operation locked below its unlock level, unlocked at/above.
- [x] **17.4** `index.ts` barrel; full suite + typecheck + lint + build green.

## Deferrals logged

- **D-018** (existing) — crafting / offering / inscription / decoration / engraving / extraction
  cube ops: data-listed for unlock gating, behavior unimplemented.
- **D-030** (new) — material (×12) item-type EXP & per-gear-type alchemy gold weighting; fine-grained
  per-level cube-EXP thresholds (only sparse anchors implemented); `levelMatch` falloff tuning.
