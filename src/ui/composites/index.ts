/** Public surface for the domain composites (read domain, render primitives). */

export { ItemChip } from "./ItemChip";
export { StatList } from "./StatList";
export { EquipmentSlots } from "./EquipmentSlots";
export { InventoryGrid } from "./InventoryGrid";
export { BuildAllocator } from "./BuildAllocator";
export type { AllocNode } from "./BuildAllocator";
export { RuneTreeView } from "./RuneTreeView";
export { GoldBar } from "./GoldBar";
export { UnitCard } from "./UnitCard";
export { BattleStrip } from "./BattleStrip";
export type { Floater } from "./BattleStrip";
export { ingestBattleEvents } from "./combat-feed";
export type { IngestResult } from "./combat-feed";
export { formatModifier, formatModifiers, rarityKey } from "./format";
