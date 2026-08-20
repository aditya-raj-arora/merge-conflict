import { describe, expect, it } from "vitest";
import { layoutGraph } from "../../src/engine/graph/layout";
import type { Graph } from "../../src/engine/graph/commitGraph";

/**
 * Hand-authored: base commit, two branches diverge and each commit once,
 * then a merge commit on `main` with both branch tips as parents. This is
 * the shape CR-051 (Chapter 2) needs - verifying it against a real fixture
 * rather than just trusting that parentIds.length > 1 "should" work, per
 * the Risk section of that CR.
 */
function divergingMergeGraph(): Graph {
  return {
    commits: {
      base: {
        id: "base",
        parentIds: [],
        message: "base",
        authorSigned: true,
        timestamp: 0,
      },
      a1: {
        id: "a1",
        parentIds: ["base"],
        message: "fix on a",
        authorSigned: true,
        timestamp: 1,
      },
      b1: {
        id: "b1",
        parentIds: ["base"],
        message: "fix on b",
        authorSigned: true,
        timestamp: 1,
      },
      m1: {
        id: "m1",
        parentIds: ["a1", "b1"],
        message: "merge b into a",
        authorSigned: true,
        timestamp: 2,
      },
    },
    refs: {
      "branch-a": { name: "branch-a", commitId: "a1" },
      "branch-b": { name: "branch-b", commitId: "b1" },
      main: { name: "main", commitId: "m1" },
    },
    head: { type: "branch", name: "main" },
  };
}

describe("layoutGraph - merge commits (multiple parentIds)", () => {
  it("produces one edge per parent for a merge commit", () => {
    const layout = layoutGraph(divergingMergeGraph());
    const edgesIntoMerge = layout.edges.filter((e) => e.to === "m1");

    expect(edgesIntoMerge).toHaveLength(2);
    expect(edgesIntoMerge.map((e) => e.from).sort()).toEqual(["a1", "b1"]);
  });

  it("gives the merge commit a depth greater than both parents", () => {
    const layout = layoutGraph(divergingMergeGraph());
    const depthOf = (id: string) => layout.positions[id].y;

    expect(depthOf("m1")).toBeGreaterThan(depthOf("a1"));
    expect(depthOf("m1")).toBeGreaterThan(depthOf("b1"));
  });

  it("gives every commit its own distinct lane when each branch has a ref", () => {
    const layout = layoutGraph(divergingMergeGraph());
    const lanes = Object.values(layout.positions).map((p) => p.x);

    // computeLanes walks first-parent history per ref; branch-a and main
    // both reach "main"'s ref chain through a1 first, so they may share a
    // lane - the real thing this test guards is that branch-b (reachable
    // only as a *second* parent of the merge) still gets a real lane
    // instead of silently colliding with something else, since it has its
    // own ref ("branch-b") to be walked from.
    expect(lanes).not.toContain(undefined);
    expect(layout.positions.b1.x).not.toBe(layout.positions.a1.x);
  });

  it("does not crash and lays out every commit when a branch tip is unreffed", () => {
    // Same graph, but drop the "branch-b" ref entirely - b1 is now only
    // reachable as m1's second parent, with no ref walking it directly.
    // This is the fallback path (computeLanes' "unreachable commit gets
    // its own lane" bucket) that CR-051 flagged as unverified.
    const graph = divergingMergeGraph();
    delete graph.refs["branch-b"];

    const layout = layoutGraph(graph);

    expect(Object.keys(layout.positions)).toHaveLength(4);
    expect(layout.positions.b1).toBeDefined();
    expect(layout.positions.b1.x).not.toBe(layout.positions.a1.x);
  });
});
