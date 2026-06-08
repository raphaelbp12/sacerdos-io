# groups

each group will have few characters
groups might have buffs that might come from the runes tree

we should start with only 1 group, created by default, and 1 character created by default already inside this group

## acquiring characters and groups

- new characters and groups are acquired later, not created freely.
- there is "one inventory for characters" and "one inventory for groups" (the collections the
  player owns).
- a dedicated, scarcer currency is spent to buy characters and groups (see Economy).

[PLACEHOLDER: how characters/groups are acquired (shop? drop? gacha?) and their cost]
[PLACEHOLDER: capacity of the character inventory and the group inventory]

# character

each character will have a class - let's start with one single class

a level up means that the character will progress in stats (player cannot choose) and will receive a skill point

## stats

hp - flat and percentage
cooldown reduction %
attack
physical damage - flat and percentage
damage %
armor - flat and percentage
attack speed
area of effect
block chance
dodge chance
elemental resist - fire/cold/lightning/chaos
damage reduction %
damage absorption

> Canonical stats live in this list. The early dev attributes (`STR`, `AGI`, `INT`, `MP`)
> were only used to bootstrap the systems and are now **parked**; `MP` does not exist. `HP`
> is the only one of those that carries into the real stat list above.

### damage formula

finalDamage =
attack

- (1 + attackPercentage)
- (physicalDamage \* (1 + physicalDamageIncreasePercentage))
- (1 + damagePercentage)

[PLACEHOLDER: how elemental damage adds into finalDamage (enemy-side for now)]
[PLACEHOLDER: how `attack speed` and `cooldown reduction %` turn into DPS / skill rate]
[PLACEHOLDER: how `area of effect` scales (radius? number of targets?)]

### defense / damage-taken order

applied in this order to each incoming hit:

1. block chance / dodge chance — same mechanism: a chance to avoid the hit entirely
   (0 damage). only applies to physical damage.
2. damage reduction % — first mitigation layer (percentage off the remaining damage).
3. armor — reduces the damage received. [PLACEHOLDER: exact armor → reduction formula]
4. damage absorption — last layer, subtracts a flat value.

if the hit is not blocked or dodged, the damage actually received is **at minimum 1** after
all the calculations above.

[PLACEHOLDER: where elemental resist (fire/cold/lightning/chaos) sits in this order]

## classes

each class will have a different path for the stats progress, it should be defined per class.
for now, keep the knight's per-level progression simple: increase hp, attack and armor.

[PLACEHOLDER: knight per-level stat table — how much hp / attack / armor gained per level]

let's start with knight class
classes will have different choices per level
let's call those choices as passive and skills

lvl 1~10 -> 2 passives, 1 skill
lvl 11~20 -> 2 passives, 1 skill
lvl 21~30 -> 2 passives, 1 skill
lvl 31~40 -> 2 passives, 1 skill

## level point choices

- a level-up grants 1 skill point.
- each passive or skill costs 1 skill point per level put into it.
- the player chooses how to spend points — this is the build. points can be **refunded at any
  time** and re-spent.
- each band (1~10, 11~20, 21~30, 31~40) unlocks 2 passives and 1 skill. once unlocked by the
  character's level, the player can start leveling them up.
- skills max out at level 5 (the 5 listed values); each level costs 1 skill point.
- passives keep their per-level caps (see below); each level costs 1 skill point.

[PLACEHOLDER: skill-point economy check — total points earned by lvl 40 vs. points needed to
max a full build (is the scarcity intentional?)]

## passives

increase attack - +2 per level - max 10
increase damage % multiplier - 3% per level - max 10
increase hp - +15 per level - max 10
increase attack speed % - 2% per level - max 10
increase block chance - 3% per level - max 10
increase elemental resistance % - 10% per level - max 5
increase armor - +15 per level - max 10

## skills

skill damage is a multiplier of the **final damage of a basic attack** (see the damage
formula above) — e.g. smash rank 1 deals 200% of a normal hit.

(knight) smash - deal (200%/250%/300%/350%/400%) of a basic attack's final damage. melee, short range.
(knight) slash - deal (100%/125%/150%/175%/200%) of a basic attack's final damage, in an area.
(knight) raise shield - set block chance to 100% for the next (3/4/5/6/7) physical hits.
(knight) provoke - apply a debuff that reduces (20%/30%/40%/50%/60%) of the target's defense. long range.

buffs and debuffs share one mechanism — the only difference is which stat is modified and by
how much (positive = buff, negative = debuff).

