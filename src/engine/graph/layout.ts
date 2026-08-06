// CSU-01.01.002-SRC-layout_r1
// Pure layout function separated from the React component so it's
// unit-testable without rendering anything.
import type { Graph } from "./commitGraph";

export interface CommitPosition {
  id: string;
  x: number;
  y: number;
}

export interface GraphLayout {
  positions: Record<string, CommitPosition>;
  edges: Array<{ from: string; to: string }>;
  maxLane: number;
  maxDepth: number;
}

/** Depth = distance from the commit's earliest ancestor (roots are depth 0). */
function computeDepths(graph: Graph): Record<string, number> {
  const depths: Record<string, number> = {};
  const commitIds = Object.keys(graph.commits);

  // Simple fixed-point iteration - fine for the small graphs this game uses.
  let changed = true;
  for (const id of commitIds) depths[id] = 0;
  while (changed) {
    changed = false;
    for (const id of commitIds) {
      const c = graph.commits[id];
      const parentDepths = c.parentIds.map((p) => depths[p] ?? 0);
      const wanted = c.parentIds.length ? Math.max(...parentDepths) + 1 : 0;
      if (wanted > depths[id]) {
        depths[id] = wanted;
        changed = true;
      }
    }
  }
  return depths;
}

/**
 * Assigns each commit a lane (x position). Walks each ref backward along
 * first-parent history, claiming lanes for commits not already claimed by
 * an earlier ref - so shared history collapses onto one lane, like a real
 * commit graph.
 */
function computeLanes(graph: Graph): Record<string, number> {
  const lanes: Record<string, number> = {};
  const refNames = Object.keys(graph.refs).sort();

  refNames.forEach((refName, laneIndex) => {
    let cursor: string | undefined = graph.refs[refName].commitId;
    while (cursor && lanes[cursor] === undefined) {
      lanes[cursor] = laneIndex;
      cursor = graph.commits[cursor]?.parentIds[0];
    }
  });

  // Any commit unreachable from a ref (shouldn't normally happen) gets its own lane.
  let nextLane = refNames.length;
  for (const id of Object.keys(graph.commits)) {
    if (lanes[id] === undefined) lanes[id] = nextLane++;
  }

  return lanes;
}

export function layoutGraph(graph: Graph): GraphLayout {
  const depths = computeDepths(graph);
  const lanes = computeLanes(graph);

  const positions: Record<string, CommitPosition> = {};
  let maxLane = 0;
  let maxDepth = 0;

  for (const id of Object.keys(graph.commits)) {
    const x = lanes[id];
    const y = depths[id];
    positions[id] = { id, x, y };
    maxLane = Math.max(maxLane, x);
    maxDepth = Math.max(maxDepth, y);
  }

  const edges: Array<{ from: string; to: string }> = [];
  for (const c of Object.values(graph.commits)) {
    for (const parentId of c.parentIds) {
      edges.push({ from: parentId, to: c.id });
    }
  }

  return { positions, edges, maxLane, maxDepth };
}
