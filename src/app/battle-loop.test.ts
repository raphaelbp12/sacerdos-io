import { describe, it, expect } from "vitest";

import { nextStagePlan } from "./battle-loop";
import { createInitialGame } from "./index";
import type { StageReport } from "./index";
import type { StagePosition } from "../domain/stages";
import { SeededRng } from "../domain/rng";

const cleared: StageReport = { status: "cleared", gold: 1, xp: 1, chests: [] };
const wiped: StageReport = { status: "wiped", gold: 0, xp: 0, chests: [] };

const at = (actIndex: number, stageIndex: number): StagePosition => ({
  actIndex,
  stageIndex,
});

describe("nextStagePlan", () => {
  it("clearing the frontier stage advances and moves the frontier", () => {
    const plan = nextStagePlan(at(1, 1), at(1, 1), cleared);
    expect(plan.action).toBe("advance");
    expect(plan.next).toEqual(at(1, 2));
    expect(plan.frontier).toEqual(at(1, 2));
  });

  it("clearing an earlier-selected stage repeats it (farming, frontier unchanged)", () => {
    const plan = nextStagePlan(at(1, 2), at(1, 5), cleared);
    expect(plan.action).toBe("repeat");
    expect(plan.next).toEqual(at(1, 2));
    expect(plan.frontier).toEqual(at(1, 5));
  });

  it("wiping with retry re-fights the same stage", () => {
    const plan = nextStagePlan(at(1, 4), at(1, 4), wiped, {
      retryOnWipe: true,
    });
    expect(plan.action).toBe("repeat");
    expect(plan.next).toEqual(at(1, 4));
  });

  it("wiping without retry retreats one stage", () => {
    const plan = nextStagePlan(at(1, 4), at(1, 4), wiped, {
      retryOnWipe: false,
    });
    expect(plan.action).toBe("retreat");
    expect(plan.next).toEqual(at(1, 3));
  });

  it("retreat never drops below the first stage", () => {
    const plan = nextStagePlan(at(1, 1), at(1, 1), wiped);
    expect(plan.action).toBe("retreat");
    expect(plan.next).toEqual(at(1, 1));
  });
});

// A headless drive of the real auto-loop: begin a stage, step it to completion, finish,
// plan the next stage, select it, repeat — and assert the position walks as expected.
describe("auto-loop chaining (headless)", () => {
  const STEP_MS = 100;

  function runOne(session: ReturnType<typeof createInitialGame>): StageReport {
    const battle = session.beginStage();
    let guard = 0;
    while (battle.status === "ongoing" && guard++ < 50_000) {
      battle.advance(STEP_MS);
    }
    return battle.finish();
  }

  it("advances the frontier across consecutive frontier clears", () => {
    // A strong hero so each act-1 entry stage clears (createInitialGame is weak — use a
    // boosted gold/level path is unnecessary; instead drive plans with crafted reports).
    let frontier = at(1, 1);
    let pos = at(1, 1);
    for (let i = 0; i < 3; i++) {
      const plan = nextStagePlan(pos, frontier, cleared);
      expect(plan.action).toBe("advance");
      pos = plan.next;
      frontier = plan.frontier;
    }
    expect(pos).toEqual(at(1, 4));
    expect(frontier).toEqual(at(1, 4));
  });

  it("a weak party wiping without retry walks backward but never below 1-1", () => {
    const session = createInitialGame(new SeededRng(1)); // barehanded-ish L1: wipes
    session.selectStage(1, 2);
    let frontier = at(1, 2);
    let pos = session.position;

    const report = runOne(session);
    expect(report.status).toBe("wiped");
    const plan = nextStagePlan(pos, frontier, report, { retryOnWipe: false });
    pos = plan.next;
    frontier = plan.frontier;
    expect(plan.action).toBe("retreat");
    expect(pos).toEqual(at(1, 1));

    // Wiping again at 1-1 holds the floor.
    const plan2 = nextStagePlan(pos, frontier, wiped, { retryOnWipe: false });
    expect(plan2.next).toEqual(at(1, 1));
  });
});
