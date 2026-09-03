import { describe, expect, it } from "vitest";
import {
  advance,
  advanceAuto,
  parseStory,
  validateStoryStructure,
  type Story,
} from "../../src/engine/mechanics/story";
import rawStory from "../../content/chapters/ch05-configuration-audit/STORY-05-01-does-it-still-match.json";

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

describe("STORY-05-01-does-it-still-match structural validity", () => {
  const story = parseStory(rawStory);

  it("has no structural issues", () => {
    expect(validateStoryStructure(story)).toEqual([]);
  });

  it("carries a project brief (CR-116)", () => {
    expect(story.project?.name).toBeTruthy();
    expect(story.project?.description).toBeTruthy();
  });

  // CR-120 turned this chapter from a reading exercise into an inspection
  // one: the evidence lives in the graph, and the prose and the choices
  // must stop handing the answer over. These guard the properties that
  // made that true, because they are easy to undo by accident when
  // editing copy.
  describe("the checks make the player read the graph (CR-120)", () => {
    const checkStages = [
      "check-nova-api",
      "check-nova-web",
      "check-nova-worker",
      "check-nova-cache",
      "check-nova-gateway",
    ].map((id) => ({ id, stage: story.stages[id] }));

    it("covers all five checks", () => {
      expect(checkStages.every(({ stage }) => stage?.choices?.length === 2));
    });

    it("no check narrates whether the two refs actually match", () => {
      // The old copy said things like "prod's ref points further back -
      // before that fix ever landed", which is the finding, not the setup.
      const givesItAway =
        /points further back|tagged directly at prod|one more commit landed|points somewhere else/i;
      for (const { id, stage } of checkStages) {
        expect(`${id}: ${stage.narrative}`).not.toMatch(givesItAway);
      }
    });

    it("no choice hedges - both options commit to a concrete claim", () => {
      // "can't be sure without comparing again" was never once the correct
      // answer, across every light check in the chapter: a free answer key.
      const hedging = /can't be sure|close enough|not sure|maybe|probably/i;
      for (const { id, stage } of checkStages) {
        for (const choice of stage.choices!) {
          expect(`${id}/${choice.id}: ${choice.label}`).not.toMatch(hedging);
        }
      }
    });

    it("both options open with a verdict, so neither is the odd one out", () => {
      for (const { id, stage } of checkStages) {
        for (const choice of stage.choices!) {
          expect(`${id}/${choice.id}: ${choice.label}`).toMatch(
            /^[^:]*: (Drifted|Compliant) - /,
          );
        }
      }
    });

    it("the two options in a check are close in length, so size isn't a tell", () => {
      for (const { id, stage } of checkStages) {
        const lengths = stage.choices!.map((c) => c.label.length);
        const ratio = Math.max(...lengths) / Math.min(...lengths);
        // Named in the assertion so a failure says which check drifted.
        expect({ id, tooLopsided: ratio >= 1.25 }).toEqual({
          id,
          tooLopsided: false,
        });
      }
    });
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

  describe("the correct path checks all 5 CIs (CR-116: 5+ real decisions)", () => {
    it("answering all 5 checks correctly reaches a good ending", () => {
      const path = walk(story, [
        { auto: true }, // start -> check-nova-api
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true }, // resolution-clean -> good-ending
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBe(8);
    });
  });

  describe("Nova API (unaudited extra commit) - escalation-capable", () => {
    it("clearing it, then comparing the commit IDs, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "web-compliant" },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Nova Web (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-drifted" },
        { choiceId: "web-drifted" },
        { auto: true },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Nova Worker (missing the baseline's retry-cap fix) - escalation-capable", () => {
    it("clearing it, then checking what the baseline included, still reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-compliant" },
        { auto: true },
        { choiceId: "recheck" },
        { auto: true },
        { choiceId: "cache-compliant" },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });

    it("clearing it and defending reaches a bad ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-compliant" },
        { auto: true },
        { choiceId: "defend" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("bad");
      expect(path.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Nova Cache (compliant) - light, single-shot", () => {
    it("misreading it still self-corrects and reaches a good ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-drifted" },
        { auto: true },
        { choiceId: "gateway-drifted" },
        { auto: true },
      ]);
      expect(story.stages[path.at(-1)!].ending?.kind).toBe("good");
    });
  });

  describe("Nova Gateway (baseline tag silently moved) - escalation-capable, the nuanced one", () => {
    it("clearing it, then checking the audit log's recorded commit, reaches a neutral ending", () => {
      const path = walk(story, [
        { auto: true },
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-compliant" },
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
        { choiceId: "api-drifted" },
        { choiceId: "web-compliant" },
        { choiceId: "worker-drifted" },
        { choiceId: "cache-compliant" },
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
