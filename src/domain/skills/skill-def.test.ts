import { describe, it, expect } from "vitest";
import { KNIGHT_SKILL_NODES } from "../character";
import { KNIGHT_SKILLS, skillById } from "./skill-def";

describe("KNIGHT_SKILLS", () => {
  it("defines exactly one SkillDef per registered Knight skill node", () => {
    const skillIds = KNIGHT_SKILLS.map((s) => s.id).sort();
    const nodeIds = KNIGHT_SKILL_NODES.map((n) => n.id).sort();
    expect(skillIds).toEqual(nodeIds);
  });

  it("keeps band and maxRank single-sourced from the build nodes", () => {
    for (const node of KNIGHT_SKILL_NODES) {
      const skill = skillById(node.id);
      expect(skill.band).toBe(node.band);
      expect(skill.maxRank).toBe(node.maxRank);
    }
  });

  it("gives every skill one value per rank", () => {
    for (const skill of KNIGHT_SKILLS) {
      expect(skill.values).toHaveLength(skill.maxRank);
    }
  });

  it("gives every skill a 3000 ms base cooldown", () => {
    for (const skill of KNIGHT_SKILLS) {
      expect(skill.cooldownMs).toBe(3000);
    }
  });

  it("matches the overview's per-rank values and kinds", () => {
    expect(skillById("smash")).toMatchObject({
      kind: "damage",
      range: "short",
      element: "physical",
      values: [2.0, 2.5, 3.0, 3.5, 4.0],
    });
    expect(skillById("shatter")).toMatchObject({
      kind: "areaDamage",
      range: "area",
      element: "physical",
      values: [1.0, 1.25, 1.5, 1.75, 2.0],
    });
    expect(skillById("raise-shield")).toMatchObject({
      kind: "buff",
      range: "self",
      element: "physical",
      values: [3, 4, 5, 6, 7],
    });
    expect(skillById("provoke")).toMatchObject({
      kind: "debuff",
      range: "long",
      element: "physical",
      values: [-0.2, -0.3, -0.4, -0.5, -0.6],
    });
  });

  it("throws for an unknown skill id", () => {
    expect(() => skillById("nonexistent")).toThrow(/unknown skill/i);
  });
});
