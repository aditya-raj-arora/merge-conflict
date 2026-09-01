import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import rawLevel from "../../content/chapters/ch06-build-release/LVL-06-01-which-tag-lied.json";

describe("LVL-06-01-which-tag-lied solvability", () => {
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

  it("only the mislabeled tag's commit declares a breaking change", () => {
    const breakingChangePattern = /^feat!:/;
    const tagNames = ["v1.0.0", "v1.0.1", "v1.0.2"];

    const breakingTags = tagNames.filter((tag) => {
      const commitId = level.graph.refs[tag].commitId;
      return breakingChangePattern.test(level.graph.commits[commitId].message);
    });

    expect(breakingTags).toEqual([level.correctOptionId]);
  });

  it("the mislabeled tag's version number is a PATCH bump, not a MAJOR bump", () => {
    // v1.0.1 -> v1.0.2 is a patch-level bump by the tag name alone, even
    // though the commit it points to declares a breaking change.
    expect(level.correctOptionId).toBe("v1.0.2");
    expect(level.graph.refs["v1.0.1"]).toBeDefined();
  });

  it("the mislabeled commit is properly signed - identity isn't the tell", () => {
    const commitId = level.graph.refs[level.correctOptionId].commitId;
    expect(level.graph.commits[commitId].authorSigned).toBe(true);
  });
});
