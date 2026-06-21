# Milestone 13 Plan — Economy & gold

> **Goal:** kills pay out **gold**, the main currency, and a **`Wallet`** holds it. Gold scales
> with the stage and differs by **source** — a weak monster, a strong monster, a stage boss, and
> an act boss each pay a different amount, and each source is **independently rune-modifiable**
> later (flat + percent). The wallet can be added to and spent from but **never goes negative**.
>
> **Headline acceptance test:** at the first stage of the first act a normal (weak) monster pays
> **1 gold** and a stage boss pays **10×** that; a strong monster pays **2×** a weak one (the
> endgame `1k : 2k` ratio from the overview); flat + percent modifiers stack in the
> stat-engine order; a `Wallet` rejects spending more than its balance.

---

## 0. Decisions (made up-front, no blocking questions)

1. **New pure module `src/domain/economy/`.** Zero React/DOM/Vite. It imports **nothing** from
   other domain modules — gold/wallet are self-contained primitives. Nothing inner imports it
   (no cycle). The outer shell / future systems (runes M18, cube M17) compose it.
2. **Gold has its own `GoldSource` enum, separate from XP's `KillSource` (M11).** They look
   similar but differ: gold distinguishes a **weak** vs **strong** normal monster (the overview's
   `1k` vs `2k` endgame anchors), whereas XP does not. Coupling them would force a false shared
   shape — keep them independent (they can both be fed from the same kill event by the caller).
3. **`goldForKill(source, stageLevel, modifiers)` is a pure function over data.** Base gold per
   source × stage level, then **flat then percent** — the same order as the stat engine and
   `effectiveRespawnMs` (DRY). The hard anchors (`weak = 1`, `boss = 10×` at stage level 1) are
   exact; the absolute endgame numbers (`1k` / `2k`) are reached via stage scaling **plus** rune
   buffs, so balancing the curve is **deferred** (D-026).
4. **Per-source modifiers are the rune hook.** `GoldModifiers { flat?, percent? }` is passed in
   per call; rune node 4 ("increase gold received: gold percentage, flat gold per monster, per
   boss") supplies these in M18. M13 just honors them.
5. **`Wallet` owns the only state.** `balance` never negative; `spend` **throws** on insufficient
   funds (consistent with M7 skill-points throwing on illegal ops), and `canAfford` is the
   non-throwing check. Amounts must be non-negative finite numbers.

---

## 1. Design

- **`gold.ts`** — `GoldSource` union; `BASE_GOLD` data; `GoldModifiers`; `goldForKill`.
- **`wallet.ts`** — `Wallet` (`balance` / `add` / `spend` / `canAfford`).
- **`index.ts`** — public barrel.

### Gold model

| Source          | Base @ stage 1 | Rationale                             |
| --------------- | :------------: | ------------------------------------- |
| `weakMonster`   |       1        | overview anchor (act 1-1 normal = 1)  |
| `strongMonster` |       2        | overview endgame ratio `1k : 2k` = 2× |
| `stageBoss`     |       10       | overview "boss gives 10×" the monster |
| `actBoss`       |       50       | act boss > stage boss (mirrors XP 5×) |

`goldForKill(source, stageLevel, { flat = 0, percent = 0 })`
`= floor((BASE_GOLD[source] × stageLevel + flat) × (1 + percent))`.

## 2. Steps (TDD order)

- [x] **13.1 goldForKill** — anchors: stage-level-1 `weakMonster = 1`, `stageBoss = 10`
      (10× the weak monster), `strongMonster = 2`, `actBoss = 50`; gold scales linearly with
      stage level; `flat` adds before `percent` multiplies; `stageLevel` must be an integer ≥ 1.
- [x] **13.2 Wallet** — starts at 0 (or a given balance); `add` raises the balance; `spend`
      lowers it; `spend` more than the balance is **rejected** (throws) and leaves the balance
      unchanged; `canAfford` reflects affordability; negative amounts are rejected.

## 3. Deferrals

- **D-026** — gold scaling / balance curve. The base values and linear stage scaling are
  placeholders; the absolute endgame anchors (`1k` weak / `2k` strong with all buffs) need real
  tuning once the rune tree (M18) and stage spread exist.
- Second currency + character/group shop stay deferred (**D-019**, surfaces in M19).
