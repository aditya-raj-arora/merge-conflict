import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import rawLevel from "../../content/chapters/ch05-configuration-audit/LVL-05-01-does-it-still-match.json";

describe("LVL-05-01-does-it-still-match solvability", () => {
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

  it("prod does not point at the same commit as the last baseline", () => {
    const baselineCommitId = level.graph.refs["BL-01"].commitId;
    const prodCommitId = level.graph.refs.prod.commitId;

    expect(prodCommitId).not.toBe(baselineCommitId);
  });

  it("prod is a direct descendant of the baseline, not a divergent or missing history", () => {
    // "missing-commit" is a wrong option specifically because prod is
    // *ahead* of BL-01, not behind it or on a different branch entirely.
    const baselineCommitId = level.graph.refs["BL-01"].commitId;
    const prodCommit = level.graph.commits[level.graph.refs.prod.commitId];

    expect(prodCommit.parentIds).toContain(baselineCommitId);
  });

  it("the drifting commit is signed - identity isn't the tell here either", () => {
    const prodCommit = level.graph.commits[level.graph.refs.prod.commitId];
    expect(prodCommit.authorSigned).toBe(true);
  });
});
