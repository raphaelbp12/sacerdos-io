# Milestone 1 Plan — Stats + Modifiers

> **Goal (from [game-plan.md](../game-plan.md)):** Build attributes + `ModifierEffect`.
> **Acceptance test:** a character with base `AGI` 10 and a `+5 AGI` modifier reports `AGI` 15.
>
> No items, no equipment, no buffs, no rarity, no UI yet. Just the **pure domain core**:
> attributes, modifier effects (flat + percentage), and a stat-computation function.

---

## 1. Scope & non-goals

**In scope**

- The `Attribute` set: `HP`, `MP`, `STR`, `AGI`, `INT`.
- A `ModifierEffect` contract supporting **flat** and **percentage** modifiers.
- A pure stat computation: `Final = (base + Σ flat) × Π(1 + percentage)`.
- A minimal stat-holder (the seed of `Character`) exposing `getStat(attribute)`.

**Explicitly NOT in scope (later milestones)**

- Items, equipment slots, inventory (M2).
- `InstantEffect`, `Buff`, `Clock` (M3).
- Rarity scaling (M4).
- React UI (M2.5).
- `Rng` contract (introduced in M2).
- Any stat caching.

---

## 2. Architecture laws to honor

- **Domain purity:** every file in this milestone lives under `src/domain/` and imports **zero** React/DOM/Vite. Tests run in milliseconds.
- **Compute, don't store:** there is no stored "current stat" field. `getStat` derives the value on every read.
- **Order of operations (locked):** apply **all flat** modifiers first, then **all percentage** modifiers.
- **Depend on contracts:** the computation depends on a small `Modifier` interface, not on concrete effect classes.
- **Data, not code:** a modifier is a plain data object (`{ attribute, kind, value }`), not a subclass.

---

## 3. Proposed module layout

```
src/
  domain/
    stats/
      attribute.ts            # Attribute enum/union + the v1 set
      attribute.test.ts
      modifier.ts             # Modifier contract (flat | percentage) as data
      modifier.test.ts
      compute-stat.ts         # pure function: base + modifiers -> final value
      compute-stat.test.ts
      stat-block.ts           # base attribute map (the seed of Character)
      stat-block.test.ts
      character.ts            # holds base stats + modifiers, exposes getStat()
      character.test.ts
      index.ts                # public barrel for the stats module
```

> Rationale: one responsibility per file (SRP). `compute-stat` is a pure function with
> no knowledge of where modifiers come from, so it is trivially testable and reusable by
> equipment/buffs in later milestones (OCP — extend by adding modifier sources, not by
> editing the formula).

---

## 4. Contracts (the SOLID seams)

```ts
// attribute.ts
export type Attribute = "HP" | "MP" | "STR" | "AGI" | "INT";
export const ATTRIBUTES: readonly Attribute[] = [
  "HP",
  "MP",
  "STR",
  "AGI",
  "INT",
];

// modifier.ts
export type ModifierKind = "flat" | "percentage";

export interface Modifier {
  readonly attribute: Attribute;
  readonly kind: ModifierKind;
  readonly value: number; // flat: absolute units; percentage: 0.10 = +10%
}

// A source of modifiers — equipment, buffs, etc. will implement this later.
export interface ModifierSource {
  getModifiers(): readonly Modifier[];
}
```

- `Modifier` is **data**, not behavior (LSP/ISP-friendly — nothing to override).
- `ModifierSource` is the extension point: in M2 an equipped item is a `ModifierSource`;
  in M3 an active buff is a `ModifierSource`. `compute-stat` never changes (OCP).
- **Percentage convention (decide & document once):** store as a fraction where
  `0.10` means `+10%`. The formula multiplies by `(1 + value)`. Write this in a doc
  comment so future modules don't pass `10` for "10%".

---

## 5. The computation (single source of truth)

```ts
// compute-stat.ts
export function computeStat(
  base: number,
  modifiers: readonly Modifier[],
): number {
  const flat = modifiers
    .filter((m) => m.kind === "flat")
    .reduce((sum, m) => sum + m.value, 0);

  const afterFlat = base + flat;

  const percentMultiplier = modifiers
    .filter((m) => m.kind === "percentage")
    .reduce((product, m) => product * (1 + m.value), 1);

  return afterFlat * percentMultiplier;
}
```

> Note: callers filter modifiers by attribute _before_ calling, OR `computeStat`
> receives only the relevant attribute's modifiers. Keep `computeStat` ignorant of
> attribute identity (it just crunches numbers) — `Character.getStat` does the filtering.

---

## 6. Phased work plan (each step is a prompt)

