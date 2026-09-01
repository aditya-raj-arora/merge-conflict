// CSU-02.04.001-SRC-StoryView_r1
// TLCSC-02-UI: renders a branching Story (CR-091) - one stage at a
// time, a choice moves to a genuinely different stage rather than
// grading right/wrong on the spot. Separate component from LevelView
// on purpose - the 5 quiz-format levels keep using LevelView unchanged.
import { useEffect } from "react";
import { useStoryStore } from "../state/useStoryStore";
import { GraphCanvas } from "./GraphCanvas";
import type { Story } from "../engine/mechanics/story";

export interface StoryViewProps {
  story: Story;
  onBack?: () => void;
}

const ENDING_STYLES = {
  good: "border-emerald-600 bg-emerald-950/40 text-emerald-300",
  bad: "border-rose-600 bg-rose-950/40 text-rose-300",
  neutral: "border-amber-600 bg-amber-950/40 text-amber-300",
} as const;

export function StoryView({ story, onBack }: StoryViewProps) {
  const {
    story: loadedStory,
    currentStageId,
    selectedChoiceId,
    loadStory,
    selectChoice,
    confirmChoice,
    restart,
  } = useStoryStore();

  useEffect(() => {
    loadStory(story);
  }, [story, loadStory]);

  if (loadedStory?.id !== story.id || !currentStageId) {
    return null;
  }

  const stage = story.stages[currentStageId];

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
      <h1 className="text-2xl font-bold">{story.title}</h1>
      <p className="mt-3 whitespace-pre-line text-slate-300">
        {stage.narrative}
      </p>

      {stage.graph && (
        <div className="mt-6 rounded border border-slate-700 bg-slate-800/50 p-4">
          <GraphCanvas graph={stage.graph} />
        </div>
      )}

      {stage.choices && (
        <>
          <p className="mt-6 font-medium">{stage.prompt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stage.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => selectChoice(choice.id)}
                className={`rounded border px-4 py-2 ${
                  selectedChoiceId === choice.id
                    ? "border-sky-400 bg-sky-900/50"
                    : "border-slate-600 hover:border-slate-400"
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={confirmChoice}
            disabled={!selectedChoiceId}
            className="mt-4 rounded bg-sky-600 px-4 py-2 font-medium disabled:opacity-40"
          >
            Continue
          </button>
        </>
      )}

      {stage.ending && (
        <>
          <p
            className={`mt-4 rounded border p-4 ${ENDING_STYLES[stage.ending.kind]}`}
          >
            {stage.ending.debrief}
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-4 rounded border border-slate-600 px-4 py-2"
          >
            Play again
          </button>
        </>
      )}
    </div>
  );
}
