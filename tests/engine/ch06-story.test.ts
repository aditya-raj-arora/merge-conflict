import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch06-build-release/STORY-06-01-which-tag-lied.json";

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

describe("STORY-06-01-which-tag-lied structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-117)", () => {
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

  describe("the correct path checks all 5 releases (CR-117: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-nova-auth
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-drifted" },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true }, // resolution-clean -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBe(8);
    });
  });

  describe("Nova Auth (breaking change tagged as patch) - escalation-capable", () => {
    it("clearing it, then reading the commit message directly, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "billing-compliant" },
        { choiceId: "search-drifted" },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Nova Billing (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-drifted" },
        { choiceId: "billing-drifted" },
        { auto: true },
        { choiceId: "search-drifted" },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Nova Search (feature under-tagged as patch) - escalation-capable", () => {
    it("clearing it, then reading the commit's own type marker, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Nova Notify (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-drifted" },
        { choiceId: "notify-drifted" },
        { auto: true },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Nova Gateway (fix: label undersells a breaking change) - escalation-capable, the nuanced one", () => {
    it("clearing it, then checking the linked ticket, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-drifted" },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-compliant" },
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
        { choiceId: "auth-drifted" },
        { choiceId: "billing-compliant" },
        { choiceId: "search-drifted" },
        { choiceId: "notify-compliant" },
        { choiceId: "gateway-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });
});
