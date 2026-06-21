# Milestone 8 Plan — Skills as class-gated abilities

> **Goal:** turn the four Knight skill **nodes** (registered in M7's `KNIGHT_SKILL_NODES`) into
> real, resolvable abilities: data-defined cooldowns + per-rank values, a `Clock`-driven
> cooldown tracker, a charge-based tracker for "next N hits" buffs, and a resolver that reuses
> M6's `computeHitDamage`/`mitigate` and the existing `BuffTracker`. Resolves **D-011**.
>
> **Headline acceptance test:** under a fixed seed, `smash` rank 1 deals exactly `200%` of the
> mitigated damage a basic attack would deal to the same defender; ranks 2–5 scale 250/300/350/
> 400%.

---

## 0. Confirmed decisions (resolved with the user before coding)

1. **Provoke target.** "Reduces X% of the target's defense" debuffs the **generic
   `damageReduction`** stat (not `armor`, not the four resists). The debuff is a `BuffDef` with
   a **negative flat** `damageReduction` modifier (`-0.20 … -0.60` by rank). `damageReduction`
   is a `FLAT_ONLY` fraction clamped `[0,1]`, so the value is subtracted and floors at 0.
2. **Permanent / charge buffs.** Raise-shield ("next N hits, no duration") uses a **separate
   `ChargeTracker`** (SRP — not the timed `BuffTracker`). Provoke ("lasts forever") **reuses
   `BuffTracker`** with `duration: Infinity` (never decrements to `≤ 0`).
3. **Shatter area.** With no battlefield yet (M10), `resolve-skill` returns the **single-target**
   damage and the skill is tagged `kind: "areaDamage"`. Multi-target fan-out is deferred to M10.
4. **Module home.** New pure module `src/domain/skills/` sits **above** combat + character
   (imports from both; neither imports it) so `character/` stays combat-free and `combat/`
   stays skill-free. Dependency: `skills → combat → stats`, `skills → character → stats`,
   `skills → effects` (no cycle).
5. **Skill values per rank (overview):**
   - **smash** (band 1, `damage`): `[2.0, 2.5, 3.0, 3.5, 4.0]` × basic final damage. 3 s cd.
   - **shatter** (band 2, `areaDamage`): `[1.0, 1.25, 1.5, 1.75, 2.0]`. 3 s cd.
   - **raise-shield** (band 3, `buff`): charges `[3, 4, 5, 6, 7]`; sets `blockChance` → 100%
     (flat `+1`, clamped to 1) while charges remain. 3 s cd, no duration.
   - **provoke** (band 4, `debuff`): `damageReduction` `[-0.20, -0.30, -0.40, -0.50, -0.60]`.
     3 s cd, lasts forever.
6. **Skill ranges** stay coarse tags (`short` / `area` / `self` / `long`) — concrete distances
   are deferred (**D-015**, "tune live").

---

## 1. Skill resolution model

- **Skill damage = multiplier × `basicHitDamage(attacker, defender, element)`** — the
  **mitigated** (post-defense, pre-avoidance) basic hit. Skills **bypass block/dodge** so the
  ratio is deterministic; gear / passive `damage%` / `attack` flow through automatically because
  `basicHitDamage` reads `getStat`. Knight skills are `physical`.
- A shared `basicHitDamage` helper is **extracted from `resolveAttack`** (combat) and reused, so
  there is one damage path (DRY).
- **Cooldown** = `effectiveCooldown(def.cooldownMs, getStat("cooldownReduction"))` (M6 derived).
  Resolution and cooldown are kept **separate** (SRP): the battle engine (M10) will check
  `isReady` → resolve → `use`; M8 unit-tests each in isolation.

---

## 2. Steps (TDD order)

- [ ] **8.1 `skills/skill-def.ts`** — `SkillKind` (`damage|areaDamage|buff|debuff`), `SkillRange`
      tag, `SkillDef extends ChoiceNode` (`name`, `kind`, `cooldownMs`, `range`, `element`,
      `values[]`). `KNIGHT_SKILLS` merges combat data onto `KNIGHT_SKILL_NODES` (DRY — band /
      maxRank stay single-sourced in `character/`). _Test:_ every node has combat data;
      `values.length === maxRank`; the overview's per-rank numbers; cooldowns = 3000.
- [ ] **8.2 `skills/cooldown-tracker.ts`** — `CooldownTracker implements Clock`: `isReady(id)`,
      `use(id, baseMs, cdr)` (applies `effectiveCooldown`), `advance(ms)`, `remainingFor(id)`.
      _Test:_ ready → use → on-cooldown → ready after `advance`; cdr shortens the wait.
- [ ] **8.4 `skills/charge-tracker.ts`** — `ChargeTracker implements ModifierSource`:
      `apply(ChargeBuffDef)`, `consume()` (−1 charge to every active buff, prune at 0),
      `getModifiers()` (only while charges remain), `remainingCharges(id)`. _Test:_ raise-shield
      3 charges → `blockChance` clamps to 1; after 3 `consume()`s the modifier is gone.
- [ ] **8.3 `skills/resolve-skill.ts`** (+ combat `basicHitDamage`) — `resolveSkillDamage`
      (smash/shatter), `resolveDebuff` (provoke → `BuffTracker.apply`, `Infinity` duration),
      `resolveBuff` (raise-shield → `ChargeTracker.apply`). _Test:_ smash rank 1 = 2× basic;
      rank 5 = 4×; provoke lowers the defender's effective `damageReduction` and raises damage
      taken; raise-shield forces `blockChance` to 1 until charges drain.
- [ ] **barrel** `skills/index.ts`; full `npm run test` + `lint` + `build` green.

---

## 3. Architecture compliance

- **Domain purity:** `src/domain/skills/` has zero React/DOM/Vite imports.
- **Inject time:** cooldowns advance only via `Clock.advance(ms)`; no wall-clock reads.
- **Compute-don't-store:** buff/charge modifiers project on read through `getStat`; only the
  deliberately-stateful cooldown/charge counters are stored.
- **Data-not-code:** a new skill is a row in `KNIGHT_SKILLS` (+ a `kind` resolver), not a class.
- **One-way deps:** `skills` is a leaf above `combat`/`character`/`effects`; nothing inner
  imports it.

---

## 4. Deferrals logged when this milestone starts

| ID    | Title                                      | Note                                               |
| ----- | ------------------------------------------ | -------------------------------------------------- |
| D-014 | Enemy skill-casting (fireball / cold-bolt) | Monsters cast skills; M8 is player-skill only.     |
| D-015 | Concrete skill ranges ("tune live")        | Ranges stay coarse tags until M10 positions exist. |

Resolved by this milestone: **D-011** (skills as class-gated abilities).
