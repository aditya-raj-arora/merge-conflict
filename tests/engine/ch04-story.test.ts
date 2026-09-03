import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch04-status-accounting/STORY-04-01-what-does-prod-actually-run.json";

/** Same walk() helper duplicated across each chapter's story test suite
 * on purpose - each chapter's tests should stand alone. */
function walk(
  story: Story,
  steps: Array<{ choiceId: string } | { auto: true }>,
): string[] {
  const visited = [story.startStageId];
  let stageId = story.startStageId;
  for (const step of steps) {
    stageId =
      "auto" in step
        ? advanceAuto(story, stageId)
        : advance(story, stageId, step.choiceId);
    visited.push(stageId);
  }
  return visited;
}

describe("STORY-04-01-what-does-prod-actually-run structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-115)", () => {
    expect(story.project?.name).toBeTruthy();
    expect(story.project?.description).toBeTruthy();
  });

  it("has good, bad, and neutral endings, with three distinct bad endings", () => {
    const endingKinds = Object.values(story.stages)
      .map((s) => s.ending?.kind)
      .filter((kind): kind is "good" | "bad" | "neutral" => Boolean(kind));

    expect(endingKinds).toContain("good");
    expect(endingKinds).toContain("bad");
    expect(endingKinds).toContain("neutral");
    expect(endingKinds.filter((k) => k === "bad")).toHaveLength(3);
  });

  it("every stage's mood, if set, is one of the known set", () => {
    const knownMoods = new Set(["calm", "tense", "danger", "neutral"]);
    for (const stage of Object.values(story.stages)) {
      if (stage.mood) {
        expect(knownMoods.has(stage.mood)).toBe(true);
      }
    }
  });

  describe("the correct path checks all 5 services (CR-115: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-lighthouse
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-drifted" },
        { auto: true }, // resolution-clean -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBe(8);
    });
  });

  describe("Lighthouse Sync (untagged rollback) - escalation-capable", () => {
    it("clearing it, then comparing the commits, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Anchor Auth (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-drifted" },
        { auto: true },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Beacon Search (stale but ahead) - escalation-capable", () => {
    it("clearing it, then correcting the record, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Cargo Billing (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-drifted" },
        { auto: true },
        { choiceId: "drift-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Drift Notify (stale label, correct code) - escalation-capable, the nuanced one", () => {
    it("clearing it, then flagging the stale label, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "lighthouse-drifted" },
        { choiceId: "anchor-compliant" },
        { choiceId: "beacon-drifted" },
        { choiceId: "cargo-compliant" },
        { choiceId: "drift-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });
});
