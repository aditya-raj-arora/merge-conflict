import { describe, expect, it } from "vitest";
import {
  advance,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";

function validStory(): Story {
  return {
    id: "STORY-TEST",
    chapterId: "ch-test",
    title: "Test Story",
    startStageId: "start",
    stages: {
      start: {
        id: "start",
        narrative: "start",
        prompt: "left or right?",
        choices: [
          { id: "left", label: "Left", nextStageId: "good-end" },
          { id: "right", label: "Right", nextStageId: "bad-end" },
        ],
      },
      "good-end": {
        id: "good-end",
        narrative: "you win",
        ending: { kind: "good", debrief: "nice" },
      },
      "bad-end": {
        id: "bad-end",
        narrative: "you lose",
        ending: { kind: "bad", debrief: "oh no" },
      },
    },
  };
}

describe("advance()", () => {
  it("moves to the choice's nextStageId", () => {
    expect(advance(validStory(), "start", "left")).toBe("good-end");
    expect(advance(validStory(), "start", "right")).toBe("bad-end");
  });

  it("throws for an unknown stage", () => {
    expect(() => advance(validStory(), "nowhere", "left")).toThrow();
  });

  it("throws for an unknown choice on a real stage", () => {
    expect(() => advance(validStory(), "start", "nope")).toThrow();
  });
});

describe("parseStory()", () => {
  it("accepts a well-formed story", () => {
    expect(() => parseStory(validStory())).not.toThrow();
  });

  it("rejects a story missing required fields", () => {
    expect(() => parseStory({})).toThrow();
    expect(() => parseStory({ id: "x" })).toThrow();
  });
});

describe("validateStoryStructure()", () => {
  it("finds no issues in a well-formed story", () => {
    expect(validateStoryStructure(validStory())).toEqual([]);
  });

  it("catches a dangling nextStageId", () => {
    const story = validStory();
    story.stages.start.choices![0].nextStageId = "does-not-exist";
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "dangling-next-stage")).toBe(true);
  });

  it("catches an unreachable stage", () => {
    const story = validStory();
    story.stages["orphan"] = {
      id: "orphan",
      narrative: "nobody gets here",
      ending: { kind: "neutral", debrief: "..." },
    };
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "unreachable-stage")).toBe(true);
  });

  it("catches a stage with both choices and an ending", () => {
    const story = validStory();
    story.stages["good-end"].choices = [
      { id: "x", label: "x", nextStageId: "start" },
    ];
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "malformed-stage")).toBe(true);
  });

  it("catches a stage with neither choices nor an ending", () => {
    const story = validStory();
    delete story.stages["good-end"].ending;
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "malformed-stage")).toBe(true);
  });

  it("catches a story with no reachable good ending", () => {
    const story = validStory();
    story.stages["good-end"].ending!.kind = "neutral";
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "no-good-ending")).toBe(true);
  });
});
