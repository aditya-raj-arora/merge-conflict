// CSU-02.01.001-SRC-GraphCanvas_r2
// TLCSC-02-UI: renders a commit graph - nodes, edges, commit messages and
// ref labels - from the pure layout in engine/graph/layout.ts.
//
// CR-119 fixes three separate legibility defects found by a readability
// pass over every graph in the content:
//
//  1. Every <text> was rendered with no `fill`, so it fell back to SVG's
//     default of black - near-invisible on this app's dark background.
//     The circles and edges looked fine only because they used
//     currentColor, which <text> never inherited.
//  2. The SVG was sized from lane/row counts alone, ignoring label width
//     entirely, so long commit messages ran outside the canvas and were
//     clipped by the SVG viewport (the worst real case: a 71-character
//     message needing ~510px inside a 200px-wide canvas). The viewBox is
//     now computed from the actual content bounds, label extents
//     included, and the element scales down to fit its container instead
//     of cropping.
//  3. Labels could land on top of each other in two different ways, both
//     of which occur in real content: refs pointing at the same commit
//     (7 stages, e.g. a baseline tag and `prod` on one commit) drew at
//     identical coordinates, and commits sharing a row (3 stages, up to
//     5 abreast in Chapter 2) drew their messages straight through each
//     other and through neighbouring lanes' ref labels.
//
// The row fix is structural rather than a nudge: every commit now gets
// its own display row, ordered by depth and then lane, so a message can
// never share vertical space with another commit's message or ref. Lanes
// still carry the branching, which is exactly how `git log --graph`
// reads - one commit per line, structure in the columns. layout.ts is
// untouched; depth still decides ordering, it just no longer forces
// commits to share a line.
//
// Text width is estimated rather than measured: SVG can only measure
// after paint, and an estimate is enough to size the canvas and keep
// labels apart. CHAR_WIDTH_EM is deliberately a little generous so the
// estimate errs toward extra room rather than a clipped tail.
import { layoutGraph } from "../engine/graph/layout";
import type { Graph } from "../engine/graph/commitGraph";

const NODE_RADIUS = 10;
const LANE_WIDTH = 60;
const PADDING = 16;
const MESSAGE_FONT = 12;
const REF_FONT = 11;
/** Rough per-character advance width, as a fraction of font size. */
const CHAR_WIDTH_EM = 0.62;
/** Gap between a node's edge and the label beside or above it. */
const LABEL_GAP = 6;
/** Vertical step between refs stacked on one commit. */
const REF_LINE_HEIGHT = 14;
/** Row spacing floor, before allowing for stacked ref labels. */
const MIN_ROW_HEIGHT = 56;

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_EM;
}

export interface GraphCanvasProps {
  graph: Graph;
  /** Commits to highlight. More than one because CR-121's whole point is
   * comparing two of them; the ring is drawn per selected node. */
  selectedCommitIds?: string[];
  /** When given, nodes become real buttons - clickable and keyboard
   * reachable. Omitted, the graph stays a static picture. */
  onSelectCommit?: (commitId: string) => void;
}

