import { useReducer, useRef, useState } from "react";
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
import { BattleStrip, GoldBar, ingestBattleEvents } from "../composites";
import type { Floater } from "../composites";
import { nextStagePlan } from "../../app/index";
import type { BattleSession } from "../../app/index";
import {
  ACTS,
  actByIndex,
  stageAt,
  stageItemLevel,
  stageMonsterLevel,
} from "../../domain/stages";
import type { StagePosition } from "../../domain/stages";
import { useAction, useClockLoop } from "../state";

/** A clock that does nothing — passed to {@link useClockLoop} when no fight is live. */
const IDLE_CLOCK = { advance() {} };

/** Keep the live overlays bounded so a long idle run never grows state without limit. */
const MAX_FLOATERS = 16;
const MAX_FEED = 14;

/** Order positions: by act, then stage. `>0` when `a` is later than `b`. */
function comparePos(a: StagePosition, b: StagePosition): number {
  return a.actIndex - b.actIndex || a.stageIndex - b.stageIndex;
}

/**
 * The core idle loop (M22 + M23): pick a stage, watch it play out live, and then chain
 * automatically — on a clear advance / repeat, on a wipe retreat / retry — hands-free
 * until paused. Reward + progression rules stay in the domain; the "what next?" decision
 * is the pure {@link nextStagePlan} policy.
 */
export function BattleScreen() {
  const { session, act, error } = useAction();
  const [log, setLog] = useState<readonly string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [retryOnWipe, setRetryOnWipe] = useState(false);
  const [battle, setBattle] = useState<BattleSession | null>(null);
  const [floaters, setFloaters] = useState<readonly Floater[]>([]);
  const [feed, setFeed] = useState<readonly string[]>([]);
  const [, bump] = useReducer((n) => n + 1, 0);

  // Loop bookkeeping read inside the rAF callback — refs avoid stale closures.
  const frontierRef = useRef<StagePosition>(session.position);
  const foughtRef = useRef<StagePosition>(session.position);
  const playingRef = useRef(false);
  const retryRef = useRef(false);
  const floaterIdRef = useRef(0);

  const { actIndex, stageIndex } = session.position;
  const currentAct = actByIndex(actIndex);
  const stage = stageAt(actIndex, stageIndex);
  const monsterLevel = stageMonsterLevel(stage, session.difficulty);
  const itemLevel = stageItemLevel(stage, session.difficulty);

  function pushLog(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }

  function beginAt(): void {
    foughtRef.current = session.position;
    if (comparePos(session.position, frontierRef.current) > 0) {
      frontierRef.current = session.position;
    }
    setFloaters([]); // clear stale numbers from the previous stage
    act(() => setBattle(session.beginStage()));
  }

  function settle(b: BattleSession): void {
    const fought = foughtRef.current;
    let logLine = "";
    act(() => {
      const report = b.finish();
      const plan = nextStagePlan(fought, frontierRef.current, report, {
        retryOnWipe: retryRef.current,
      });
      frontierRef.current = plan.frontier;
      session.selectStage(plan.next.actIndex, plan.next.stageIndex);
      logLine =
        report.status === "cleared"
          ? `Cleared ${fought.actIndex}-${fought.stageIndex}: +${report.gold}g, +${report.xp} xp, ${report.chests.length} chest(s).`
          : `Wiped on ${fought.actIndex}-${fought.stageIndex} — ${plan.action === "repeat" ? "retrying" : "retreated"}.`;
    });
    pushLog(logLine);

    if (playingRef.current) {
      beginAt(); // chain hands-free into the next stage
    } else {
      setPlaying(false);
    }
  }

  // Drive the live fight: advance the battle on a fixed-step clock loop, re-render each
  // frame, and chain to the next stage the moment it settles. The clock is the only place
  // wall-clock time enters the app.
  useClockLoop({
    clock: battle ?? IDLE_CLOCK,
    playing: playing && battle != null && battle.status === "ongoing",
    onTick: () => {
      if (battle) {
        const events = battle.drainEvents();
        if (events.length) {
          const ingested = ingestBattleEvents(events, floaterIdRef.current);
          floaterIdRef.current = ingested.nextId;
          if (ingested.floaters.length) {
            setFloaters((prev) =>
              [...prev, ...ingested.floaters].slice(-MAX_FLOATERS),
            );
          }
          if (ingested.lines.length) {
            setFeed((prev) =>
              [...ingested.lines].reverse().concat(prev).slice(0, MAX_FEED),
            );
          }
        }
      }
      bump();
      if (battle && battle.status !== "ongoing") settle(battle);
    },
  });

  function handlePlay() {
    if (playing) {
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    playingRef.current = true;
    if (!battle || battle.status !== "ongoing") {
      beginAt();
    }
    setPlaying(true);
  }

  function handleOpenChest() {
    act(() => {
      const item = session.openChest();
      pushLog(`Opened a chest → ${item.rarity} ${item.name}.`);
    });
  }

  function toggleRetry() {
    const next = !retryRef.current;
    retryRef.current = next;
    setRetryOnWipe(next);
  }

  return (
    <Screen title="Battle">
      <Panel heading="Wallet">
        <GoldBar gold={session.gold} chests={session.pendingChests.length} />
      </Panel>

      <Panel heading="Battlefield">
        {battle ? (
          <BattleStrip
            party={battle.runner.currentBattle.party}
            enemies={battle.runner.currentBattle.enemies}
            floaters={floaters}
          />
        ) : (
          <span className="label">Press Play to send your party in.</span>
        )}
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
            {playing ? "⏸ Pause" : `▶ Play stage ${actIndex}-${stageIndex}`}
          </Button>
        </Row>
        <Row justify="between">
          <span className="label">Retry on wipe</span>
          <Button
            variant={retryOnWipe ? "primary" : undefined}
            onClick={toggleRetry}
          >
            {retryOnWipe ? "On" : "Off"}
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

      <Panel heading="Combat feed">
        {feed.length === 0 ? (
          <span className="label">
            Blow-by-blow appears here during a fight.
          </span>
        ) : (
          <LogList lines={feed} />
        )}
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
