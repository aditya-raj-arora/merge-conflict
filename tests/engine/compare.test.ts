import { describe, expect, it } from "vitest";
import {
  ancestryOf,
  compareCommits,
  refsAt,
} from "../../src/engine/graph/compare";
import type { Graph } from "../../src/engine/graph/commitGraph";

function commit(id: string, parentIds: string[] = []) {
  return {
    id,
    parentIds,
    message: `commit ${id}`,
    authorSigned: true,
    timestamp: 0,
  };
}

/** c1 <- c2 <- c3, with a side branch s1 off c1, and a merge m1 of c3+s1. */
const graph: Graph = {
  commits: {
    c1: commit("c1"),
    c2: commit("c2", ["c1"]),
    c3: commit("c3", ["c2"]),
    s1: commit("s1", ["c1"]),
    m1: commit("m1", ["c3", "s1"]),
  },
  refs: {
    main: { name: "main", commitId: "c3" },
    prod: { name: "prod", commitId: "c1" },
    "BL-01": { name: "BL-01", commitId: "c1" },
    side: { name: "side", commitId: "s1" },
  },
  head: { type: "branch", name: "main" },
};

describe("ancestryOf", () => {
  it("includes the commit itself", () => {
    expect(ancestryOf(graph, "c1")).toEqual(new Set(["c1"]));
  });

  it("walks the whole parent chain", () => {
    expect(ancestryOf(graph, "c3")).toEqual(new Set(["c3", "c2", "c1"]));
  });

  it("follows every parent of a merge, not just the first", () => {
    expect(ancestryOf(graph, "m1")).toEqual(
      new Set(["m1", "c3", "c2", "c1", "s1"]),
    );
  });

  it("returns nothing for a commit that isn't in the graph", () => {
    expect(ancestryOf(graph, "nope")).toEqual(new Set());
  });
});

describe("compareCommits", () => {
  it("reports the same commit as same - the shape a compliant baseline has", () => {
    expect(compareCommits(graph, "c1", "c1")).toEqual({ kind: "same" });
  });

  it("counts how far ahead one commit is", () => {
    expect(compareCommits(graph, "c3", "c1")).toEqual({ kind: "ahead", by: 2 });
    expect(compareCommits(graph, "c2", "c1")).toEqual({ kind: "ahead", by: 1 });
  });

  it("counts how far behind one commit is", () => {
    expect(compareCommits(graph, "c1", "c3")).toEqual({
      kind: "behind",
      by: 2,
    });
  });

  it("counts everything a merge brought in, not just one parent chain", () => {
    // m1 adds itself, c3, c2 and s1 on top of c1.
    expect(compareCommits(graph, "m1", "c1")).toEqual({ kind: "ahead", by: 4 });
    // Against c3, the merge adds only itself and the side branch.
    expect(compareCommits(graph, "m1", "c3")).toEqual({ kind: "ahead", by: 2 });
  });

  it("reports separate lines of history as diverged", () => {
    expect(compareCommits(graph, "s1", "c3")).toEqual({ kind: "diverged" });
    expect(compareCommits(graph, "c3", "s1")).toEqual({ kind: "diverged" });
  });

  it("is symmetric: ahead one way is behind the other, by the same count", () => {
    const forward = compareCommits(graph, "c3", "c1");
    const backward = compareCommits(graph, "c1", "c3");
    expect(forward).toEqual({ kind: "ahead", by: 2 });
    expect(backward).toEqual({ kind: "behind", by: 2 });
  });

  it("reports unknown for an id that isn't in the graph", () => {
    expect(compareCommits(graph, "c1", "nope")).toEqual({ kind: "unknown" });
    expect(compareCommits(graph, "nope", "c1")).toEqual({ kind: "unknown" });
  });
});

describe("refsAt", () => {
  it("lists every ref on a commit, sorted", () => {
    expect(refsAt(graph, "c1")).toEqual(["BL-01", "prod"]);
  });

  it("returns an empty list for a commit with no refs", () => {
    expect(refsAt(graph, "c2")).toEqual([]);
  });
});
