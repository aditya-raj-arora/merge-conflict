import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch01-identification/STORY-01-01-which-one-shipped.json";

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

describe("STORY-01-01-which-one-shipped structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-113)", () => {
    expect(story.project?.name).toBeTruthy();
    expect(story.project?.description).toBeTruthy();
  });

  it("has good, bad, and neutral endings, with four distinct bad endings", () => {
    // Unlike the other chapters' 3-bad-ending convention, build-a's
    // defended crash branches into two distinct bad endings on its own
    // (own-it vs blame-tooling) - preserved from the original chapter
    // rather than flattened to match every other chapter's count.
    const endingKinds = Object.values(story.stages)
      .map((s) => s.ending?.kind)
      .filter((kind): kind is "good" | "bad" | "neutral" => Boolean(kind));

    expect(endingKinds).toContain("good");
    expect(endingKinds).toContain("bad");
    expect(endingKinds).toContain("neutral");
    expect(endingKinds.filter((k) => k === "bad")).toHaveLength(4);
  });

  it("every stage's mood, if set, is one of the known set", () => {
    const knownMoods = new Set(["calm", "tense", "danger", "neutral"]);
    for (const stage of Object.values(story.stages)) {
      if (stage.mood) {
        expect(knownMoods.has(stage.mood)).toBe(true);
      }
    }
  });

  describe("the correct path reviews all 5 builds (CR-113: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-build-a
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-not-ready" },
        { choiceId: "b-ready" },
        { auto: true }, // -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBe(8);
    });
  });

  describe("build-a (unsigned WIP) - escalation-capable, richest branch", () => {
    it("clearing it, then swapping immediately, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-ready" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-not-ready" },
        { choiceId: "b-ready" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it, defending, and owning the crash reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-ready" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
        { choiceId: "own-it" },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it, defending, and blaming tooling reaches a distinct bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-ready" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
        { choiceId: "blame-tooling" },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.at(-1)).not.toBe(
        walk(story, [
          { auto: true },
          { choiceId: "a-ready" },
          { auto: true },
          { choiceId: "defend" },
          { auto: true },
          { choiceId: "own-it" },
        ]).at(-1),
      );
    });
  });

  describe("build-c (signed but outdated) - escalation-capable", () => {
    it("clearing it, then rechecking, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-ready" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "d-not-ready" },
        { choiceId: "e-not-ready" },
        { choiceId: "b-ready" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-ready" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("build-d (explicitly internal-only) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-ready" },
        { auto: true },
        { choiceId: "e-not-ready" },
        { choiceId: "b-ready" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("build-e (functionally ready, never formally approved) - escalation-capable, the nuanced one", () => {
    it("clearing it, then rechecking for an approval commit, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-ready" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "b-ready" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-ready" },
        { auto: true },
        { choiceId: "defend" },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("build-b (fully signed, explicitly approved) - light, single-shot", () => {
    it("misreading it on the clean path still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-not-ready" },
        { choiceId: "b-not-ready" },
        { auto: true },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });

    it("misreading it on the recovered-late path still reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "a-not-ready" },
        { choiceId: "c-not-ready" },
        { choiceId: "d-not-ready" },
        { choiceId: "e-ready" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "b-not-ready" },
        { auto: true },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
    });
  });
});
