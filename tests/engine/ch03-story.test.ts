import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch03-change-control/STORY-03-01-who-skipped-review.json";

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

describe("STORY-03-01-who-skipped-review structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-112)", () => {
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

  describe("the correct path reviews all 5 commits (CR-112: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-c1
        { choiceId: "c1-fine" }, // -> check-c2
        { choiceId: "c2-fine" }, // -> check-c3
        { choiceId: "c3-fine" }, // -> check-c4
        { choiceId: "c4-flag" }, // -> check-c5
        { choiceId: "c5-fine" }, // -> resolution-clean
        { auto: true }, // -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      // 5 real decisions (one per commit) plus narration stages.
      expect(path.length).toBe(8);
    });
  });

  describe("commit 1 (docs-only, no CR needed) - escalation-capable", () => {
    it("flagging it, then reconsidering, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-flag" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "c2-fine" },
        { choiceId: "c3-fine" },
        { choiceId: "c4-flag" },
        { choiceId: "c5-fine" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("flagging it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-flag" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("commit 2 (caching, has a CR) - escalation-capable", () => {
    it("flagging it, then reconsidering, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-flag" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "c3-fine" },
        { choiceId: "c4-flag" },
        { choiceId: "c5-fine" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("flagging it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-flag" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("commit 3 (pagination fix, has a CR) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-fine" },
        { choiceId: "c3-flag" },
        { auto: true },
        { choiceId: "c4-flag" },
        { choiceId: "c5-fine" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("commit 4 (the actual culprit - timeout change, no CR) - escalation-capable", () => {
    it("clearing it, then catching the pushback, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-fine" },
        { choiceId: "c3-fine" },
        { choiceId: "c4-fine" },
        { auto: true },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "c5-fine" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-fine" },
        { choiceId: "c3-fine" },
        { choiceId: "c4-fine" },
        { auto: true },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("commit 5 (README badges, has a CR) - light, single-shot", () => {
    it("misreading it on the clean path still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-fine" },
        { choiceId: "c3-fine" },
        { choiceId: "c4-flag" },
        { choiceId: "c5-flag" },
        { auto: true },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });

    it("misreading it on the recovered-late path still reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "c1-fine" },
        { choiceId: "c2-fine" },
        { choiceId: "c3-fine" },
        { choiceId: "c4-fine" },
        { auto: true },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "c5-flag" },
        { auto: true },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
    });
  });
});
