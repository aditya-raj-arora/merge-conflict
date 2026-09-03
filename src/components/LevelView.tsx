// CSU-02.02.001-SRC-LevelView_r2
// CR-109: submitting an answer now also records the attempt against the
// player's budget/progress (usePlayerStore), independently of
// useGameStore's own in-progress quiz state - useGameStore stays purely
// about the current level's UI state, same as before.
import { useEffect } from "react";
import { useGameStore } from "../state/useGameStore";
import { usePlayerStore } from "../state/usePlayerStore";
import { GraphCanvas } from "./GraphCanvas";
import { evaluateAnswer, type Level } from "../engine/mechanics/level";

export interface LevelViewProps {
  level: Level;
  onBack?: () => void;
}

export function LevelView({ level, onBack }: LevelViewProps) {
  const {
    selectedOptionId,
    result,
    loadLevel,
    selectOption,
    submitAnswer,
    reset,
  } = useGameStore();
  const recordQuizAttempt = usePlayerStore((s) => s.recordQuizAttempt);
  const lastReward = usePlayerStore((s) => s.lastReward);

  useEffect(() => {
    loadLevel(level);
  }, [level, loadLevel]);

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    const correct = evaluateAnswer(level, selectedOptionId);
    submitAnswer();
    recordQuizAttempt(level.id, correct);
  };

  const rewardForThisResult =
    lastReward?.levelId === level.id ? lastReward.amount : null;

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to levels
        </button>
      )}
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
          onClick={handleSubmit}
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
        <div className="mt-4 rounded border border-emerald-600 bg-emerald-950/40 p-4 text-emerald-300">
          <p>{level.narrative.correctDebrief}</p>
          {rewardForThisResult !== null && (
            <p className="mt-2 font-semibold">
              Budget {rewardForThisResult >= 0 ? "+" : ""}
              {rewardForThisResult.toLocaleString()}
            </p>
          )}
        </div>
      )}
      {result === "incorrect" && (
        <div className="mt-4 rounded border border-rose-600 bg-rose-950/40 p-4 text-rose-300">
          <p>{level.narrative.incorrectDebrief}</p>
          {rewardForThisResult !== null && (
            <p className="mt-2 font-semibold">
              Budget {rewardForThisResult >= 0 ? "+" : ""}
              {rewardForThisResult.toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
