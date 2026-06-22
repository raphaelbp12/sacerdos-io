import { useState } from "react";
import {
  Badge,
  Button,
  Heading,
  LogList,
  Panel,
  Row,
  Screen,
  Stepper,
} from "../primitives";
import { GoldBar } from "../composites";
import {
  ACTS,
  actByIndex,
  stageAt,
  stageItemLevel,
  stageMonsterLevel,
} from "../../domain/stages";
import { useAction } from "../state";

/** The core loop: pick a stage, run it to completion, read rewards, open chests (M9–M14). */
export function BattleScreen() {
  const { session, act, error } = useAction();
  const [log, setLog] = useState<readonly string[]>([]);

  const { actIndex, stageIndex } = session.position;
  const currentAct = actByIndex(actIndex);
  const stage = stageAt(actIndex, stageIndex);
  const monsterLevel = stageMonsterLevel(stage, session.difficulty);
  const itemLevel = stageItemLevel(stage, session.difficulty);

  function pushLog(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }

  function handlePlay() {
    act(() => {
      const report = session.playStage();
      if (report.status === "cleared") {
        pushLog(
          `Cleared ${actIndex}-${stageIndex}: +${report.gold}g, +${report.xp} xp, ${report.chests.length} chest(s).`,
        );
      } else {
        pushLog(`Wiped on ${actIndex}-${stageIndex} — retreated one stage.`);
      }
    });
  }

  function handleOpenChest() {
    act(() => {
      const item = session.openChest();
      pushLog(`Opened a chest → ${item.rarity} ${item.name}.`);
    });
  }

  return (
    <Screen title="Battle">
      <Panel heading="Wallet">
        <GoldBar gold={session.gold} chests={session.pendingChests.length} />
      </Panel>

      <Panel heading="Stage select">
        <Heading level={3}>{currentAct.name}</Heading>
        <Row justify="between">
          <span className="label">Act</span>
          <Stepper
            value={actIndex}
            min={1}
            max={ACTS.length}
            onChange={(next) => act(() => session.selectStage(next, 1))}
          />
        </Row>
        <Row justify="between">
          <span className="label">Stage</span>
          <Stepper
            value={stageIndex}
            min={1}
            max={currentAct.stages.length}
            onChange={(next) => act(() => session.selectStage(actIndex, next))}
          />
        </Row>
        <Row>
          <Badge tone="neutral">{session.difficulty}</Badge>
          <Badge>monster L{monsterLevel}</Badge>
          <Badge>item L{itemLevel}</Badge>
          {currentAct.allowedElements.map((el) => (
            <Badge key={el} tone="accent">
              {el}
            </Badge>
          ))}
        </Row>
        {error && <Badge tone="bad">{error}</Badge>}
        <Row>
          <Button variant="primary" block onClick={handlePlay}>
            ▶ Play stage {actIndex}-{stageIndex}
          </Button>
        </Row>
        <Row>
          <Button
            block
            disabled={session.pendingChests.length === 0}
            onClick={handleOpenChest}
          >
            🎁 Open chest ({session.pendingChests.length})
          </Button>
        </Row>
      </Panel>

      <Panel heading="Battle log">
        {log.length === 0 ? (
          <span className="label">Play a stage to see rewards.</span>
        ) : (
          <LogList lines={log} />
        )}
      </Panel>
    </Screen>
  );
}
