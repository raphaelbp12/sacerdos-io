# groups

each group will have few characters
groups might have buffs that might come from the runes tree

we should start with only 1 group, created by default, and 1 character created by default already inside this group

## acquiring characters and groups

- new characters and groups are acquired later, not created freely.
- there is "one inventory for characters" and "one inventory for groups" (the collections the
  player owns).
- a dedicated, scarcer currency is spent to buy characters and groups (see Economy).

groups and characters will be acquired from a shop, using a specific currency, but we will implement it later, no need to care about them now.

let's say the player will be able to have 3 chars by default, being able to buy expansion

and they will have 1 group by default, being able to buy expansion

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

element damage will only be applied with skills, basic attack inflicts physical damage only for now.

finalElementDamage =

- (1 + attackPercentage)
- (elementDamage \* (1 + elementDamageIncreasePercentage))
- (1 + damagePercentage)

I think all the damages can be calculated with the same formula, it can receive which element it should use to calculate: physical/fire/cold/lightning/chaos

attack speed: the char default is 1 attack per second, the modifiers will change it. let's say 1.1 attack per second will demand us to calculate the time between attacks later

cooldown reduction: each skill will have a specific cooldown in milliseconds, the cooldown reduction percentage will reduce it

area of effect: each skill will use it differently, but it might be mostly the radius.

the range can be a different stats, modified directly

### defense / damage-taken order

applied in this order to each incoming hit:

1. block chance / dodge chance — same mechanism: a chance to avoid the hit entirely
   (0 damage). only applies to physical damage.
2. damage reduction % — first mitigation layer (percentage off the remaining damage).
3. armor — reduces the damage received. let's create a simple formula for now
4. damage absorption — last layer, subtracts a flat value.

if the hit is not blocked or dodged, the damage actually received is **at minimum 1** after
all the calculations above.

elemental resist: the armor will reduce only the physical damage, it can be viewed as an elemental resist. the other elements will have individual resistances as attributes.

then, we need to use the armor to calculate the "physical resist", then we use it as an elemental resistance

## classes

each class will have a different path for the stats progress, it should be defined per class.
for now, keep the knight's per-level progression simple: increase hp, attack and armor.

let's start with knight class
classes will have different choices per level
let's call those choices as passive and skills

lvl 1~10 -> 2 passives, 1 skill
lvl 11~20 -> 2 passives, 1 skill
lvl 21~30 -> 2 passives, 1 skill
lvl 31~40 -> 2 passives, 1 skill

### knight per-level stat table

lvl 1 - 100 hp, 10 attack, 10 armor

+10 hp, +1 attack +3 armor per level

## level point choices

- a level-up grants 1 skill point.
- each passive or skill costs 1 skill point per level put into it.
- the player chooses how to spend points — this is the build. points can be **refunded at any
  time** and re-spent.
- each band (1~10, 11~20, 21~30, 31~40) unlocks 2 passives and 1 skill. once unlocked by the
  character's level, the player can start leveling them up.
- skills max out at level 5 (the 5 listed values); each level costs 1 skill point.
- passives keep their per-level caps (see below); each level costs 1 skill point.

skill-point scarcity intentional is intentional, we want the player to think carefully where to spend the points. also gives a flexibility, making it harder to find the most optimized way

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

(knight) smash - deal (200%/250%/300%/350%/400%) of a basic attack's final damage. melee, short range. - 3s cooldown
(knight) shatter - deal (100%/125%/150%/175%/200%) of a basic attack's final damage, in an area. - 3s cooldown
(knight) raise shield - set block chance to 100% for the next (3/4/5/6/7) physical hits. - 3s cooldown - no duration limit
(knight) provoke - apply a debuff that reduces (20%/30%/40%/50%/60%) of the target's defense. long range. - debuff lasts forever - 3s cooldown

buffs and debuffs share one mechanism — the only difference is which stat is modified and by
how much (positive = buff, negative = debuff).

I cannot define the range for each skill yet, we will need to test it live.

# Runes

the player will spend gold to buy account buffs/progress

exp gain - flat and percentage
gold gain - flat and percentage
inventory increased capacity
more stash tabs
stats buffs - hp, attack, attack speed, cooldown reduction

the runes are organized as a **tree** (nodes with prerequisites), not a flat shop.

