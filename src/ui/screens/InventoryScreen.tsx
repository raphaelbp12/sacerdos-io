import { Badge, Button, Panel, Row, Screen } from "../primitives";
import { EquipmentSlots, InventoryGrid, ItemChip } from "../composites";
import type { Item } from "../../domain/items";
import { useAction } from "../state";

/** Inventory + equipment: equip / unequip with the level-requirement hard block (M2, M5, M15). */
export function InventoryScreen() {
  const { session, act, error } = useAction();
  const heroId = session.characterIds[0];
  const hero = session.character(heroId);

  function renderItem(item: Item) {
    if (item.kind !== "equippable") {
      return <ItemChip key={item.id} item={item} />;
    }
    const tooHigh = hero.level < item.levelReq;
    return (
      <ItemChip
        key={item.id}
        item={item}
        disabled={tooHigh}
        title={
          tooHigh ? `requires level ${item.levelReq}` : `equip to ${item.slot}`
        }
        onClick={() => act(() => session.equip(heroId, item))}
      />
    );
  }

  return (
    <Screen title="Inventory">
      {error && (
        <Row>
          <Badge tone="bad">{error}</Badge>
        </Row>
      )}

      <Panel heading="Equipment">
        <EquipmentSlots
          equipment={hero.equipment}
          onUnequip={(slot) => act(() => session.unequip(heroId, slot))}
        />
      </Panel>

      <Panel heading="Inventory">
        <Row justify="end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => act(() => session.grantRandomItem(hero.level))}
          >
            + Generate item
          </Button>
        </Row>
        <InventoryGrid
          items={session.inventoryItems}
          capacity={session.inventoryCapacity}
          emptyMessage="No items — generate one or clear a stage."
          renderItem={renderItem}
        />
      </Panel>
    </Screen>
  );
}