[PLACEHOLDER: base cooldown for each skill (smash / slash / raise shield / provoke)]
[PLACEHOLDER: raise shield duration — hit-count only, or also a timer?]
[PLACEHOLDER: provoke debuff duration]
[PLACEHOLDER: attack range values per skill (exact numbers for melee vs. long range)]

# Runes

the player will spend gold to buy account buffs/progress

exp gain - flat and percentage
gold gain - flat and percentage
inventory increased capacity
more stash tabs
stats buffs - hp, attack, attack speed, cooldown reduction

the runes are organized as a **tree** (nodes with prerequisites), not a flat shop.

[PLACEHOLDER: rune tree structure — nodes, prerequisites, costs, and caps]

## economy

- gold scales with stage. a normal monster, a stage boss, and an act boss each give a
  different amount of gold, and the rune system can modify each of those sources separately.
- gold is the main currency.
- a second, scarcer currency exists later, used for bigger progress like buying characters
  and groups.
- nothing hard-caps farming; what discourages grinding a low stage is **time** — advancing to
  harder stages earns more gold per minute.

[PLACEHOLDER: gold amounts / scaling per stage and per source (monster / stage boss / act boss)]
[PLACEHOLDER: name + source of the second currency, and what it buys]
[PLACEHOLDER: gold sinks list and prices (runes, inventory/stash expansion, revive cost)]

# Inventory and stash

they almost the same thing.
the player will have only 1 inventory
the stash can have many tabs, starts with only 1 tab, and the expansion can be bought by gold, from the runes
the inventory will grow with gold as well, from the runes

the idea to have inventory and stash is to create a limitation.
items go to the inventory, if it gets full, the player cannot receive more items
items can be moved from inventory to stash freely, only limited by the capacity size of them

implementation wise, maybe we can reuse the inventory class for stash, inventory and character's equipment list - the difference is that the equip list only accepts 1 item per slot type

stacking: misc items can stack in a single slot; item modifiers cannot stack (each consumes
its own slot); boss keys cannot stack either (one slot each).

# Cube system

we need a system to manage/recycle/sell items

recycle - combine items of the same rarity into one of the next rarity. start with a
**3-to-1** ratio (3 same-rarity items → 1 of the higher tier); this may change later, and
the player might buy a perk from the rune tree to improve it. the output item is a **fresh
roll** — its stats are rolled anew, not inherited from the inputs. equips combine into
equips, misc into misc, modifiers into modifiers — the item type limits what can be combined.
selling - sell items for gold. [PLACEHOLDER: sell value per rarity / item level]
crafting - combine misc items into equipments. **deferred for now.**

the cube system also has levels - each level will unlock a different item tier. the cube gains
exp through **usage**, and that exp gain can be modified/buffed by the rune system.

[PLACEHOLDER: cube exp curve — usage needed per cube level, and the rune buff to it]

tiers are the item level thresholds
1~10
10~15
15~30
30~40
50~60

[PLACEHOLDER: fix the tier thresholds — current ranges overlap (10, 15) and leave a gap (40~50)]

let's say the player selects the threshold 1~10, if they try to salvage/recycle an item lvl 15 it will block. because the item is higher than the threshold.
also, the item cannot be lower than the threshold.

# item modifiers

we need a better name for it - decorating/engraving
item modifier is an item type that will be used to add stats to equipments.
we need 3 different types of it

type 1 - decorating
type 2 - engraving
type 3 - something else [PLACEHOLDER: name + purpose of the third modifier type]

