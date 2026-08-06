import { describe, expect, it } from "vitest";
import {
  branch,
  checkout,
  commit,
  createGraph,
  resolveHeadCommitId,
} from "../../src/engine/graph/commitGraph";

describe("commitGraph", () => {
  it("commit() creates a root commit with no parents", () => {
    const graph = commit(createGraph(), { id: "c1", message: "init" });
    expect(graph.commits.c1.parentIds).toEqual([]);
    expect(resolveHeadCommitId(graph)).toBe("c1");
  });

  it("commit() chains parentIds and advances detached HEAD", () => {
    let graph = createGraph();
    graph = commit(graph, { id: "c1", message: "init" });
    graph = commit(graph, { id: "c2", message: "second" });

    expect(graph.commits.c2.parentIds).toEqual(["c1"]);
    expect(resolveHeadCommitId(graph)).toBe("c2");
  });

  it("commit() moves a branch ref forward when HEAD is on a branch", () => {
    let graph = createGraph();
    graph = commit(graph, { id: "c1", message: "init" });
    graph = branch(graph, "main");
    graph = checkout(graph, "main");
    graph = commit(graph, { id: "c2", message: "second" });

    expect(graph.refs.main.commitId).toBe("c2");
  });

  it("branch() creates a ref at the current HEAD without moving HEAD", () => {
    let graph = createGraph();
    graph = commit(graph, { id: "c1", message: "init" });
    graph = branch(graph, "feature");

    expect(graph.refs.feature.commitId).toBe("c1");
    expect(graph.head).toEqual({ type: "detached", commitId: "c1" });
  });

  it("branch() throws when the graph has no commits yet", () => {
    expect(() => branch(createGraph(), "main")).toThrow();
  });

  it("checkout() switches HEAD to a branch ref", () => {
    let graph = createGraph();
    graph = commit(graph, { id: "c1", message: "init" });
    graph = branch(graph, "main");
    graph = checkout(graph, "main");

    expect(graph.head).toEqual({ type: "branch", name: "main" });
  });

  it("checkout() switches HEAD to a raw commit id (detached HEAD)", () => {
    let graph = createGraph();
    graph = commit(graph, { id: "c1", message: "init" });
    graph = commit(graph, { id: "c2", message: "second" });
    graph = checkout(graph, "c1");

    expect(graph.head).toEqual({ type: "detached", commitId: "c1" });
    expect(resolveHeadCommitId(graph)).toBe("c1");
  });

  it("checkout() throws for an unknown branch or commit", () => {
    const graph = commit(createGraph(), { id: "c1", message: "init" });
    expect(() => checkout(graph, "nope")).toThrow();
  });

  it("operations do not mutate the input graph (pure)", () => {
    const before = commit(createGraph(), { id: "c1", message: "init" });
    const beforeSnapshot = JSON.parse(JSON.stringify(before));

    commit(before, { id: "c2", message: "second" });
    branch(before, "feature");

    expect(before).toEqual(beforeSnapshot);
  });
});
