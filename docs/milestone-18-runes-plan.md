# Milestone 18 — Runes tree (account-wide buffs)

> **Goal (from the roadmap).** A gold sink that grants **account-level** progression layered
> _above_ the character: a tree of nodes the player buys with gold. Stat nodes contribute a
> `ModifierSource` (so `getStat` picks them up exactly like passives/items); non-stat nodes
> expose typed **perks** (exp, gold, drops, inventory, stash, respawn, cube-EXP, QoL slots) that
> the existing systems read. There are **no prerequisites** — the tree shape only drives
> **discovery** (adjacent nodes reveal on purchase) and **cost** (deeper = pricier).
>
> Specs: [game-overview.md](game-overview.md) §"Runes" (tree shape 1→2→6, the six branch themes,
> per-node max level, cost grows with depth + level, no prerequisites), §"economy" (gold is the
> only sink), §"Inventory and stash" (slots/tabs grow via runes), §"respawn" (flat seconds +
> percentage reduction via runes), §"Cube system" (EXP gain buffable via runes).

All new code lives under `src/domain/runes/` and obeys the architecture laws: pure (no DOM/React),
**compute-don't-store**, **data-not-code** (every node is a `RUNE_TREE` row), **one-way deps**
(`runes → stats` only; nothing inner imports runes, and runes imports no sibling system — the
hook adapters return objects that **structurally** match each hook's param, so runes stays
decoupled from `economy` / `revive` / `loot` / `cube`). TDD: failing test first, minimal pass.

## Locked design decisions (I decided the open ones)

- **Tree is discovery + cost only, never a purchase gate.** The overview says nodes have "no
  pre-requisites, they only cost gold," yet are laid out as a tree (root → 2 → 6 themed branches).
  So `RuneNode.depth` exists purely to (a) scale cost and (b) let the UI reveal adjacent nodes; it
  never blocks a buy. This keeps `RuneState.buy` a pure level bump.
- **One effect per node** (`RuneEffect` = discriminated `stat | perk`). Multi-stat themes are
  modelled as **multiple sibling nodes**, not one node with many effects — mirrors how `PASSIVES`
  is one row per choice (data-not-code, easy to balance individually).
- **Stat nodes feed the existing `ModifierSource` pipeline.** `RuneState implements
ModifierSource`; its `getModifiers()` emits `perLevel × level` per allocated stat node. A
  `Character` simply lists the `RuneState` among its sources — no engine change (Open/Closed).
- **Non-stat perks are typed getters.** `perkValue(perk)` sums `perLevel × level` across nodes;
  thin adapters shape them for each consumer **without importing that consumer's type**
  (TS structural typing): `goldModifiersFor("monster"|"boss") → {flat,percent}` (≈ `GoldModifiers`),
  `respawnReduction() → {flatMs,percent}` (≈ `RespawnReduction`), `cubeExpOptions() → {expBonus}`
  (≈ `CubeExpOptions`), `inventoryCapacity(base)`, `chestCapacity(base)`, `stashTabCount(base)`,
  `dropChanceBonus()`, `skillSlots/heroSlots/groupSlots(base)`.
- **Cost model:** `runeCostAt(node, currentLevel) = ⌊ baseCost × DEPTH_GROWTH^depth × (currentLevel+1) ⌋`
  with `DEPTH_GROWTH = 1.5`. Strictly increasing in both **depth** and **level** (the only
  property the overview pins down — exact numbers are to be balanced later, `D-031`).
- **Gold-source mapping:** monster-flat perks apply to weak/strong monsters; boss-flat perks apply
  to stage/act bosses; the percent perk applies to all. `goldModifiersFor` takes `"monster" | "boss"`
  to stay decoupled from `economy`'s four-way `GoldSource` union.

## Steps

- [x] **18.0** `rune-node.ts`: `RunePerk` union, `RuneEffect` (stat | perk), `RuneNode`, and
      `runeCostAt`. _Test:_ cost strictly rises with depth and with level; rejects out-of-range
      level.
- [x] **18.1** `rune-tree.ts`: `RUNE_TREE` data — root → 2 branches → 6 themed categories →
      leaves covering every perk. _Test:_ tree shape invariants (single depth-0 root; depth-1 has
      2; every perk in `RunePerk` appears at least once; ids unique).
- [x] **18.2a** `rune-state.ts`: `RuneState` (levels, `buy`/`costToBuy`/`isMaxed`/`levelOf`)
      `implements ModifierSource`. _Test:_ buying a stat node raises the global stat via `getStat`
      on a `Character`; max level enforced; cost ladder matches `runeCostAt`.
- [x] **18.2b** Perk getters + hook adapters. _Test (each hook reads the rune value):_ gold
      (`goldForKill` + `goldModifiersFor`), respawn (`effectiveRespawnMs` + `respawnReduction`),
      cube EXP (`cubeExpForItem` + `cubeExpOptions`), inventory cap (`new Inventory(inventoryCapacity)`),
      drops/chest (`new ChestInventory(chestCapacity)` + `dropChanceBonus`).
- [x] **18.3** `index.ts` barrel; typecheck + lint + build + full suite green.

## Deferrals (append to the D-### log when reached)

- **D-031** — Rune cost/value **balancing** (per-node `baseCost`, `maxLevel`, `perLevel`, the
  `DEPTH_GROWTH` constant). Numbers are placeholders; revisit once a gold-income curve exists.
- **D-032** — UI-side **node reveal / adjacency** (the tree's discovery graph). The domain stores
  depth + branch metadata; rendering the unlock graph is the outer shell's job.
- **D-033** — Wiring rune perks into systems that lack a modifier param today (XP `xpForKill`,
  skill/hero/group **slot** consumers, offline-window). Perks are exposed now; their consumers
  adopt them when those systems gain the hook.
