import { Badge, Chip } from "../primitives";
import { rarityMultiplier, itemLevelOf } from "../../domain/items";
import type { Item } from "../../domain/items";
import { formatModifiers, rarityKey } from "./format";

/** One item rendered as a compact, optionally-clickable chip. */
export function ItemChip({
  item,
  onClick,
  selected,
  disabled,
  title,
}: {
  item: Item;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const meta =
    item.kind === "equippable"
      ? `${item.slot} · iLvl ${itemLevelOf(item)} · req ${item.levelReq}`
      : item.kind === "consumable"
        ? "consumable"
        : "misc";
  return (
    <Chip
      rarity={rarityKey(item.rarity)}
      selected={selected}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <span className="chip-name">{item.name}</span>
      <Badge tone={`rarity-${rarityKey(item.rarity)}`}>
        {item.rarity} ×{rarityMultiplier(item.rarity)}
      </Badge>
      <span className="chip-meta">{meta}</span>
      {item.modifiers.length > 0 && (
        <span className="chip-mods">{formatModifiers(item)}</span>
      )}
    </Chip>
  );
}
