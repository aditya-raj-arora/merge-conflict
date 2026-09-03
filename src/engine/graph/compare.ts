// CSU-01.01.003-SRC-compare_r1
// LLCSC-01-01-GRAPH: answering "how do these two commits relate?" - the
// single question every audit, status and release chapter actually turns
// on. Added for CR-121, which lets the player run that comparison in the
// graph instead of being told the answer in the narration.
//
// Pure and render-agnostic, same as layout.ts: the component decides how
// to phrase a relation, this decides what the relation is.
import type { Graph } from "./commitGraph";

export type CommitRelation =
  /** The same commit - the refs point at one node. */
  | { kind: "same" }
  /** `a` contains `b` plus `by` further commits. */
  | { kind: "ahead"; by: number }
  /** `b` contains `a` plus `by` further commits. */
  | { kind: "behind"; by: number }
  /** Neither contains the other - separate lines of history. */
  | { kind: "diverged" }
  /** One of the ids isn't in this graph. */
  | { kind: "unknown" };

/**
 * Every commit reachable from `id` by walking parents, `id` included.
 * Returns an empty set for an id that isn't in the graph, so callers can
 * treat "unknown commit" and "reaches nothing" the same way when that's
 * what they want - compareCommits deliberately does not.
 */
export function ancestryOf(graph: Graph, id: string): Set<string> {
  const seen = new Set<string>();
  if (!graph.commits[id]) return seen;

  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const parentId of graph.commits[current]?.parentIds ?? []) {
      if (!seen.has(parentId)) queue.push(parentId);
    }
  }
  return seen;
}

/**
 * How `a` relates to `b`. Distances count commits reachable from one but
 * not the other, the same thing `git rev-list --count b..a` reports - so
 * a merge that brings in several commits counts all of them, not just
 * the steps along one parent chain.
 */
export function compareCommits(
  graph: Graph,
  a: string,
  b: string,
): CommitRelation {
  if (!graph.commits[a] || !graph.commits[b]) return { kind: "unknown" };
  if (a === b) return { kind: "same" };

  const fromA = ancestryOf(graph, a);
  const fromB = ancestryOf(graph, b);

  if (fromA.has(b)) {
    return { kind: "ahead", by: countOnlyIn(fromA, fromB) };
  }
  if (fromB.has(a)) {
    return { kind: "behind", by: countOnlyIn(fromB, fromA) };
  }
  return { kind: "diverged" };
}

function countOnlyIn(larger: Set<string>, smaller: Set<string>): number {
  let count = 0;
  for (const id of larger) if (!smaller.has(id)) count += 1;
  return count;
}

/** The names of every ref pointing at `commitId`, in a stable order. */
export function refsAt(graph: Graph, commitId: string): string[] {
  return Object.values(graph.refs)
    .filter((ref) => ref.commitId === commitId)
    .map((ref) => ref.name)
    .sort();
}
