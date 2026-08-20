import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import rawLevel from "../../content/chapters/ch03-change-control/LVL-03-01-who-skipped-review.json";

describe("LVL-03-01-who-skipped-review solvability", () => {
  const level = parseLevel(rawLevel);

  it("the level's declared correct answer actually wins", () => {
    expect(evaluateAnswer(level, level.correctOptionId)).toBe(true);
  });

  it("every other option loses", () => {
    const wrongOptions = level.options.filter(
      (o) => o.id !== level.correctOptionId,
    );
    expect(wrongOptions.length).toBeGreaterThan(0);
    for (const option of wrongOptions) {
      expect(evaluateAnswer(level, option.id)).toBe(false);
    }
  });

  it("every commit is signed - identity isn't the distinguishing signal", () => {
    for (const commit of Object.values(level.graph.commits)) {
      expect(commit.authorSigned).toBe(true);
    }
  });

  it("the correct answer's commit is the only one missing a CR reference", () => {
    const crRefPattern = /Refs: CR-\d+/;
    const withoutCrRef = Object.values(level.graph.commits).filter(
      (c) => !crRefPattern.test(c.message),
    );
    // c1 is the initial scaffold commit, not one of the selectable options -
    // only real "changes" (the level's options) should be checked here.
    const withoutCrRefAmongOptions = withoutCrRef.filter((c) =>
      level.options.some((o) => o.id === c.id),
    );

    expect(withoutCrRefAmongOptions).toHaveLength(1);
    expect(withoutCrRefAmongOptions[0].id).toBe(level.correctOptionId);
  });
});
