# Milestone 6 Plan — Canonical stats + damage formula + defense order

> **⚠️ This plan supersedes the earlier "Derived Stats + Minimal Combat" draft.** The roadmap
> ([game-implementation-roadmap.md](game-implementation-roadmap.md) §1) replaces the bootstrap
> attribute set (`HP/MP/STR/AGI/INT`) with the **canonical `Stat` model** from
> [game-overview.md](game-overview.md). `attack` is now a _first-class stat_, not something
> derived from `STR`. The old "`STR → Attack` derived stats / crit / dodge-from-AGI" design is
> dropped; crit does not exist in the overview.
>
> **Goal:** make stats _mean something_. Replace the bootstrap attributes with the canonical
> `Stat` set, then implement the overview's **damage formula** and **defense / damage-taken
> order** as pure, composable functions, resolved through a `Combatant` contract with an
> injected `Rng`.
>
> **Headline acceptance test:** a `Character` whose weapon adds `+attack` deals **strictly
> more** damage to a training dummy than the same character without it, deterministically under
> a seeded `Rng`.

---

## 0. Confirmed decisions (open questions §5 of the roadmap)

1. **Stat migration:** migrate **in place** — rename the union to `Stat`, re-point all data,
   **delete** `STR/AGI/INT/MP`. No dead aliases.
2. **Chance/rate stats:** add a data-driven **`STAT_SCHEMA`** (accepted modifier kinds,
   default base, clamp range). `computeStat` stays generic `(base + Σflat) × Π(1+%)`; `getStat`
   applies the per-stat **default** and **clamp**. Fraction stats (`damage`, `cooldownReduction`,
   resists, `blockChance`, `dodgeChance`, `damageReduction`) accept **only `flat`** modifiers
   storing fractions, so `computeStat` sums them additively.
3. **Armor → physical-resist curve:** `physicalResist(armor) = armor / (armor + 100)`
   (armor 100 → 50%, 300 → 75%; asymptotic, never 100%).
4. **Skill damage** (forward-looking, M8): "% of a basic attack's **final** damage" reads
   `computeHitDamage`'s output, so gear/percent buffs flow through skills automatically.

---

## 1. Canonical `Stat` set + schema

| Stat                                                      | kinds         | default | clamp  |
| --------------------------------------------------------- | ------------- | ------- | ------ |
| `hp`                                                      | flat, percent | 0       | —      |
| `attack`                                                  | flat, percent | 0       | —      |
| `physicalDamage`                                          | flat, percent | 0       | —      |
| `damage`                                                  | flat (frac)   | 0       | —      |
| `armor`                                                   | flat, percent | 0       | —      |
| `attackSpeed`                                             | flat, percent | 1.0     | —      |
| `cooldownReduction`                                       | flat (frac)   | 0       | [0, 1] |
| `areaOfEffect`                                            | flat, percent | 0       | —      |
| `blockChance`                                             | flat (frac)   | 0       | [0, 1] |
| `dodgeChance`                                             | flat (frac)   | 0       | [0, 1] |
| `damageReduction`                                         | flat (frac)   | 0       | [0, 1] |
| `damageAbsorption`                                        | flat          | 0       | —      |
| `fireResist` `coldResist` `lightningResist` `chaosResist` | flat (frac)   | 0       | [0, 1] |
| `fireDamage` `coldDamage` `lightningDamage` `chaosDamage` | flat, percent | 0       | —      |

> **Why fractions are `flat`:** `computeStat`'s `percentage` kind is **multiplicative** on the
> base (`base × (1+v)`), which yields 0 for a base-0 stat. Additive fractions (resists, etc.)
> must **sum**, which is exactly what a `flat` modifier does (`base + Σflat`). The `percentage`
> kind is reserved for stats with a meaningful base (`hp/attack/armor/physicalDamage/
attackSpeed/areaOfEffect/element damage`).

---

## 2. Module layout

```
src/domain/
  stats/
    stat.ts            # NEW: Stat union, STATS, STAT_SCHEMA, defaultStat/clampStat/statAcceptsKind
    stat.test.ts       # NEW (replaces attribute.test.ts)
    modifier.ts        # CHANGE: Modifier.attribute: Stat
    character.ts       # CHANGE: Partial<Record<Stat,number>>; getStat applies default+clamp
  combat/              # NEW subsystem (depends on stats + rng; nothing inner imports it)
    derived.ts         # NEW: timeBetweenAttacks, effectiveCooldown, physicalResist, maxHP
    damage.ts          # NEW: computeHitDamage(finalStats, element)
    mitigation.ts      # NEW: ordered numeric pipeline (reduction → resist/armor → absorption → floor)
    combatant.ts       # NEW: Combatant contract + asCombatant(character) adapter
    resolve-attack.ts  # NEW: resolveAttack(attacker, defender, rng, element)
    index.ts           # NEW: public barrel
```

---

## Steps (TDD: failing test → minimal code → refactor)

