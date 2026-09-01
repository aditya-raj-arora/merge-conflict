import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch01-identification/STORY-01-01-which-one-shipped.json";

/** Walks a path of {choiceId} / {auto: true} steps from startStageId,
 * returning the full list of stage ids visited (inclusive of start and
 * the final stage) - used both to reach a specific ending and to assert
 * on how deep a path actually is. */
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

  it("has multiple distinct endings, not just one path to a good ending", () => {
    const endingKinds = Object.values(story.stages)
      .map((s) => s.ending?.kind)
      .filter((kind): kind is "good" | "bad" | "neutral" => Boolean(kind));

    expect(endingKinds).toContain("good");
    expect(endingKinds).toContain("bad");
    expect(endingKinds).toContain("neutral");
    // Three distinct bad endings (own-it, blame-tooling, and build-c's
    // present-anyway) - the aftermath choice needs to actually produce a
    // different outcome, not just different flavor text on the same one.
    expect(endingKinds.filter((k) => k === "bad")).toHaveLength(3);
  });

  it("picking build-b directly reaches a good ending quickly (short path is intentional)", () => {
    const path = walk(story, [{ choiceId: "pick-b" }, { auto: true }]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    expect(path.length).toBe(3);
  });

  it("build-a, swap immediately: depth >= 5, reaches a neutral (recovered) ending", () => {
    const path = walk(story, [
      { choiceId: "pick-a" },
      { auto: true },
      { auto: true },
      { choiceId: "swap-immediately" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("neutral");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("build-a, patch live then own it: depth >= 5, reaches a bad ending", () => {
    const path = walk(story, [
      { choiceId: "pick-a" },
      { auto: true },
      { auto: true },
      { choiceId: "patch-live" },
      { auto: true },
      { choiceId: "own-it" },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("build-a, patch live then blame tooling: a distinct bad ending from own-it", () => {
    const ownItPath = walk(story, [
      { choiceId: "pick-a" },
      { auto: true },
      { auto: true },
      { choiceId: "patch-live" },
      { auto: true },
      { choiceId: "own-it" },
    ]);
    const blamePath = walk(story, [
      { choiceId: "pick-a" },
      { auto: true },
      { auto: true },
      { choiceId: "patch-live" },
      { auto: true },
      { choiceId: "blame-tooling" },
    ]);
    expect(story.stages[blamePath.at(-1)!].ending?.kind).toBe("bad");
    expect(blamePath.at(-1)).not.toBe(ownItPath.at(-1));
  });

  it("build-c, present anyway: depth >= 5, reaches a bad ending", () => {
    const path = walk(story, [
      { choiceId: "pick-c" },
      { auto: true },
      { auto: true },
      { choiceId: "present-anyway" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("build-c, double-check: depth >= 5, recovers to a good ending", () => {
    const path = walk(story, [
      { choiceId: "pick-c" },
      { auto: true },
      { auto: true },
      { choiceId: "double-check" },
      { auto: true },
    ]);
    expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    expect(path.length).toBeGreaterThanOrEqual(5);
  });

  it("every stage has a speaker or falls back to Narrator, and moods are one of the known set", () => {
    const knownMoods = new Set(["calm", "tense", "danger", "neutral"]);
    for (const stage of Object.values(story.stages)) {
      if (stage.mood) {
        expect(knownMoods.has(stage.mood)).toBe(true);
      }
    }
  });
});