rune structure: it starts with one node, after taking it, it branches to 2 sides.

then, each side branches to 3 sides. at the end, there are 3 sides.

1: increase stats globally like: max hp, attack damage, attack speed
2: increase exp received: exp percentage, flat exp per monster, per boss
3: enhave drop chances, increase chest capacity
4: increase gold received: gold percentage, flat gold per monster, per boss
5: enhance inventory: increase amount of inventory slots, increase amount of stashes
6: implement quality of life: increase skill slots, increase hero slots, increase group slots

there are no pre-requisites, they only cost gold

each node has a max level. it will need to be balanced, we don't know yet, each level will have different costs. a new step into the branch, higher is the cost, unlocking one node, it will show the adjacent nodes.

## economy

- gold scales with stage. a normal monster, a stage boss, and an act boss each give a
  different amount of gold, and the rune system can modify each of those sources separately.
- gold is the main currency.
- a second, scarcer currency exists later, used for bigger progress like buying characters
  and groups.
- nothing hard-caps farming; what discourages grinding a low stage is **time** — advancing to
  harder stages earns more gold per minute.

at the endgame, with all the buffs, deafeating a normal weak monster will give 1k gold, a normal strong monster will give 2k gold
at the beginning of the game, at the first stage of the first act, a normal monster will give 1 gold and the boss will give 10x that.

we don't have the second currency defined yet, we can ignore it for now

for now, the only gold sink is the runes tree

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
selling - sell items for gold
crafting - combine misc items into equipments. **deferred for now.**

the cube system also has levels - each level will unlock a different item tier. the cube gains
exp through **usage**, and that exp gain can be modified/buffed by the rune system.

tiers are the item level thresholds
1~10
10~15
15~30
30~40
50~60

let's say the player selects the threshold 1~10, if they try to salvage/recycle an item lvl 15 it will block. because the item is higher than the threshold.
also, the item cannot be lower than the threshold.

check the `cube.md` file for specifications when we implement the cube.

# selling items

lvl 1 common - 10 gold
lvl 1 uncommon - 20 gold
lvl 1 rare - 90
lvl 1 legendary - 270
lvl 1 immortal - 810

lvl 10 common - 250
lvl 10 uncommon - 750 gold
lvl 10 rare - 2250
lvl 10 legendary - 6750
lvl 10 immortal - 20250

lvl 15 common - 880
lvl 15 uncommon - 2640 gold
lvl 15 rare - 7920
lvl 15 legendary - 23760
lvl 15 immortal - 71280
lvl 15 arcana - 228096

# item modifiers

we need a better name for it - decorating/engraving
item modifier is an item type that will be used to add stats to equipments.
we need 3 different types of it

type 1 - decorating
type 2 - engraving
type 3 - be creative with the name - the third slot is a generic one - only super rare items will contain it

decorating, engravings and the third can give the same types of stats, the difference will the amount of slots in which rarity

those slots will receive/remove stats with the cube, the cube will consume the item modifier item to apply it. like a gem bem inserted into an equipment. each item modifier will have different stats and values depending on the equipment type.

check the items in the `material-effects.md` file.

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

let's create a function to roll the chests for now... the first drop should be 100%, a weapon for the specific class the player is using.

the first chest:
dropped in 1-1, 1-2 and 1-3 with 16% of chances - grade odds: 78% common, 20.6% uncommon, 1.37% rare - best weighted rewards: 31% armor (helmet, body armor, gloves or boots), 25% weapon (any class)

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

the base respawn time is 2min - the runes can reduce this time with flat seconds and percentage

the gold cost needs a formula, we can start with a placeholder, we balance it later

# idle / offline progress

this is an idle game: with the app closed, the group keeps progressing (clearing the current
stage and earning rewards) for a **limited** amount of time. the player can extend this
offline window through the runes system.

the base offline duration is 8h, and it can be increased by runes like +1h and percentage increase

the offline rewards are gold and experience. it will be calculated by the latest time the selected stage was cleared.

# pacing and meta

- target stage clear time: 2–5 minutes. a well-optimized build clears in ~2 min, an average
  build ~5 min, and a weak build ~10 min — build quality is the main lever on clear speed.
- prestige system: deferred, to be implemented later.

[PLACEHOLDER: prestige system design — what resets, what carries over, and what it grants]
