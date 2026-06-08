# Milestone 6 Plan — Derived Stats + Minimal Combat (give loot a purpose)

> **Goal:** Close the loop. Until now, items → equipment → generation all feed raw attributes
> that **nothing consumes**. This milestone adds (a) **derived/secondary stats** that turn raw
> attributes into combat-meaningful numbers, and (b) a **minimal combat resolve** against a
> training dummy so that equipping a better item is _observably_ better.
>
> **Headline acceptance test:** a character with a `Short Sword (+STR)` equipped deals
> **more** damage to the dummy than the same character unarmed, and the result is deterministic
> under a seeded `Rng`.
>
> **Why now (design rationale):** generation (M5) made loot infinite but purposeless. Adding
> affix depth (see [deferred-decisions-log.md](deferred-decisions-log.md) D-001/D-002/D-003)
> before anything _reads_ stats would polish a machine nobody pulls. Combat is the smallest
> consumer that makes loot matter — build it first, then deepen loot afterward.

---

## 0. Read this first (context for the implementer)

You are working inside an existing **pure domain layer** under `src/domain/`. Reuse the
contracts already present — **do not re-invent them**. Read these before writing code:

- [src/domain/stats/character.ts](../src/domain/stats/character.ts) — `Character`. Already has
  `getStat(attribute)`, `currentHP`, and a working **`takeDamage(amount)`** (currently called
  by nothing — this milestone is its first real consumer).
- [src/domain/stats/attribute.ts](../src/domain/stats/attribute.ts) — `Attribute` union (`HP`, `MP`, `STR`, `AGI`, `INT`).
- [src/domain/stats/compute-stat.ts](../src/domain/stats/compute-stat.ts) — `computeStat`. The derived-stat formulas should _read_ `character.getStat(...)`, not duplicate modifier logic.
- [src/domain/rng/rng.ts](../src/domain/rng/rng.ts) — the `Rng` contract (`nextInt`, `nextFloat`).
- [src/domain/rng/seeded-rng.ts](../src/domain/rng/seeded-rng.ts) — `SeededRng` (from M5). Reuse for deterministic combat tests.
- [src/App.tsx](../src/App.tsx) — the UI shell; has the M5 "Generate Item" button and an `appRng`.

### The core mental model

```
raw attributes (HP/MP/STR/AGI/INT)
        │  getStat()  ← already exists
        ▼
derived stats (Attack, Defense, MaxHP, CritChance, DodgeChance)   ← Phase 1 (pure)
        │
        ▼
combat resolve (attacker vs defender, one hit)                    ← Phase 2 (uses Rng + takeDamage)
        │
        ▼
a "training dummy" + an "Attack" button                           ← Phase 3 (UI)
```

Derived stats are the **connective tissue**: they make STR/AGI/INT mean something and make
equipment comparisons interesting on their own, even before combat. Combat is the **consumer**
that gives the whole stack stakes.

---

## 1. Architecture laws to honor (do not violate)

- **Domain purity:** every new domain file lives under `src/domain/` and imports **zero** React/DOM/Vite.
- **Inject randomness:** combat receives an `Rng`. **Never call `Math.random()`** in domain code. Tests pass a `SeededRng` and assert exact outcomes.
- **Compute, don't store:** derived stats are **computed on read** from `getStat(...)`, exactly like attributes. No stored "current attack" field. (`currentHP` remains the one deliberately stateful value, as today.)
- **Depend on contracts:** combat depends on a small **combatant contract** (something that can report its derived stats and take damage), not on the concrete `Character`. This keeps the future enemy system (deferred — D-009) pluggable.
- **Data, not code:** tuning numbers (how much STR → Attack, crit multiplier, etc.) are named constants in one place, not scattered magic numbers.
- **TDD:** failing test first for every step, then minimal code, then refactor.
- **SRP:** keep derived-stat formulas, the combat resolver, and the dummy in separate files.
- **Log deferrals:** if you scope anything out, append a `D-###` entry to [deferred-decisions-log.md](deferred-decisions-log.md).

---

## 2. Proposed module layout

```
src/
  domain/
    combat/                       # NEW subsystem
      derived-stats.ts            # NEW: computeDerivedStats(combatant) -> DerivedStats
      derived-stats.test.ts       # NEW
      combatant.ts                # NEW: Combatant contract (interface)
      resolve-attack.ts           # NEW: resolveAttack(attacker, defender, rng) -> AttackResult
      resolve-attack.test.ts      # NEW
      training-dummy.ts           # NEW: a minimal Combatant for the UI/tests
      training-dummy.test.ts      # NEW
      index.ts                    # NEW: public barrel for the combat module
```

> Rationale: combat is its own bounded subsystem. It depends on `stats` and `rng`, and is
> depended on by the UI. Nothing in `stats` or `items` imports `combat`.

---

## Phase 1 — Derived stats (pure, no randomness)

> Goal: turn raw attributes into combat-meaningful numbers. Pure functions, trivial to test.
> Start **small** — a handful of derived stats with simple, tunable formulas.

