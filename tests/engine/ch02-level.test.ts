import { describe, expect, it } from "vitest";
import { evaluateAnswer, parseLevel } from "../../src/engine/mechanics/level";
import type { Graph } from "../../src/engine/graph/commitGraph";
import rawLevel from "../../content/chapters/ch02-version-control/LVL-02-01-whose-fix-made-it.json";

/** Full ancestry (all parents, not just parentIds[0]) - what "is this commit
 * actually in the merged history" means once merge commits exist. */
function isAncestor(graph: Graph, candidateId: string, tipId: string): boolean {
  const visited = new Set<string>();
  const stack = [tipId];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === candidateId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    stack.push(...(graph.commits[id]?.parentIds ?? []));
  }
  return false;
}

describe("LVL-02-01-whose-fix-made-it solvability", () => {
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

  it("main's tip has only one parent, despite the merge commit's message", () => {
    const mainTip = level.graph.commits[level.graph.refs.main.commitId];
    expect(mainTip.parentIds).toHaveLength(1);
  });

  it("Priya's fix is an ancestor of main; Sam's is not", () => {
    const mainTipId = level.graph.refs.main.commitId;
    const priyaTipId = level.graph.refs["priya-fix"].commitId;
    const samTipId = level.graph.refs["sam-fix"].commitId;

    expect(isAncestor(level.graph, priyaTipId, mainTipId)).toBe(true);
    expect(isAncestor(level.graph, samTipId, mainTipId)).toBe(false);
  });
});