[PLACEHOLDER: what each modifier type actually grants (which stats), and how modifiers are
inserted into / removed from an equip's slots]

each equip can have item modifier slots, the amount and the types will be determined by the item rarity

common - no slots
uncommon - no slots
rare - 1 slot type 1
legendary - 2 slots type 1
immortal - 2 slots type 1 - 1 slot type 2
mythical - 2 slots type 1 - 2 slots type 2 - 1 slot type 3

# gameplay loop

user presses play - it starts to run the battle in the first stage
the group will face waves of monsters
after defeating all the waves in the stage, it faces the stage boss

each act is divided in 9 stages, after those 9 stages, the player can battle the act boss.
to enter the act boss battle, the user needs a **boss key** item. the key is consumed only if
the player drops something after the boss fight — if nothing drops, the key is kept. boss keys
cannot be stacked: each occupies one inventory/stash slot and counts against the inventory cap.

every time a monster is defeated, it has the chance to drop a common chest.
every time a stage boss is defeated, it has the chance to drop a rare chest
every time an act boss is defeated, it has a high chance to drop a legendary chest.

every time a monster is defeated, it gives gold and experience

experience is divided evenly between the **living** characters in the group — a character that
is dead when the kill happens earns no XP. there is no penalty for group size (kept simple for
now).

if the player selects a stage that is not the latest unlocked, the group will run this stage over and over, until the player changes the stage.

if the player selects the latest stage:

- if the stage gets cleared, the group advances to the next stage
- if the group dies, it will go down one stage (never below the first stage — no penalty there)
- if the "retry" option is enabled, the group will retry the stage it fails

# stages and act

each stage will have a certain amount of waves and a certain amount of monsters that will be divided in those waves.
it means that every time the players run a specific stage, they will receive the same amount of exp and gold, because the stage will always have the same amount of monsters.

each stage has its own item/monster level — this drives the monster stats and the item level
of the loot it drops.

the stage will change the monsters stats, the amount of monsters, the amount of waves
the stage boss will be a normal monster, but with higher stats

each act will have 9 stages + act boss stage
let's start with 2 acts
let's start with 2 difficulties - normal and hard.

all difficulties are always visible; ones the player hasn't unlocked appear **locked**. hard
unlocks after the last act boss is defeated on normal. for now, the only loot difference
between difficulties is the **item level** (higher on harder difficulties) — there is no loot
rarity difference yet (that can be added per difficulty later).

after the player defeats the 20 stages of act 1, it will unlock the act 2

the acts will look almost the same, the difference will be the monsters. the difficulty should increase slightly between acts.

act 1 - only physical damage
act 2 - physical + fire damage

the difference between the difficulties is the stages/act modifiers, making it harder. maybe also unlocking more elements.

the act 2 of hard can have physical, fire and cold damages.

elemental damage is, for now, an **enemy-only** feature — enemies deal fire/cold/etc. and
players resist it. later, other classes will inflict elemental damage through skills, which
also means enemies will be able to cast skills (e.g. fireball, cold bolt).

playing the act 1 will have the chance to drop the boss key for the act 1
playing the act 2 will have the chance to drop the boss key for the act 2
and so on

# chest

the player has a limited amount of chests that they can accumulate.
this number can be increased by gold in the runes tree
chests can only be opened if there is space in the inventory
one chest, one item
the chest rarity will modify the drop chances of items, will modify the rarity that can be dropped

if both the inventory and the stash are full, dropped loot is **lost** — this pushes the
player to come back and check the game periodically.

[PLACEHOLDER: drop table — per chest rarity, the item rarities it can roll and their chances;
ties into the stage's item level]

# battle

it is an auto battler game
it is a linear, with one dimension, it runs laterally
the group will have a linear formation, the player chooses which is the character order
the monsters don't collied between them, and the characters don't collide between them, but a monster cannot pass through a character. it doesn't need to have a complex collision system, since the game has only 1 dimension, we can the limits.
the characters moves to the left, the monsters spawn outside the view, and they move to the right.
to check the collision, we just need to get the character that is farest to the left, this will be the limit for the monsters. and the limit for a character will be or the "stage limit", or the farest monster to the right.

the skills will be used automatically, every time it the cooldown ends, the skill can be used. then we need to check the range, or other other conditions.

for instance, the provoke skill can have a long range, since it is a debuff. but the smash is a melee skill, it has a short range.

the target is a front-to-back

there is no time limit, or the group dies completely, or it clears the stage.

the positioning/formation will be set initially by the player, but the characters move...

let's say you put the melee as the last one, and a range as the first one... the ranger will move until it reaches the range it needs to attack... then the knight will also move until it reaches the range it needs to attack. probably, the knight will pass through the ranger, and the formation will change.

## death and revive

- at the start of each stage, all characters are revived.
- within a stage, a defeated character has a **respawn timer** before it returns to the fight;
  the respawn time can be reduced through the runes system.
- a paid instant revive may also be offered: it could cost gold, and that cost could increase
  with the stage difficulty.

[PLACEHOLDER: base respawn time, the rune improvement to it, and the instant-revive gold cost formula]

# idle / offline progress

this is an idle game: with the app closed, the group keeps progressing (clearing the current
stage and earning rewards) for a **limited** amount of time. the player can extend this
offline window through the runes system.

[PLACEHOLDER: base offline duration, how runes extend it, and how offline rewards are computed/granted on return]

# pacing and meta

- target stage clear time: 2–5 minutes. a well-optimized build clears in ~2 min, an average
  build ~5 min, and a weak build ~10 min — build quality is the main lever on clear speed.
- prestige system: deferred, to be implemented later.

[PLACEHOLDER: prestige system design — what resets, what carries over, and what it grants]
