// Public surface for the character module (class, levels, passives, builds).

export type { ClassDef } from "./class-def";
export { KNIGHT, CLASSES } from "./class-def";

export { baseStatsForLevel } from "./level";

export type { Band, ChoiceNode } from "./choice-node";
export { bandUnlockLevel, unlockedBand } from "./choice-node";

export type { PassiveDef } from "./passive-def";
export { KNIGHT_PASSIVES, PassiveAllocation } from "./passive-def";

export { KNIGHT_SKILL_NODES } from "./skill-node";

export { Build } from "./skill-points";

export { createCharacter } from "./create-character";
