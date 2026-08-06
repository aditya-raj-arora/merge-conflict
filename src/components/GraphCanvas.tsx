// CSU-02.01.001-SRC-GraphCanvas_r1
import { layoutGraph } from "../engine/graph/layout";
import type { Graph } from "../engine/graph/commitGraph";

const NODE_RADIUS = 10;
const LANE_WIDTH = 60;
const ROW_HEIGHT = 60;
const PADDING = 40;

export interface GraphCanvasProps {
  graph: Graph;
  selectedCommitId?: string | null;
  onSelectCommit?: (commitId: string) => void;
}

export function GraphCanvas({
  graph,
  selectedCommitId,
  onSelectCommit,
}: GraphCanvasProps) {
  const layout = layoutGraph(graph);
  const width = PADDING * 2 + (layout.maxLane + 1) * LANE_WIDTH;
  const height = PADDING * 2 + (layout.maxDepth + 1) * ROW_HEIGHT;

  const coord = (id: string) => {
    const p = layout.positions[id];
    return {
      cx: PADDING + p.x * LANE_WIDTH,
      cy: height - PADDING - p.y * ROW_HEIGHT,
    };
  };

  return (
    <svg
      role="img"
      aria-label="Commit graph"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {layout.edges.map((edge) => {
        const from = coord(edge.from);
        const to = coord(edge.to);
        return (
          <line
            key={`${edge.from}->${edge.to}`}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            stroke="currentColor"
            strokeOpacity={0.4}
            strokeWidth={2}
          />
        );
      })}

      {Object.values(graph.commits).map((c) => {
        const { cx, cy } = coord(c.id);
        const isSelected = selectedCommitId === c.id;
        return (
          <g key={c.id}>
            <circle
              cx={cx}
              cy={cy}
              r={NODE_RADIUS}
              fill={c.authorSigned ? "currentColor" : "transparent"}
              stroke="currentColor"
              strokeWidth={2}
              opacity={isSelected ? 1 : 0.85}
              onClick={() => onSelectCommit?.(c.id)}
              style={{ cursor: onSelectCommit ? "pointer" : "default" }}
              role={onSelectCommit ? "button" : undefined}
              aria-label={`Commit ${c.id}: ${c.message}`}
            />
            <text x={cx + NODE_RADIUS + 6} y={cy + 4} fontSize={12}>
              {c.message}
            </text>
          </g>
        );
      })}

      {Object.values(graph.refs).map((ref) => {
        const { cx, cy } = coord(ref.commitId);
        return (
          <text
            key={ref.name}
            x={cx}
            y={cy - NODE_RADIUS - 6}
            fontSize={11}
            fontWeight={600}
            textAnchor="middle"
          >
            {ref.name}
          </text>
        );
      })}
    </svg>
  );
}
