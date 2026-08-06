// CSU-01.01.001-SRC-commitGraph_r1
// LLCSC-01-01-GRAPH: the commit-graph model the whole game renders and
// reasons about. Deliberately small - three pure operations, no engine
// magic - because later chapters (merge, CCB, audit, release) all build
// on this same shape rather than inventing their own.

export interface Commit {
  id: string;
  parentIds: string[];
  message: string;
  authorSigned: boolean;
  timestamp: number;
}

export interface Ref {
  name: string;
  commitId: string;
}

export type Head =
  { type: "branch"; name: string } | { type: "detached"; commitId: string };

export interface Graph {
  commits: Record<string, Commit>;
  refs: Record<string, Ref>;
  head: Head;
}

export interface CommitInput {
  id: string;
  message: string;
  authorSigned?: boolean;
  timestamp?: number;
}

/** Creates an empty graph with no commits and no refs, HEAD detached at nothing yet. */
export function createGraph(): Graph {
  return { commits: {}, refs: {}, head: { type: "detached", commitId: "" } };
}

/** Resolves HEAD to the commit id it currently points at, or null if the graph is empty. */
export function resolveHeadCommitId(graph: Graph): string | null {
  if (graph.head.type === "detached") {
    return graph.head.commitId || null;
  }
  return graph.refs[graph.head.name]?.commitId ?? null;
}

/**
 * Creates a new commit whose parent is the current HEAD commit (or no
 * parent, if the graph is empty). Advances HEAD: if HEAD is a branch ref,
 * that ref moves forward; if HEAD is detached, the detached pointer moves.
 */
export function commit(graph: Graph, input: CommitInput): Graph {
  const parentId = resolveHeadCommitId(graph);
  const newCommit: Commit = {
    id: input.id,
    parentIds: parentId ? [parentId] : [],
    message: input.message,
    authorSigned: input.authorSigned ?? false,
    timestamp: input.timestamp ?? 0,
  };

  const commits = { ...graph.commits, [newCommit.id]: newCommit };

  if (graph.head.type === "branch") {
    const refs = {
      ...graph.refs,
      [graph.head.name]: { name: graph.head.name, commitId: newCommit.id },
    };
    return { commits, refs, head: graph.head };
  }

  return {
    commits,
    refs: graph.refs,
    head: { type: "detached", commitId: newCommit.id },
  };
}

/**
 * Creates a new ref (branch) pointing at the current HEAD commit. Does
 * NOT move HEAD - matches `git branch <name>`, not `git checkout -b`.
 */
export function branch(graph: Graph, name: string): Graph {
  const commitId = resolveHeadCommitId(graph);
  if (!commitId) {
    throw new Error("Cannot create a branch: graph has no commits yet.");
  }
  return {
    ...graph,
    refs: { ...graph.refs, [name]: { name, commitId } },
  };
}

/**
 * Moves HEAD to a branch name (if one exists with that name) or a commit
 * id directly (detached HEAD, matching real git checkout semantics).
 */
export function checkout(graph: Graph, target: string): Graph {
  if (graph.refs[target]) {
    return { ...graph, head: { type: "branch", name: target } };
  }
  if (graph.commits[target]) {
    return { ...graph, head: { type: "detached", commitId: target } };
  }
  throw new Error(`Cannot checkout "${target}": no such branch or commit.`);
}
