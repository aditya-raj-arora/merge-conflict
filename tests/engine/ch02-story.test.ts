import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch02-version-control/STORY-02-01-whose-fix-made-it.json";

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

describe("STORY-02-01-whose-fix-made-it structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-114)", () => {
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

  describe("the correct path checks all 5 devs (CR-114: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-priya
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-live" },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-not-live" },
        { auto: true }, // resolution-clean -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBe(8);
    });
  });

  describe("Priya (direct ancestor) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-not-live" },
        { auto: true },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-live" },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-not-live" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Sam (dangling, never merged) - escalation-capable", () => {
    it("clearing it, then rechecking, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-live" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "devon-live" },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-not-live" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-live" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Devon (deeper ancestor, not a direct parent) - escalation-capable", () => {
    it("clearing it, then tracing the full ancestry, reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-not-live" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-not-live" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-not-live" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Aisha (direct parent of the tip) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-live" },
        { choiceId: "aisha-not-live" },
        { auto: true },
        { choiceId: "marcus-not-live" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Marcus (merged onto a different branch, not main) - escalation-capable, the nuanced one", () => {
    it("clearing it, then checking the actual ref, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-live" },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-live" },
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
        { choiceId: "priya-live" },
        { choiceId: "sam-not-live" },
        { choiceId: "devon-live" },
        { choiceId: "aisha-live" },
        { choiceId: "marcus-live" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });
});
