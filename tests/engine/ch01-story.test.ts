import { describe, expect, it } from "vitest";
import {
  advance,
  parseStory,
  validateStoryStructure,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch01-identification/STORY-01-01-which-one-shipped.json";

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
  });

  it("picking build-b directly reaches a good ending", () => {
    const stageId = advance(story, "start", "pick-b");
    expect(story.stages[stageId].ending?.kind).toBe("good");
  });

  it("picking build-a then patching live reaches a bad ending", () => {
    let stageId = advance(story, "start", "pick-a");
    stageId = advance(story, stageId, "patch-live");
    expect(story.stages[stageId].ending?.kind).toBe("bad");
  });

  it("picking build-a then swapping immediately reaches a recovered (neutral) ending", () => {
    let stageId = advance(story, "start", "pick-a");
    stageId = advance(story, stageId, "swap-immediately");
    expect(story.stages[stageId].ending?.kind).toBe("neutral");
  });

  it("picking build-c then presenting anyway reaches a bad ending", () => {
    let stageId = advance(story, "start", "pick-c");
    stageId = advance(story, stageId, "present-anyway");
    expect(story.stages[stageId].ending?.kind).toBe("bad");
  });

  it("picking build-c then double-checking recovers to a good ending", () => {
    let stageId = advance(story, "start", "pick-c");
    stageId = advance(story, stageId, "double-check");
    expect(story.stages[stageId].ending?.kind).toBe("good");
  });
});
