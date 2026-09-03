// CSU-02.04.001-SRC-StoryView_r3
// CR-109: reaching an ending now also records it against the player's
// budget/progress (usePlayerStore), on top of everything below.
// TLCSC-02-UI: renders a branching Story (CR-091) as a visual-novel
// dialogue-box UI (CR-095) - a fixed bottom text panel with a speaker
// name plate and a typewriter reveal, a mood-themed backdrop, and a
// choice menu that only appears once the text finishes revealing.
// Stylized/CSS only, no generated art, per that CR's scope decision.
// Separate component from LevelView on purpose - the 5 quiz-format
// levels keep using LevelView unchanged.
import { useEffect, useRef, useState } from "react";
import { useStoryStore } from "../state/useStoryStore";
import { usePlayerStore } from "../state/usePlayerStore";
import { GraphCanvas } from "./GraphCanvas";
import type { Story, StoryMood } from "../engine/mechanics/story";
import type { ManifestEntry } from "../../content/levelManifest";

export interface StoryViewProps {
  story: Story;
  onBack?: () => void;
  /** The next level in manifest order, if any (CR-111) - only its title
   * is used, to label the shortcut button. */
  nextLevel?: ManifestEntry;
  /** Present only when there's a next level to jump to. */
  onNextLevel?: () => void;
}

const MOOD_BACKDROPS: Record<StoryMood, string> = {
  calm: "from-sky-950 via-slate-900 to-slate-900",
  tense: "from-amber-950 via-slate-900 to-slate-900",
  danger: "from-rose-950 via-slate-900 to-slate-900",
  neutral: "from-slate-950 via-slate-900 to-slate-900",
};

const ENDING_STYLES = {
  good: "border-emerald-600 bg-emerald-950/60 text-emerald-200",
  bad: "border-rose-600 bg-rose-950/60 text-rose-200",
  neutral: "border-amber-600 bg-amber-950/60 text-amber-200",
} as const;

const REVEAL_MS_PER_CHAR = 14;

export function StoryView({
  story,
  onBack,
  nextLevel,
  onNextLevel,
}: StoryViewProps) {
  const {
    story: loadedStory,
    currentStageId,
    selectedChoiceId,
    loadStory,
    selectChoice,
    confirmChoice,
    continueAuto,
    restart,
  } = useStoryStore();

  const recordStoryEnding = usePlayerStore((s) => s.recordStoryEnding);
  const lastReward = usePlayerStore((s) => s.lastReward);

  const [revealedLength, setRevealedLength] = useState(0);
  const [revealedForStageId, setRevealedForStageId] = useState(currentStageId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Which ending-stage arrival has already had a reward recorded for it
   * (CR-109) - cleared whenever the current stage isn't an ending, so
   * replaying back to the very same ending stage id after "Play again"
   * still records again, while a StrictMode double-render of the same
   * arrival doesn't double-apply the reward. */
  const recordedEndingStageRef = useRef<string | null>(null);

  useEffect(() => {
    loadStory(story);
  }, [story, loadStory]);

  // Reset the reveal when the stage actually changes - done during render
  // (React's sanctioned pattern for "state that resets when a key-like
  // value changes"), not inside an effect, so it doesn't cause an extra
  // render-then-setState cascade.
  if (currentStageId !== revealedForStageId) {
    setRevealedForStageId(currentStageId);
    setRevealedLength(0);
  }

  const stage =
    loadedStory?.id === story.id && currentStageId
      ? story.stages[currentStageId]
      : null;

  const fullText = stage
    ? stage.ending
      ? `${stage.narrative}\n\n${stage.ending.debrief}`
      : stage.narrative
    : "";

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!fullText) return;
    intervalRef.current = setInterval(() => {
      setRevealedLength((n) => {
        if (n >= fullText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return n;
        }
        return n + 1;
      });
    }, REVEAL_MS_PER_CHAR);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentStageId, fullText]);

  // Record the ending's reward/punishment exactly once per arrival
  // (CR-109) - not in render phase, since applying a reward is a real
  // mutation with side effects, unlike the reveal-reset above which is
  // pure state.
  useEffect(() => {
    if (!stage?.ending) {
      recordedEndingStageRef.current = null;
      return;
    }
    if (recordedEndingStageRef.current === currentStageId) return;
    recordedEndingStageRef.current = currentStageId;
    recordStoryEnding(story.id, stage.ending.kind);
  }, [currentStageId, stage, story.id, recordStoryEnding]);

  if (!stage) {
    return null;
  }

  const isFullyRevealed = revealedLength >= fullText.length;
  const displayedText = fullText.slice(0, revealedLength);
  const mood = stage.mood ?? "neutral";

  const skipReveal = () => setRevealedLength(fullText.length);

  return (
    <div
      className={`flex min-h-screen flex-col bg-gradient-to-b ${MOOD_BACKDROPS[mood]} text-slate-100 transition-colors duration-700`}
    >
      <div className="mx-auto w-full max-w-2xl flex-1 p-6">
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

        {stage.graph && (
          <div className="mt-6 rounded border border-slate-700 bg-slate-800/50 p-4">
            <GraphCanvas graph={stage.graph} />
          </div>
        )}
      </div>

      <div className="border-t border-slate-700 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl p-6">
          <div className="mb-2 inline-block rounded-t border border-b-0 border-sky-700 bg-sky-950 px-3 py-1 text-xs font-semibold tracking-wide text-sky-300 uppercase">
            {stage.speaker ?? "Narrator"}
          </div>

          <button
            type="button"
            onClick={isFullyRevealed ? undefined : skipReveal}
            className="block w-full cursor-text rounded border border-slate-700 bg-slate-900/60 p-4 text-left whitespace-pre-line"
            aria-label={
              isFullyRevealed ? "Story text" : "Click to skip text reveal"
            }
          >
            {stage.ending ? (
              <>
                <p>{displayedText.slice(0, stage.narrative.length)}</p>
                {revealedLength > stage.narrative.length + 2 && (
                  <p
                    className={`mt-4 rounded border p-3 ${ENDING_STYLES[stage.ending.kind]}`}
                  >
                    {displayedText.slice(stage.narrative.length + 2)}
                  </p>
                )}
              </>
            ) : (
              <p>{displayedText}</p>
            )}
          </button>

          {isFullyRevealed && stage.choices && (
            <>
              <p className="mt-4 font-medium">{stage.prompt}</p>
              <div className="mt-3 flex flex-col gap-2">
                {stage.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => selectChoice(choice.id)}
                    className={`rounded border px-4 py-2 text-left ${
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

          {isFullyRevealed && stage.autoNext && (
            <button
              type="button"
              onClick={continueAuto}
              className="mt-4 animate-pulse rounded border border-slate-600 px-4 py-2 hover:border-slate-400"
            >
              ▼ Continue
            </button>
          )}

          {isFullyRevealed && stage.ending && (
            <>
              {lastReward?.levelId === story.id && (
                <p className="mt-4 font-semibold">
                  Budget {lastReward.amount >= 0 ? "+" : ""}
                  {lastReward.amount.toLocaleString()}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={restart}
                  className="rounded border border-slate-600 px-4 py-2"
                >
                  Play again
                </button>
                {stage.ending.kind === "good" && onNextLevel && nextLevel && (
                  <button
                    type="button"
                    onClick={onNextLevel}
                    className="rounded bg-emerald-600 px-4 py-2 font-medium text-slate-950"
                  >
                    Next Level: {nextLevel.title} →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
