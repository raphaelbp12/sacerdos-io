import { Badge, Button, Row, Stack } from "../primitives";
import { bandUnlockLevel, unlockedBand } from "../../domain/character";
import type { Band, ChoiceNode } from "../../domain/character";

/** A spendable node with an optional human label (passives carry one; skills don't). */
export type AllocNode = ChoiceNode & { readonly label?: string };

/**
 * Spend / refund skill points across passive + skill nodes. Enforces (in the UI)
 * the same gates the domain `Build` enforces: band-lock, per-node cap, and the
 * point budget — the domain is still the authority (it throws if bypassed).
 */
export function BuildAllocator({
  nodes,
  ranks,
  level,
  availablePoints,
  onAllocate,
  onRefund,
}: {
  nodes: readonly AllocNode[];
  ranks: Readonly<Record<string, number>>;
  level: number;
  availablePoints: number;
  onAllocate: (id: string) => void;
  onRefund: (id: string) => void;
}) {
  const maxBand = unlockedBand(level);
  return (
    <Stack>
      {nodes.map((node) => {
        const rank = ranks[node.id] ?? 0;
        const bandLocked = node.band > maxBand;
        const atMax = rank >= node.maxRank;
        return (
          <Row key={node.id} justify="between">
            <span className="alloc-label">
              <span className="chip-name">{node.label ?? node.id}</span>
              <span className="chip-meta">
                rank {rank}/{node.maxRank}
              </span>
            </span>
            {bandLocked ? (
              <Badge tone="warn">
                unlocks L{bandUnlockLevel(node.band as Band)}
              </Badge>
            ) : (
              <Row>
                <Button
                  size="sm"
                  disabled={rank <= 0}
                  onClick={() => onRefund(node.id)}
                >
                  −
                </Button>
                <span className="stepper-value">{rank}</span>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={atMax || availablePoints <= 0}
                  onClick={() => onAllocate(node.id)}
                >
                  +
                </Button>
              </Row>
            )}
          </Row>
        );
      })}
    </Stack>
  );
}
