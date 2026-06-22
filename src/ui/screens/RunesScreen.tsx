import { Badge, Button, Panel, Row, Screen } from "../primitives";
import { GoldBar, RuneTreeView } from "../composites";
import { RUNE_TREE } from "../../domain/runes";
import { useAction } from "../state";

/** The rune tree: spend gold on account-wide stat/perk nodes (M18). */
export function RunesScreen() {
  const { session, act, error } = useAction();

  return (
    <Screen title="Runes">
      <Panel heading="Wallet">
        <Row justify="between">
          <GoldBar gold={session.gold} chests={session.pendingChests.length} />
          <Button size="sm" onClick={() => act(() => session.addGold(1000))}>
            +1000g (dev)
          </Button>
        </Row>
        {error && (
          <Row>
            <Badge tone="bad">{error}</Badge>
          </Row>
        )}
      </Panel>

      <RuneTreeView
        nodes={RUNE_TREE}
        gold={session.gold}
        levelOf={(id) => session.runeLevel(id)}
        onBuy={(id) => act(() => session.buyRune(id))}
      />
    </Screen>
  );
}