- [ ] **1.1** Write `derived-stats.test.ts` first. Assert (use a plain `Character` with known base stats, no equipment):
  - [ ] `Attack` scales with `STR` (e.g. base + STR-based term). Lock an explicit anchor (e.g. STR 10 → Attack 10).
  - [ ] `Defense` scales with a chosen attribute (e.g. AGI or a flat from STR) — pick one, document it, lock an anchor.
  - [ ] `MaxHP` equals `getStat("HP")` (derived stat that simply surfaces the HP attribute as the combat pool).
  - [ ] `CritChance` scales with `AGI`, is clamped to `[0, 1]`, and a known AGI yields a known chance.
  - [ ] `DodgeChance` scales with `AGI`, clamped to `[0, 1]`.
  - [ ] Equipping an item that raises `STR` (via a `ModifierSource`) raises `Attack` on the next call — proves derived stats read live `getStat`, not a snapshot.
- [ ] **1.2** Define the output shape in `derived-stats.ts`:
  ```ts
  export interface DerivedStats {
    readonly attack: number;
    readonly defense: number;
    readonly maxHP: number;
    readonly critChance: number; // [0, 1]
    readonly dodgeChance: number; // [0, 1]
  }
  ```
- [ ] **1.3** Implement `computeDerivedStats(c: { getStat(a: Attribute): number }): DerivedStats`.
  - Read attributes via `getStat` only; do **not** reach into modifiers directly.
  - Keep formula coefficients as named constants at the top of the file (e.g. `STR_TO_ATTACK`, `AGI_TO_CRIT`, `CRIT_MULTIPLIER` lives in Phase 2). Document each formula in a comment.
  - Clamp `critChance` / `dodgeChance` into `[0, 1]`.
- [ ] **1.4** ✅ Confirm: Phase 1 tests pass; the function is pure and React-free.

> Design note: keep formulas deliberately simple (linear) for v1. Balancing curves are a
> future tuning pass; the point now is that attributes _drive_ combat numbers.

---

## Phase 2 — The combatant contract + combat resolve

> Goal: one function that resolves a single attack, using derived stats and the injected `Rng`.
> Depends on a small **contract**, not on `Character`, so a future enemy type slots in.

- [ ] **2.1** Define the `Combatant` contract in `combatant.ts`:
  ```ts
  import type { DerivedStats } from "./derived-stats";
  export interface Combatant {
    readonly name: string;
    getDerivedStats(): DerivedStats;
    get currentHP(): number;
    takeDamage(amount: number): void;
  }
  ```

  - [ ] Note: the existing `Character` does **not** implement `getDerivedStats()` yet. Choose ONE approach and document it:
    - **(Preferred, non-invasive):** an adapter/helper `asCombatant(character, name)` in the combat module that wraps a `Character` and implements `Combatant` by delegating to `computeDerivedStats(character)`, `character.currentHP`, `character.takeDamage`. Keeps `stats` ignorant of `combat`.
    - (Alternative) add `getDerivedStats()` to `Character` — rejected, because it would make the `stats` module depend on `combat`, violating one-way deps. **Do not do this.**
- [ ] **2.2** Write `resolve-attack.test.ts` first. With a `SeededRng`, assert:
  - [ ] **Deterministic:** same attacker/defender derived stats + same seed → identical `AttackResult`.
  - [ ] **Damage formula:** on a normal hit, `defender.currentHP` drops by `max(1, attack - defense)` (or your chosen formula — lock it explicitly). Damage is never below a floor (e.g. 1).
  - [ ] **Dodge:** if the rng roll is within `defender.dodgeChance`, the result is a **miss** (0 damage, `dodged: true`). Force this by seeding.
  - [ ] **Crit:** if the rng roll is within `attacker.critChance`, damage is multiplied by `CRIT_MULTIPLIER` and `crit: true`. Force this by seeding.
  - [ ] **HP floor:** damage never takes `currentHP` below 0 (delegated to existing `takeDamage`).
  - [ ] **Lethal:** the result reports whether the defender reached 0 HP (`defeated: true`).
- [ ] **2.3** Define the result shape and implement `resolveAttack`:
  ```ts
  export interface AttackResult {
    readonly attacker: string;
    readonly defender: string;
    readonly damage: number;
    readonly crit: boolean;
    readonly dodged: boolean;
    readonly defeated: boolean; // defender at 0 HP after this hit
  }
  export function resolveAttack(
    attacker: Combatant,
    defender: Combatant,
    rng: Rng,
  ): AttackResult;
  ```
  Algorithm (keep linear and readable; **decide rng call order once and lock it** — the tests depend on it):
  1. Read `attacker.getDerivedStats()` and `defender.getDerivedStats()`.
  2. **Dodge check:** `rng.nextFloat() < defender.dodgeChance` → miss; return `damage 0, dodged true`.
  3. **Crit check:** `rng.nextFloat() < attacker.critChance` → `crit true`.
  4. **Damage:** `base = max(DAMAGE_FLOOR, attack - defense)`; if crit, `base *= CRIT_MULTIPLIER` (floor to int).
  5. `defender.takeDamage(damage)`.
  6. Return the populated `AttackResult` (`defeated = defender.currentHP === 0`).
  - Keep `DAMAGE_FLOOR` and `CRIT_MULTIPLIER` as named constants.