The work is split into **phases**; each phase has **steps**, and every step is a
**copy-paste prompt** you hand to the agent. Run them **in order** — do not start a step
until the previous step's tests are green. Every prompt follows strict
**TDD (red → green → refactor)** and the architecture laws in §2.

> **How to use:** paste one step prompt at a time. Each prompt already instructs the agent
> to _write the failing test first, run it red, write the minimal code to pass (green),
> then refactor_ — and never to add production code without a test driving it.

### Phase 0 — Tooling & skeleton

> Outcome: `npm test` runs and discovers tests under `src/domain/`.

**Step 0.1 — Confirm the Vitest harness**

```text
Verify the Vitest test harness is wired for this repo. Check vite.config.ts (or add a
vitest.config.ts) so that `npm test` runs and discovers *.test.ts files under src/domain/.
Decide between Vitest `globals: true` or explicit imports of { describe, it, expect } and
document the choice. Create a temporary src/domain/stats/smoke.test.ts with one trivial
passing assertion, run `npm test` to prove the harness works, then delete the smoke test.
Do not add any runtime libraries — Milestone 1 is pure TypeScript arithmetic. Optionally
add a "test:run": "vitest run" script for one-shot/CI runs.
```

### Phase 1 — Attributes (the vocabulary)

> Outcome: the 5 locked attributes exist as a typed, closed set.

**Step 1.1 — Define the attribute set (TDD)**

```text
Using TDD, create src/domain/stats/attribute.ts. First write a failing test
attribute.test.ts asserting that ATTRIBUTES contains exactly the five locked attributes
HP, MP, STR, AGI, INT (no more, no fewer) and that its element type is the Attribute union.
Run it red, then implement the Attribute union type and the ATTRIBUTES readonly array to
make it green. Keep the file free of any React/DOM/Vite imports. Refactor only for clarity.
```

### Phase 2 — The computation engine (`computeStat`)

> Outcome: a **pure** function crunching base + modifiers into a final value, with the
> locked **flat-then-percentage** order. Built incrementally: empty → flat → percentage →
> ordering → compounding.

**Step 2.1 — Modifier contract + base-only computation (TDD)**

```text
Using TDD, create src/domain/stats/modifier.ts with the Modifier data interface
({ attribute, kind: 'flat' | 'percentage', value }) and the ModifierSource interface, and
document the percentage convention (0.10 means +10%) in a doc comment. Then start
src/domain/stats/compute-stat.ts: write a failing test in compute-stat.test.ts asserting
computeStat(10, []) returns 10 (no modifiers means base unchanged). Run red, then implement
the minimal computeStat(base, modifiers) returning base. The function must be pure
(deterministic, no side effects) and must not know about attribute identity.
```

**Step 2.2 — Flat modifiers sum (TDD)**

```text
Continuing compute-stat.ts with TDD, add a failing test: computeStat(10, [one +5 flat
modifier]) returns 15. Run red, then add flat-modifier summation. Add a second failing test
locking that multiple flat modifiers stack: base 10 with +5 and +3 flat returns 18. Make
both green with the minimal change.
```

**Step 2.3 — Percentage modifiers product (TDD)**

```text
Continuing compute-stat.ts with TDD, add a failing test: computeStat(10, [one +10%
percentage modifier with value 0.10]) returns 11. Run red, then add the percentage step as
a multiplicative product of (1 + value). Add a second failing test locking that two +10%
percentages compound multiplicatively: base 10 returns 12.1 (10 * 1.1 * 1.1). Make green.
```

**Step 2.4 — Lock the operation order (flat before percentage) (TDD)**

```text
Continuing compute-stat.ts with TDD, add a failing test that pins the locked order of
operations: base 10 with a +5 flat AND a +10% percentage must return 16.5 (flat first:
(10 + 5) * 1.1), NOT 16.0. If it already passes, good; if not, fix the order so flat is
always applied before percentage. Add a short doc comment in compute-stat.ts stating the
locked order.
```

### Phase 3 — The Character (compute-don't-store)

> Outcome: a tiny stat-holder that filters modifiers by attribute and delegates to
> `computeStat`. The **milestone acceptance test** lands here.

**Step 3.1 — `getStat` headline acceptance test (TDD)**

```text
Using TDD, create src/domain/stats/character.ts. Write the failing milestone acceptance
test in character.test.ts: a Character constructed with base stats { HP, MP, STR, AGI: 10,
INT } and a single +5 AGI flat modifier returns 15 from getStat('AGI'). Run red, then
implement Character so getStat(attribute) reads the base for that attribute, filters the
modifiers to that attribute, and returns computeStat(base, relevantModifiers). There must
be NO stored "current stat" field — compute on every read. Keep zero React/DOM imports.
```

