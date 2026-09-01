import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
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

function storyWithAutoNext(): Story {
  return {
    id: "STORY-TEST-AUTO",
    chapterId: "ch-test",
    title: "Test Story",
    startStageId: "start",
    stages: {
      start: {
        id: "start",
        narrative: "start",
        autoNext: "middle",
      },
      middle: {
        id: "middle",
        narrative: "middle",
        prompt: "go where?",
        choices: [{ id: "on", label: "On", nextStageId: "good-end" }],
      },
      "good-end": {
        id: "good-end",
        narrative: "the end",
        ending: { kind: "good", debrief: "nice" },
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

describe("advanceAuto()", () => {
  it("moves to the stage's autoNext", () => {
    expect(advanceAuto(storyWithAutoNext(), "start")).toBe("middle");
  });

  it("throws for an unknown stage", () => {
    expect(() => advanceAuto(storyWithAutoNext(), "nowhere")).toThrow();
  });

  it("throws when the stage has no autoNext", () => {
    expect(() => advanceAuto(storyWithAutoNext(), "middle")).toThrow();
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

  it("finds no issues in a well-formed story that uses autoNext", () => {
    expect(validateStoryStructure(storyWithAutoNext())).toEqual([]);
  });

  it("reachability follows autoNext edges, not just choices", () => {
    const story = storyWithAutoNext();
    // "middle" is only reachable via "start"'s autoNext, not any choice -
    // if the validator only walked choices, this would wrongly flag it.
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "unreachable-stage")).toBe(false);
  });

  it("catches a dangling autoNext target", () => {
    const story = storyWithAutoNext();
    story.stages.start.autoNext = "does-not-exist";
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "dangling-next-stage")).toBe(true);
  });

  it("catches a stage with both autoNext and choices", () => {
    const story = storyWithAutoNext();
    story.stages.start.choices = [
      { id: "x", label: "x", nextStageId: "middle" },
    ];
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "malformed-stage")).toBe(true);
  });

  it("catches a stage with both autoNext and an ending", () => {
    const story = storyWithAutoNext();
    story.stages.start.ending = { kind: "good", debrief: "huh" };
    const issues = validateStoryStructure(story);
    expect(issues.some((i) => i.type === "malformed-stage")).toBe(true);
  });
});
