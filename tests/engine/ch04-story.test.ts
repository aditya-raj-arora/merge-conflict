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

  it("has good, bad, and neutral endings, with three distinct bad endings", () => {
    const endingKinds = Object.values(story.stages)
      .map((s) => s.ending?.kind)
      .filter((kind): kind is "good" | "bad" | "neutral" => Boolean(kind));

    expect(endingKinds).toContain("good");
    expect(endingKinds).toContain("bad");
    expect(endingKinds).toContain("neutral");
    expect(endingKinds.filter((k) => k === "bad")).toHaveLength(3);
  });

  it("picking rollback directly reaches a good ending quickly (short path is intentional)", () => {
    const path = walk(story, [{ choiceId: "rollback" }, { auto: true }]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    expect(path.length).toBe(3);
  });

  it("guessing v1.4.0, recheck: depth >= 5, recovers to a neutral ending", () => {
    const path = walk(story, [
      { choiceId: "v140" },
      { auto: true },
      { auto: true },
      { choiceId: "recheck" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("guessing v1.4.0, defend: depth >= 5, reaches a bad ending", () => {
    const path = walk(story, [
      { choiceId: "v140" },
      { auto: true },
      { auto: true },
      { choiceId: "defend" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("guessing v1.4.1, recheck: depth >= 5, reaches a good ending", () => {
    const path = walk(story, [
      { choiceId: "v141" },
      { auto: true },
      { auto: true },
      { choiceId: "recheck" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("guessing v1.4.1, defend: depth >= 5, reaches a bad ending", () => {
    const path = walk(story, [
      { choiceId: "v141" },
      { auto: true },
      { auto: true },
      { choiceId: "defend" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("trusting the status page's v1.4.2 claim, recheck: depth >= 5, reaches a good ending", () => {
    const path = walk(story, [
      { choiceId: "v142" },
      { auto: true },
      { auto: true },
      { choiceId: "recheck" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("trusting the status page's v1.4.2 claim, defend: depth >= 5, reaches a bad ending", () => {
    const path = walk(story, [
      { choiceId: "v142" },
      { auto: true },
      { auto: true },
      { choiceId: "defend" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("every stage's mood, if set, is one of the known set", () => {
    const knownMoods = new Set(["calm", "tense", "danger", "neutral"]);
    for (const stage of Object.values(story.stages)) {
      if (stage.mood) {
        expect(knownMoods.has(stage.mood)).toBe(true);
      }
    }
  });
});