- [x] **6.1** `stat.ts`: canonical `Stat` union + `STAT_SCHEMA` (data) + `STATS`,
      `defaultStat`, `clampStat`, `statAcceptsKind`. Migrate `Modifier`, `InstantEffectDef`,
      `ItemBase`, `Character`, and the stats `index.ts`. _Test (`stat.test.ts`):_ every stat
      has a default; chance/resist/cdr/reduction stats clamp to `[0, 1]`; `STATS` has no
      duplicates; fraction stats reject the `percentage` kind.
- [x] **6.2** Re-point data to canonical stats: `ITEM_BASES`, `SEED_ITEMS`, `BASE_STATS`
      (UI), and migrate every existing engine test's example stats (`AGI→attack`, `STR→armor`,
      `HP→hp`, `MP/INT→physicalDamage`). _Test:_ all existing equip/generate/scale tests pass
      against canonical stats; regenerate the `generateItem` snapshot.
- [x] **6.3** `derived.ts`: `timeBetweenAttacks(attackSpeed)=1000/attackSpeed`,
      `effectiveCooldown(baseMs, cdr)=baseMs×(1−cdr)`, `physicalResist(armor)=armor/(armor+100)`,
      `maxHP(getStat)=getStat("hp")`. _Test:_ attackSpeed 1.0 → 1000 ms; cdr 0.2 on 3000 ms →
      2400 ms; armor 100 → 0.5 resist.
- [x] **6.4** `damage.ts`: `computeHitDamage({ attack, flatDamage, damagePercent })` =
      `attack × flatDamage × (1 + damagePercent)` over **final** stat values, with an `element`
      selector mapping to the element's flat-damage stat. _Test:_ anchored numbers; `+attack`
      strictly increases output; `damage%` scales linearly.
- [x] **6.5** `mitigation.ts`: small pure layers — `applyDamageReduction`, `applyArmor`
      (physical), `applyResist` (element), `applyAbsorption`, `floorDamage` (min 1) — and a
      `mitigate(raw, element, defense)` composing them **in order**. _Test:_ each layer in
      isolation, full-order composition, and the min-1 floor.
- [x] **6.6** `combatant.ts` (`Combatant` contract + `asCombatant`) and `resolve-attack.ts`
      (`resolveAttack`): roll **dodge** then **block** (physical only) via injected `Rng`
      (avoided → 0 damage), else `computeHitDamage` → `mitigate` → `takeDamage`. _Test:_
      deterministic under seed; dodge/block zero the hit; a `+attack` weapon yields strictly
      more damage to a dummy (**headline**); reports `defeated`.
- [x] **6.7** UI (thin): a derived-stats panel + an "Attack Dummy" button with a small combat
      log and a "Reset Dummy" button. _Manual:_ equip a `+attack`/`+physicalDamage` weapon →
      hit harder; dodges/blocks appear in the log.

---

## 3. Architecture laws honored

- Domain purity: every new file under `src/domain/`, zero React/DOM/Vite.
- Inject randomness: `resolveAttack` takes an `Rng`; no `Math.random()` in domain.
- Compute, don't store: derived stats and damage are computed on read from `getStat`.
- Depend on contracts: combat depends on `Combatant`, not concrete `Character` (enemy plugs in — D-009).
- Mitigation = a pipeline of small layers (SRP/OCP): add a layer without editing the others.
- One-way deps: `combat` may import `stats`/`rng`; `stats`/`items` must not import `combat`.

---

## 4. Explicitly NOT in this milestone (deferred)

- **Crit** — the overview has no crit; the old M6 draft's crit is dropped, not deferred.
- **Advanced on-hit effects** (HP/sec regen, leech, "per hit/kill" effects from
  [material-effects.md](material-effects.md)) → **D-012**.
- **Enemy/monster system** — only a training dummy here (**D-009**, resolved in M9).
- **Skills / abilities** — basic physical attack only (**D-011**, M8).
- **Elemental basic attacks** — elements are skills/enemy-only later; `computeHitDamage`
  supports an `element` param but basic attacks are physical (the precise physical-vs-element
  `attack`-factor nuance is tuned when skills/enemies use elements).

---

## Definition of done

- [x] Canonical `Stat` set + `STAT_SCHEMA` replace the bootstrap attributes; `STR/AGI/INT/MP` deleted.
- [x] `computeStat` unchanged & generic; `getStat` applies per-stat default + clamp.
- [x] `computeHitDamage` and the `mitigate` pipeline implement the overview's damage + defense order.
- [x] `resolveAttack(attacker, defender, rng)` deterministically resolves one hit (dodge/block, mitigation, min-1 floor, lethal) through the `Combatant` contract.
- [x] Headline test proves a `+attack` weapon strictly increases damage dealt.
- [x] No `Math.random()` / wall-clock in any domain file; one-way deps intact; lint + build pass.
- [x] `D-012` appended to the deferred-decisions log; roadmap tracker + session log updated.
