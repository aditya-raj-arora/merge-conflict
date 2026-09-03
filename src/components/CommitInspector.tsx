// CSU-02.07.001-SRC-CommitInspector_r1
// TLCSC-02-UI: the panel under a story's graph (CR-121). Picking one
// commit shows what it actually is; picking two runs the comparison the
// chapter is asking about - "is prod still the commit the baseline
// names?" - and states the answer in terms of the refs involved.
//
// This exists because the graph used to be decorative: the narration
// reported the finding, so a player could clear every chapter without
// reading the graph once. CR-120 took the finding out of the prose; this
// gives the player the tool to establish it themselves. Deliberately
// reports the *relationship* and never the verdict - whether "1 commit
// ahead" counts as drift is the question the player is being paid to
// answer.
import type { Graph } from "../engine/graph/commitGraph";
import { compareCommits, refsAt } from "../engine/graph/compare";

export interface CommitInspectorProps {
  graph: Graph;
  selectedCommitIds: string[];
  onClear: () => void;
}

/** Prefer a ref name - "prod", "BL-01" - over a raw id, since that's how
 * the question is always phrased. Falls back to the id for a commit no
 * ref points at. */
function nameOf(graph: Graph, commitId: string): string {
  const refs = refsAt(graph, commitId);
  return refs.length > 0 ? refs.join(" / ") : commitId;
}

function relationSentence(graph: Graph, a: string, b: string): string {
  const relation = compareCommits(graph, a, b);
  const left = nameOf(graph, a);
  const right = nameOf(graph, b);

  switch (relation.kind) {
    case "same":
      return `${left} and ${right} are the same commit.`;
    case "ahead":
      return `${left} is ${relation.by} commit${
        relation.by === 1 ? "" : "s"
      } ahead of ${right}.`;
    case "behind":
      return `${left} is ${relation.by} commit${
        relation.by === 1 ? "" : "s"
      } behind ${right}.`;
    case "diverged":
      return `${left} and ${right} are on separate lines of history - neither contains the other.`;
    case "unknown":
      return "One of those commits isn't in this graph.";
  }
}

export function CommitInspector({
  graph,
  selectedCommitIds,
  onClear,
}: CommitInspectorProps) {
  const selected = selectedCommitIds.filter((id) => graph.commits[id]);

  if (selected.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-400">
        Click a commit to inspect it. Pick two to compare them.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded border border-slate-700 bg-slate-900/60 p-3">
      <ul className="flex flex-col gap-2">
        {selected.map((id) => {
          const commit = graph.commits[id];
          const refs = refsAt(graph, id);
          return (
            <li key={id} className="text-sm">
              <div className="flex flex-wrap items-baseline gap-2">
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
                  {id}
                </code>
                {refs.map((name) => (
                  <span
                    key={name}
                    className="rounded bg-sky-950 px-1.5 py-0.5 text-xs font-semibold text-sky-300"
                  >
                    {name}
                  </span>
                ))}
                <span
                  className={
                    commit.authorSigned
                      ? "text-xs text-emerald-400"
                      : "text-xs text-amber-400"
                  }
                >
                  {commit.authorSigned ? "signed" : "unsigned"}
                </span>
              </div>
              <p className="mt-1 text-slate-200">{commit.message}</p>
            </li>
          );
        })}
      </ul>

      {selected.length === 2 && (
        <p className="mt-3 border-t border-slate-700 pt-3 text-sm font-medium text-sky-200">
          {relationSentence(graph, selected[0], selected[1])}
        </p>
      )}

      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-xs text-slate-500 hover:text-slate-300"
      >
        Clear selection
      </button>
    </div>
  );
}
