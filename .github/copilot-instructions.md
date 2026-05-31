# Copilot Instructions — sacerdos-io

TypeScript game-systems prototype (items, stats, effects). A pure domain layer with a thin React UI shell on top. See [game-plan.md](../game-plan.md) for the full design and locked decisions.

## Always follow

- **TDD.** Write the failing test first, then the minimal code to pass it, then refactor. Never add production code without a test driving it. Use the TDD order in the milestones (e.g. flat modifier → percent modifier → both).
- **SOLID.** Depend on interfaces/contracts, not concrete types. Compose behavior (items _have_ a list of effects); do not build deep inheritance trees. Each system has one responsibility and is unit-testable in isolation.

## Prefer libraries and commands over hand-rolling

- **Don't reinvent the wheel.** If a well-maintained, popular library does the job (seeded RNG, deep-equality, test helpers, UI), use it instead of a hand-written implementation. Hand-roll only when no good library exists or the dependency cost clearly outweighs the benefit.
- **Bootstrap and scaffold via commands**, not by hand-creating config files. Use the official scaffolders/CLIs — e.g. create the React web app with `npm create vite@latest . -- --template react-ts`, add packages with `npm install`, run scripts via `npm run`. Let tooling generate boilerplate, lockfiles, and config.

## Architecture laws (from the locked plan)

- **Domain purity:** code under the domain layer must have **zero DOM/React/Vite imports**. The UI depends on the domain, never the reverse. This keeps domain tests running in milliseconds.
- **One-way dependencies:** the React UI shell **uses** the systems below it; the systems **must not know** the UI (or any outer layer) exists. Dependencies point inward only: UI → systems, never the reverse.
- **Compute, don't store:** final stats are derived on read via `getStat(attribute)`. There is no stored "current stat" field. Order of operations: all **flat** modifiers first, then **percentage** modifiers. Don't build a stat cache yet.
- **Inject time and randomness:** durations go through an injected `Clock` contract; randomness goes through an injected `Rng` contract. **Never call `Math.random()` or read wall-clock time directly in domain code** — tests pass deterministic seeded versions.
- **Data, not code, defines content:** a new item/effect/buff is a data entry, not a new class. An item is a bundle of effects that differ only in _when_ they apply.

## Stack & tooling

- **TypeScript + Vite + Vitest**, React UI shell (mobile-first, single column).
- Tests live alongside code as `*.test.ts` / `*.test.tsx` and run with Vitest.

## Locked facts (code against these)

- **Attributes:** `HP`, `MP`, `STR`, `AGI`, `INT`.
- **Modifiers:** flat and percentage.
- **Equipment slots (7, single-capacity):** `weapon`, `helm`, `body`, `gloves`, `boots`, `ring`, `amulet`.
- **Rarity:** Common→Uncommon→Rare→Epic→Legendary, multiplier = tier index (1×–5×).
- **Level requirement:** hard block (can't equip below required level).
- **Buff stacking:** refresh (re-apply resets the timer; no stacking).