- [ ] **2.4** ✅ Confirm: Phase 2 tests pass; `resolveAttack` calls `takeDamage` (the dormant method now has a real consumer).

---

## Phase 3 — Training dummy + the headline test

> Goal: the smallest possible opponent, plus the end-to-end proof that loot matters.

- [ ] **3.1** Write `training-dummy.ts`: a minimal `Combatant` with fixed derived stats and a
      mutable HP pool. Constructor takes a name, max HP, and a `defense` (and zero crit/dodge).
      Implement `getDerivedStats`, `currentHP`, `takeDamage`. (This is a stand-in until a real
      enemy system — deferred as **D-009** — exists.)
- [ ] **3.2** Write `training-dummy.test.ts`: HP starts at max; `takeDamage` reduces it, floored at 0.
- [ ] **3.3** Write the **headline integration test** (can live in `resolve-attack.test.ts` or a new file):
  - [ ] Build a `Character`, wrap via `asCombatant`. Record damage dealt to a fresh dummy with a fixed seed.
  - [ ] Equip a generated/seed `Short Sword (+STR)`. Wrap again. Attack a fresh dummy with the **same seed**.
  - [ ] Assert the second hit deals **strictly more** damage. _This is the milestone's whole point: a better item is observably better._
- [ ] **3.4** Export the public surface from `src/domain/combat/index.ts`: `computeDerivedStats`, `DerivedStats`, `Combatant`, `asCombatant`, `resolveAttack`, `AttackResult`, `TrainingDummy`.
- [ ] **3.5** ✅ Confirm: Phase 3 tests pass.

---

## Phase 4 — Wire into the UI (thin, high-value)

> Goal: make combat visible. Prove generate → equip → stats change → _hit harder_ on screen.

- [ ] **4.1** In [src/App.tsx](../src/App.tsx), add a **Derived Stats panel** showing `computeDerivedStats` for the player character (Attack, Defense, Max HP, Crit %, Dodge %). It should update when equipment changes, like the existing Stats panel.
- [ ] **4.2** Add a small **training dummy** to state (a `TrainingDummy` with some HP) and an **"Attack Dummy"** button. On click: call `resolveAttack(asCombatant(character), dummy, appRng)`, show the `AttackResult` (damage / crit / dodge / defeated) in a small combat-log area, and force re-render.
- [ ] **4.3** Add a **"Reset Dummy"** button (re-create the dummy at full HP) so the loop is repeatable.
- [ ] **4.4** ✅ Manual test: note dummy damage → generate & equip a `+STR` weapon → attack again → damage is higher; crits/dodges occasionally appear in the log.

---

## Phase 5 — Cleanup & docs

- [ ] **5.1** Run the full test suite (Vitest) — all green.
- [ ] **5.2** Run lint + build (`npm run lint`, `npm run build`) — no errors.
- [ ] **5.3** Confirm **no** `Math.random()` and no wall-clock reads in any `src/domain/` file (combat included).
- [ ] **5.4** Confirm one-way deps still hold: `combat` may import from `stats`/`rng`; `stats`/`items` must **not** import from `combat`; no domain file imports React.
- [ ] **5.5** Append/refresh deferred entries (see below) in [deferred-decisions-log.md](deferred-decisions-log.md).

---

## Explicitly NOT in this milestone (append these to the deferred log)

- **Full enemy/monster system** (variety, AI, behaviors) — only a training dummy here. (**D-009**)
- **XP / leveling** — the character does not gain levels from winning. `itemLevel` stays UI-driven. (**D-008**)
- **Turn order / initiative / multi-round battle loop** — Phase 2 resolves a **single** attack; a full battle loop is a future milestone. _(New entry — assign next free `D-###`.)_
- **MP / resource costs, skills, abilities** — basic attack only; skills remain deferred (**D-011**).
- **Loot-on-victory / drop tables** — defeating the dummy awards nothing yet. (**D-005**)
- **Status effects from combat** (poison, stun) — out of scope. _(New entry — assign next free `D-###`.)_

> When you defer the two _new_ items above, add them to the log with proper `D-###` ids,
> rationale, and revisit triggers, per the project rule.

---

## Definition of done

- [ ] `computeDerivedStats` turns raw attributes into Attack / Defense / Max HP / Crit / Dodge, computed on read.
- [ ] `resolveAttack(attacker, defender, rng)` deterministically resolves one hit (dodge, crit, damage floor, lethal), using the existing `takeDamage`.
- [ ] Combat depends on a `Combatant` contract, not on concrete `Character`; `Character` is adapted, not modified to know about combat.
- [ ] Headline test proves equipping a `+STR` weapon strictly increases damage dealt.
- [ ] No `Math.random()` / wall-clock in any domain file; one-way dependencies intact.
- [ ] UI shows derived stats and lets the player attack a resettable dummy, with a visible combat log.
- [ ] All new code is TDD'd; every phase's tests are green; lint + build pass.
- [ ] New deferrals recorded in the deferred-decisions log.
