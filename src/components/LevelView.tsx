// CSU-02.02.001-SRC-LevelView_r1
import { useEffect } from "react";
import { useGameStore } from "../state/useGameStore";
import { GraphCanvas } from "./GraphCanvas";
import type { Level } from "../engine/mechanics/level";

export interface LevelViewProps {
  level: Level;
}

export function LevelView({ level }: LevelViewProps) {
  const {
    selectedOptionId,
    result,
    loadLevel,
    selectOption,
    submitAnswer,
    reset,
  } = useGameStore();

  useEffect(() => {
    loadLevel(level);
  }, [level, loadLevel]);

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      <h1 className="text-2xl font-bold">{level.title}</h1>
      <p className="mt-3 text-slate-300">{level.narrative.intro}</p>

      <div className="mt-6 rounded border border-slate-700 bg-slate-800/50 p-4">
        <GraphCanvas graph={level.graph} />
      </div>

      <p className="mt-6 font-medium">{level.prompt}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {level.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => selectOption(option.id)}
            className={`rounded border px-4 py-2 ${
              selectedOptionId === option.id
                ? "border-sky-400 bg-sky-900/50"
                : "border-slate-600 hover:border-slate-400"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={submitAnswer}
          disabled={!selectedOptionId}
          className="rounded bg-sky-600 px-4 py-2 font-medium disabled:opacity-40"
        >
          Submit
        </button>
        {result && (
          <button
            type="button"
            onClick={reset}
            className="rounded border border-slate-600 px-4 py-2"
          >
            Try again
          </button>
        )}
      </div>

      {result === "correct" && (
        <p className="mt-4 rounded border border-emerald-600 bg-emerald-950/40 p-4 text-emerald-300">
          {level.narrative.correctDebrief}
        </p>
      )}
      {result === "incorrect" && (
        <p className="mt-4 rounded border border-rose-600 bg-rose-950/40 p-4 text-rose-300">
          {level.narrative.incorrectDebrief}
        </p>
      )}
    </div>
  );
}
