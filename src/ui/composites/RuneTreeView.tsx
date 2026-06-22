import { Badge, Button, Panel, Row, Stack } from "../primitives";
import { runeCostAt } from "../../domain/runes";
import type { RuneNode } from "../../domain/runes";

/** Describe a node's effect briefly (stat buff vs account perk). */
function effectLabel(node: RuneNode): string {
  return node.effect.kind === "stat"
    ? `+${node.effect.perLevel} ${node.effect.stat}/lvl`
    : `+${node.effect.perLevel} ${node.effect.perk}/lvl`;
}

/** The rune tree grouped by branch; buy levels with gold (cost scales by depth + level). */
export function RuneTreeView({
  nodes,
  levelOf,
  gold,
  onBuy,
}: {
  nodes: readonly RuneNode[];
  levelOf: (id: string) => number;
  gold: number;
  onBuy: (id: string) => void;
}) {
  const branches = [...new Set(nodes.map((n) => n.branch))].sort(
    (a, b) => a - b,
  );
  return (
    <Stack>
      {branches.map((branch) => (
        <Panel
          key={branch}
          heading={branch === 0 ? "Root" : `Branch ${branch}`}
        >
          {nodes
            .filter((n) => n.branch === branch)
            .map((node) => {
              const level = levelOf(node.id);
              const maxed = level >= node.maxLevel;
              const cost = maxed ? null : runeCostAt(node, level);
              const tooPoor = cost !== null && gold < cost;
              return (
                <Row key={node.id} justify="between">
                  <span className="alloc-label">
                    <span className="chip-name">{node.label}</span>
                    <span className="chip-meta">
                      {effectLabel(node)} · lvl {level}/{node.maxLevel}
                    </span>
                  </span>
                  {maxed ? (
                    <Badge tone="good">maxed</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={tooPoor}
                      title={tooPoor ? "not enough gold" : undefined}
                      onClick={() => onBuy(node.id)}
                    >
                      Buy · {cost}g
                    </Button>
                  )}
                </Row>
              );
            })}
        </Panel>
      ))}
    </Stack>
  );
}
