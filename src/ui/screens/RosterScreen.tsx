import { Badge, EmptyState, Panel, Row, Screen, Stack } from "../primitives";
import { useAction } from "../state";

/** Roster + groups: owned characters and each group's formation order (M19). */
export function RosterScreen() {
  const { session } = useAction();

  return (
    <Screen title="Roster">
      <Panel heading="Characters">
        <Stack>
          {session.characterIds.map((id) => {
            const c = session.character(id);
            return (
              <Row key={id} justify="between">
                <span className="chip-name">{c.name}</span>
                <Badge tone="accent">
                  {c.classId} · L{c.level}
                </Badge>
              </Row>
            );
          })}
        </Stack>
      </Panel>

      <Panel heading="Groups">
        {session.groups.length === 0 ? (
          <EmptyState message="No groups." />
        ) : (
          <Stack>
            {session.groups.map((g) => (
              <Row key={g.id} justify="between" align="top">
                <span className="chip-name">{g.id}</span>
                <span className="chip-meta">
                  formation: {g.formation.join(" → ") || "(empty)"} ·{" "}
                  {g.formation.length}/{g.capacity}
                </span>
              </Row>
            ))}
          </Stack>
        )}
      </Panel>
    </Screen>
  );
}
