import { Row, Stack } from "../primitives";
import { EQUIPMENT_SLOTS } from "../../domain/items";
import type { EquipmentSlot, Item } from "../../domain/items";
import { ItemChip } from "./ItemChip";

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: "⚔️ Weapon",
  helm: "🪖 Helm",
  body: "🛡️ Body",
  gloves: "🧤 Gloves",
  boots: "👢 Boots",
  ring: "💍 Ring",
  amulet: "📿 Amulet",
};

/** The seven equipment slots; click an equipped item to unequip it. */
export function EquipmentSlots({
  equipment,
  onUnequip,
}: {
  equipment: Readonly<Partial<Record<EquipmentSlot, Item>>>;
  onUnequip: (slot: EquipmentSlot) => void;
}) {
  return (
    <Stack>
      {EQUIPMENT_SLOTS.map((slot) => {
        const item = equipment[slot];
        return (
          <Row key={slot}>
            <span className="slot-label">{SLOT_LABEL[slot]}</span>
            {item ? (
              <ItemChip
                item={item}
                title="Click to unequip"
                onClick={() => onUnequip(slot)}
              />
            ) : (
              <span className="slot-empty">—</span>
            )}
          </Row>
        );
      })}
    </Stack>
  );
}