export function GraphCanvas({
  graph,
  selectedCommitIds,
  onSelectCommit,
}: GraphCanvasProps) {
  const selected = new Set(selectedCommitIds ?? []);
  const interactive = Boolean(onSelectCommit);
  const layout = layoutGraph(graph);

  // Refs pointing at the same commit stack upward from the node instead
  // of drawing on top of each other.
  const refsByCommit = new Map<string, string[]>();
  for (const ref of Object.values(graph.refs)) {
    const list = refsByCommit.get(ref.commitId);
    if (list) list.push(ref.name);
    else refsByCommit.set(ref.commitId, [ref.name]);
  }

  // Rows have to clear the tallest stack of refs sitting above a node,
  // or a two-ref commit would push its labels into the row above.
  const maxRefsOnACommit = Math.max(
    1,
    ...[...refsByCommit.values()].map((names) => names.length),
  );
  const rowHeight = Math.max(
    MIN_ROW_HEIGHT,
    34 + maxRefsOnACommit * REF_LINE_HEIGHT,
  );

  // One commit per row, oldest at the bottom: depth decides the order,
  // lane breaks ties so the result is stable and matches the columns.
  const displayRow: Record<string, number> = {};
  [...Object.keys(graph.commits)]
    .sort((a, b) => {
      const byDepth = layout.positions[a].y - layout.positions[b].y;
      return byDepth !== 0
        ? byDepth
        : layout.positions[a].x - layout.positions[b].x;
    })
    .forEach((id, i) => {
      displayRow[id] = i;
    });
  const lastRow = Object.keys(graph.commits).length - 1;

  const nodeX = (id: string) => layout.positions[id].x * LANE_WIDTH;
  const nodeY = (id: string) => (lastRow - displayRow[id]) * rowHeight;

  // Content bounds, label extents included, so nothing is ever clipped.
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  const seen = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  for (const commit of Object.values(graph.commits)) {
    const cx = nodeX(commit.id);
    const cy = nodeY(commit.id);
    seen(cx - NODE_RADIUS, cy - NODE_RADIUS);
    seen(cx + NODE_RADIUS, cy + NODE_RADIUS);

    const messageStart = cx + NODE_RADIUS + LABEL_GAP;
    seen(
      messageStart + estimateTextWidth(commit.message, MESSAGE_FONT),
      cy + MESSAGE_FONT / 2,
    );
    seen(messageStart, cy - MESSAGE_FONT / 2);

    const refNames = refsByCommit.get(commit.id) ?? [];
    refNames.forEach((name, i) => {
      const half = estimateTextWidth(name, REF_FONT) / 2;
      const refY =
        cy - NODE_RADIUS - LABEL_GAP - i * REF_LINE_HEIGHT - REF_FONT / 2;
      seen(cx - half, refY - REF_FONT / 2);
      seen(cx + half, refY + REF_FONT / 2);
    });
  }

  const viewX = minX - PADDING;
  const viewY = minY - PADDING;
  const width = maxX - minX + PADDING * 2;
  const height = maxY - minY + PADDING * 2;

  return (
    <svg
      role="img"
      aria-label="Commit graph"
      width={width}
      height={height}
      viewBox={`${viewX} ${viewY} ${width} ${height}`}
      // Intrinsic size above, but never wider than the container - a wide
      // graph scales down instead of overflowing or being cut off.
      className="h-auto max-w-full"
    >
      {layout.edges.map((edge) => (
        <line
          key={`${edge.from}->${edge.to}`}
          x1={nodeX(edge.from)}
          y1={nodeY(edge.from)}
          x2={nodeX(edge.to)}
          y2={nodeY(edge.to)}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={2}
        />
      ))}

      {Object.values(graph.commits).map((c) => {
        const cx = nodeX(c.id);
        const cy = nodeY(c.id);
        const isSelected = selected.has(c.id);
        return (
          <g key={c.id}>
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={NODE_RADIUS + 5}
                fill="none"
                strokeWidth={2}
                className="stroke-sky-300"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={NODE_RADIUS}
              fill={c.authorSigned ? "currentColor" : "transparent"}
              stroke="currentColor"
              strokeWidth={2}
              opacity={isSelected ? 1 : 0.85}
              onClick={interactive ? () => onSelectCommit?.(c.id) : undefined}
              onKeyDown={
                interactive
                  ? (event) => {
                      // SVG shapes given role=button don't get Enter/Space
                      // activation for free the way a <button> does.
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCommit?.(c.id);
                      }
                    }
                  : undefined
              }
              style={{ cursor: interactive ? "pointer" : "default" }}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? isSelected : undefined}
              aria-label={`Commit ${c.id}: ${c.message}`}
            />
            <text
              x={cx + NODE_RADIUS + LABEL_GAP}
              y={cy}
              fontSize={MESSAGE_FONT}
              dominantBaseline="middle"
              fill="currentColor"
              // Clicks on the label should behave like clicks on its node.
              onClick={interactive ? () => onSelectCommit?.(c.id) : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              {c.message}
            </text>
          </g>
        );
      })}

      {[...refsByCommit.entries()].flatMap(([commitId, names]) =>
        names.map((name, i) => (
          <text
            key={name}
            x={nodeX(commitId)}
            y={
              nodeY(commitId) -
              NODE_RADIUS -
              LABEL_GAP -
              i * REF_LINE_HEIGHT -
              REF_FONT / 2
            }
            fontSize={REF_FONT}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
            // Deliberately distinct from the commit-message colour so a
            // ref reads as a label on the graph, not as more history.
            className="fill-sky-300"
          >
            {name}
          </text>
        )),
      )}
    </svg>
  );
}
