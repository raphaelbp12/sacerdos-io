import { useState } from "react";
import {
  Badge,
  Button,
  Counter,
  EmptyState,
  Grid,
  Panel,
  Row,
  Screen,
  Tabs,
} from "../primitives";
import { ItemChip } from "../composites";
import { THRESHOLDS, SYNTHESIS_RATIO, sellValue } from "../../domain/cube";
import { useAction } from "../state";

/** The cube bench: synthesize same-rarity gear up a tier, or sell for gold (M17). */
export function CubeScreen() {
  const { session, act, error } = useAction();
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [thresholdIdx, setThresholdIdx] = useState(0);

  const equippables = session.inventoryItems.filter(
    (i) => i.kind === "equippable",
  );
  const selectedItems = session.inventoryItems.filter((i) =>
    selected.includes(i.id),
  );
  const sellTotal = selectedItems.reduce((sum, i) => sum + sellValue(i), 0);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSynthesize() {
    act(() => {
      const result = session.synthesize(
        selectedItems,
        THRESHOLDS[thresholdIdx],
      );
      if (!result.ok) throw new Error(`synthesis failed: ${result.reason}`);
    });
    setSelected([]);
  }

  function handleSell() {
    act(() => {
      for (const item of selectedItems) session.sell(item);
    });
    setSelected([]);
  }

  return (
    <Screen title="Cube">
      <Panel heading="Threshold (item level band)">
        <Tabs
          tabs={THRESHOLDS.map((t, i) => ({
            id: String(i),
            label: `${t.min}–${t.max}`,
          }))}
          active={String(thresholdIdx)}
          onSelect={(id) => setThresholdIdx(Number(id))}
        />
      </Panel>

      <Panel heading="Bench">
        <Row justify="between">
          <Counter icon="🧮" value={`${selected.length} selected`} />
          {error && <Badge tone="bad">{error}</Badge>}
        </Row>
        <Row>
          <Button
            variant="primary"
            disabled={selected.length !== SYNTHESIS_RATIO}
            title={`select ${SYNTHESIS_RATIO} same-rarity items`}
            onClick={handleSynthesize}
          >
            ⚗️ Synthesize ({SYNTHESIS_RATIO})
          </Button>
          <Button disabled={selected.length === 0} onClick={handleSell}>
            💰 Sell for {sellTotal}g
          </Button>
        </Row>
      </Panel>

      <Panel heading="Equippable items">
        {equippables.length === 0 ? (
          <EmptyState message="No equippable items to work with." />
        ) : (
          <Grid>
            {equippables.map((item) => (
              <ItemChip
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                onClick={() => toggle(item.id)}
              />
            ))}
          </Grid>
        )}
      </Panel>
    </Screen>
  );
}
