# Cube

> The Cube is TaskBarHero's all-in-one crafting station. Level it up to unlock eight operations that transform, upgrade and enchant your gear.

## Operations

| Operation | Unlock | Description |
|---|---|---|
| Synthesis | Default | Synthesize 9 items of the same grade |
| Alchemy | Cube Lv1 | Convert any item into gold. |
| Crafting | Cube Lv5 | Craft specific item types. |
| Decoration | Cube Lv8 | Grants special stats to equipment. |
| Engraving | Cube Lv15 | Grants special stats to equipment. |
| Inscription | Cube Lv25 | Grants special stats to equipment. |
| Extraction | Cube Lv10 | Removes stats applied to equipment. ※ Materials used to grant stats will not be returned. |
| Offering | Cube Lv20 | Offer commemorative coins to |

## Unlock progression

Each operation unlocks at a cube level, for a one-time gold cost.

| Cube level | Operation | Cost |
|---|---|---|
| Default | Synthesis | — |
| Cube Lv1 | Alchemy | 10g |
| Cube Lv5 | Crafting | 100g |
| Cube Lv8 | Decoration | 300g |
| Cube Lv10 | Extraction | 1,000g |
| Cube Lv15 | Engraving | 1,000g |
| Cube Lv20 | Offering | 3,000g |
| Cube Lv25 | Inscription | 10,000g |

## Cube leveling

Using the Cube grants Cube EXP. Higher cube levels unlock more operations and recipe tiers. The max level is 100.

Cube EXP comes from every item the Cube consumes — not just Alchemy. Synthesis, Crafting and Offering grant the same Cube EXP per item as melting it; only the reward differs (Alchemy returns gold, the others return their result). Decoration, Engraving, Inscription and Extraction grant none. The max cube level is 100.

### How Cube EXP is calculated

Each item the Cube consumes is worth a base amount set by four factors, then scaled by how close the item's level is to the cube's, and finally boosted by any Cube EXP % bonus. The result is rounded down.

```
EXP = ⌊ grade × item lv × gear type × item type ⌋ × level match × (1 + Cube EXP %)
```

### The four base factors

**Grade — base EXP**

| Grade | Cube EXP |
|---|---|
| Common | 2 |
| Uncommon | 6 |
| Rare | 18 |
| Legendary | 54 |
| Immortal | 162 |
| Arcana | 518 |
| Beyond | 1,658 |
| Celestial | 5,803 |
| Divine | 20,311 |
| Cosmic | 71,089 |

**Item level**

Higher-level gear is worth far more — but only if its level is close to the cube's (see Level matching below).

| Item Lv | Factor |
|---|---|
| 1 | ×1 |
| 5 | ×10 |
| 10 | ×40 |
| 15 | ×120 |
| 20 | ×240 |
| 25 | ×408 |
| 30 | ×612 |
| 35 | ×816 |
| 40 | ×1,020 |
| 45 | ×1,224 |
| 50 | ×1,428 |
| 55 | ×1,632 |
| 60 | ×1,836 |
| 65 | ×2,040 |
| 70 | ×2,244 |
| 75 | ×2,448 |
| 80 | ×2,652 |
| 85 | ×2,856 |
| 90 | ×3,060 |

**Gear type**

Off-hands and accessories are worth more than weapons and armor pieces.

| Gear type | Factor |
|---|---|
| Amulet | ×4 |
| Earing | ×3 |
| Ring | ×3 |
| Bracer | ×3 |
| Arrow | ×2 |
| Orb | ×2 |
| Shield | ×2 |
| Bolt | ×2 |
| Hatchet | ×2 |
| Tome | ×2 |
| Sword | ×1 |
| Axe | ×1 |
| Bow | ×1 |
| Crossbow | ×1 |
| Scepter | ×1 |
| Staff | ×1 |
| Armor | ×1 |
| Helmet | ×0.8 |
| Gloves | ×0.75 |
| Boots | ×0.7 |

**Item type**

Materials are worth far more than gear, level for level.

| Item type | Factor |
|---|---|
| Material | ×12 |
| Gear | ×1 |

### Good to know

- There is no level requirement: you can always melt gear and gain some EXP — it is never exactly zero, just smaller for big level gaps.
- Level 100 gear loses its item-level factor entirely (there is no level-100 entry in the data), so it grants very little Cube EXP — don't farm it for leveling.
- Rune and pet Cube EXP % bonuses multiply all the Cube EXP you gain.
- Alchemy gold uses the same grade, level and type factors as EXP, but without the level matching — so gear sells for its full gold value at any level.

### EXP to reach each cube level

| Cube level | Total EXP |
|---|---|
| 1 | 0 |
| 5 | 405 |
| 8 | 2,255 |
| 10 | 4,955 |
| 15 | 26,805 |
| 20 | 106,055 |
| 25 | 306,305 |
| 50 | 8,832,555 |
| 75 | 61,983,805 |
| 100 | 234,760,055 |

Each operation grants Cube EXP based on the grade of the items involved — higher-grade items give far more EXP. The amount also depends on item level versus the cube level: items at or just above the cube level give the most EXP, while items far from it give almost none.
