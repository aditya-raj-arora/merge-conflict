import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import rawLevel from "../../content/chapters/ch04-status-accounting/LVL-04-01-whats-actually-live.json";

describe("LVL-04-01-whats-actually-live solvability", () => {
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

  it("prod's ref does not point at any tagged release commit", () => {
    const prodCommitId = level.graph.refs.prod.commitId;
    const taggedCommitIds = new Set(
      ["v1.4.0", "v1.4.1", "v1.4.2"].map(
        (tag) => level.graph.refs[tag].commitId,
      ),
    );

    expect(taggedCommitIds.has(prodCommitId)).toBe(false);
  });

  it("the claimed v1.4.2 tag is not an ancestor of prod's actual ref", () => {
    // prod rolled back to v1.4.1's line, not forward from v1.4.2 - so
    // v1.4.2 shouldn't show up anywhere in prod's own parent chain.
    const claimedTagCommitId = level.graph.refs["v1.4.2"].commitId;
    let cursor: string | undefined = level.graph.refs.prod.commitId;
    const ancestryIds: string[] = [];
    while (cursor) {
      ancestryIds.push(cursor);
      cursor = level.graph.commits[cursor]?.parentIds[0];
    }

    expect(ancestryIds).not.toContain(claimedTagCommitId);
  });
});