**Step 3.2 — Attribute isolation guard (TDD)**

```text
Continuing character.test.ts with TDD, add a failing test proving getStat ignores modifiers
targeting a different attribute: a Character with base AGI 10 and a +5 STR modifier still
returns AGI 10 from getStat('AGI'). Run red if needed, then ensure the attribute filtering
is correct. Add another test locking that an attribute with no modifiers (e.g. HP) returns
exactly its base value.
```

### Phase 4 — Public surface & verification

> Outcome: a clean module boundary and a green, lint-clean milestone.

**Step 4.1 — Barrel export**

```text
Create src/domain/stats/index.ts that re-exports the public surface: Attribute, ATTRIBUTES,
Modifier, ModifierKind, ModifierSource, computeStat, and Character. Do not export internal
helpers. Verify nothing outside src/domain/ is imported by these files.
```

**Step 4.2 — Final verification**

```text
Run the full Milestone 1 check: `npm test` must be fully green and `npm run lint` must pass
with no errors. Confirm the headline acceptance test (base AGI 10 + 5 AGI -> 15) and the
ordering test (flat-then-percentage -> 16.5) both pass. Confirm no file under src/domain/
imports React, DOM, or Vite. Report the final test count and any follow-ups.
```

---

## 7. Step → test map (quick reference)

| Phase | Step | Red (failing test)                               | Green (minimal code)               |
| ----- | ---- | ------------------------------------------------ | ---------------------------------- |
| 0     | 0.1  | smoke test passes via `npm test`                 | wire Vitest config                 |
| 1     | 1.1  | `ATTRIBUTES` = the 5 locked attributes           | `Attribute` + `ATTRIBUTES`         |
| 2     | 2.1  | `computeStat(10, [])` → `10`                     | `Modifier` contract; return `base` |
| 2     | 2.2  | `+5` → `15`; `+5` & `+3` → `18`                  | flat summation                     |
| 2     | 2.3  | `+10%` → `11`; `+10%`×2 → `12.1`                 | percentage product                 |
| 2     | 2.4  | `+5` flat & `+10%` → `16.5`                      | lock flat-before-percent order     |
| 3     | 3.1  | base `AGI 10` + `+5 AGI` → `15` (**acceptance**) | `Character.getStat`                |
| 3     | 3.2  | `+5 STR` doesn't change `AGI`; bare `HP` = base  | attribute filtering                |
| 4     | 4.1  | public exports resolve                           | `index.ts` barrel                  |
| 4     | 4.2  | whole suite green + lint clean                   | —                                  |

> **Milestone acceptance** is Step 3.1 (the spec's headline test). Steps 2.4, 3.2 are guard
> tests that lock the trickier rules (ordering, attribute isolation) so later milestones
> can't silently break them.

---

## 8. Character seed (target shape)

```ts
// character.ts
export class Character {
  constructor(
    private readonly baseStats: Readonly<Record<Attribute, number>>,
    private readonly modifiers: readonly Modifier[] = [],
  ) {}

  getStat(attribute: Attribute): number {
    const base = this.baseStats[attribute];
    const relevant = this.modifiers.filter((m) => m.attribute === attribute);
    return computeStat(base, relevant);
  }
}
```

- For M1, modifiers are passed in directly. In M2 they'll be **collected** from
  `ModifierSource`s (equipped items) instead of being hand-passed — `getStat` changes
  its _source_ of modifiers, not its formula.
- No setters for "current stat" — there is no such field (compute-don't-store).

---

## 9. Definition of Done

- [ ] Every step prompt (0.1 → 4.2) executed in order; `npm test` is green.
- [ ] The headline acceptance test (base `AGI 10` + `+5 AGI` → `15`) passes.
- [ ] Ordering test (flat-before-percent → `16.5`) passes.
- [ ] No file under `src/domain/` imports React/DOM/Vite.
- [ ] `computeStat` is a pure function (no side effects, deterministic).
- [ ] Percentage convention is documented in `modifier.ts`.
- [ ] Public surface exported via `src/domain/stats/index.ts`.
- [ ] Lint passes (`npm run lint`).

---

## 10. What this unlocks for later milestones

- **M2 (items/equipment):** an equipped item becomes a `ModifierSource`; `Character`
  aggregates modifiers from all sources before calling the same `computeStat`.
- **M3 (buffs):** an active buff is just another `ModifierSource` that appears/disappears
  over time — no formula change.
- **M4 (rarity):** rarity scales a modifier's `value` at item-build time; `computeStat`
  is untouched.

The seams chosen here (`Modifier` data + `ModifierSource` interface + pure `computeStat`)
are the whole reason later milestones add features by **adding data/sources**, not by
editing the engine.
