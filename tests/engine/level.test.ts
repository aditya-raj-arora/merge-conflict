import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import type { Commit } from "../../src/engine/graph/commitGraph";
import rawLevel from "../../content/chapters/ch01-identification/LVL-01-01-which-one-shipped.json";

describe("LVL-01-01-which-one-shipped solvability", () => {
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

  it("the correct build's tip commit is fully signed history back to root", () => {
    const tipId = level.graph.refs[level.correctOptionId].commitId;
    let cursor: string | undefined = tipId;
    while (cursor) {
      const c: Commit = level.graph.commits[cursor];
      expect(c.authorSigned).toBe(true);
      cursor = c.parentIds[0];
    }
  });
});
