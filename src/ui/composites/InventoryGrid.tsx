import type { ReactNode } from "react";
import { Counter, EmptyState, Grid, Row } from "../primitives";
import type { Item } from "../../domain/items";

/** A capacity-aware grid of items; the caller renders each item (usually an `ItemChip`). */
export function InventoryGrid({
  items,
  capacity,
  emptyMessage = "Empty",
  renderItem,
}: {
  items: readonly Item[];
  capacity?: number;
  emptyMessage?: string;
  renderItem: (item: Item) => ReactNode;
}) {
  return (
    <>
      <Row justify="between">
        <Counter
          icon="🎒"
          label="slots used"
          value={
            capacity === undefined
              ? items.length
              : `${items.length} / ${capacity}`
          }
        />
      </Row>
      {items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <Grid>{items.map((item) => renderItem(item))}</Grid>
      )}
    </>
  );
}
