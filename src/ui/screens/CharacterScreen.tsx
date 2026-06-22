import { Badge, Counter, Panel, Row, Screen } from "../primitives";
import { BuildAllocator, StatList } from "../composites";
import type { AllocNode } from "../composites";
import { KNIGHT_PASSIVES, KNIGHT_SKILL_NODES } from "../../domain/character";
import { useAction } from "../state";

const NODES: readonly AllocNode[] = [...KNIGHT_PASSIVES, ...KNIGHT_SKILL_NODES];

/** Character sheet: computed stats + the refundable skill-point allocator (M1, M6, M7). */
export function CharacterScreen() {
  const { session, act, error } = useAction();
  const heroId = session.characterIds[0];
  const hero = session.character(heroId);
  const stats = session.statsOf(heroId);
  const points = session.availablePoints(heroId);

  return (
    <Screen title="Character">
      <Panel heading={`${hero.name} · ${hero.classId} · level ${hero.level}`}>
        <StatList stats={stats} />
      </Panel>

      <Panel heading="Build">
        <Row justify="between">
          <Counter icon="✨" value={points} label="skill points" />
          {error && <Badge tone="bad">{error}</Badge>}
        </Row>
        <BuildAllocator
          nodes={NODES}
          ranks={hero.build}
          level={hero.level}
          availablePoints={points}
          onAllocate={(id) => act(() => session.allocate(heroId, id))}
          onRefund={(id) => act(() => session.refund(heroId, id))}
        />
      </Panel>
    </Screen>
  );
}
