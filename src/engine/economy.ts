// CSU-01.02.003-SRC-economy_r1
// LLCSC-01-02-MECHANICS: the budget economy and level-progression rules
// (CR-109). Pure and store/UI-agnostic on purpose, same philosophy as
// level.ts/story.ts - usePlayerStore.ts is the only thing that calls
// this and actually mutates state.
import type { StoryEndingKind } from "./mechanics/story";

/** What the player's company starts with, before any level is played. */
export const STARTING_BUDGET = 10_000;

/** Reward/punishment table. Positive = gain, negative = loss. Tuned so
 * a run of "perfect" choices comfortably grows the budget, a single
 * mistake is a real but recoverable setback, and repeatedly defending a
 * wrong call (the "bad" story endings) genuinely drains it - matching
 * the brief: "a perfect option gives the highest money... for big
 * mistakes, you can also lose money." */
export const REWARD = {
  /** A quiz answered correctly on the very first-ever submission for
   * that level - the "perfect option" case. */
  quizCorrectFirstTry: 1_000,
  /** Any wrong quiz submission, every time it happens. */
  quizIncorrect: -400,
  /** A story ending reached with kind "good". */
  storyGood: 1_000,
  /** A story ending reached with kind "neutral" - recovered from a
   * mistake, but it cost something to get there. */
  storyNeutral: 200,
  /** A story ending reached with kind "bad" - a real loss. */
  storyBad: -600,
} as const;

/** Per-level progress the player store persists. `totalRuns` counts every
 * completed attempt (quiz submission or story ending reached), used to
 * decide quiz reward eligibility - it is not itself a reward amount. */
export interface LevelProgress {
  passed: boolean;
  totalRuns: number;
}

/**
 * The reward/punishment for one quiz submission. Only a correct answer
 * on the very first submission for a level ever earns the full reward
 * (CR-109 decision 4) - a correct answer after a prior wrong attempt on
 * the same level still passes the level, but earns nothing further,
 * since the "perfect" bonus was already forfeited by the earlier
 * mistake. A wrong answer always costs the same amount, every time.
 */
export function computeQuizReward(priorRuns: number, correct: boolean): number {
  if (correct) {
    return priorRuns === 0 ? REWARD.quizCorrectFirstTry : 0;
  }
  return REWARD.quizIncorrect;
}

/**
 * The reward/punishment for reaching one story ending. Unlike the quiz
 * case, this applies every time an ending is reached, including replays
 * of a level already passed (CR-109 decision 2) - "Play again" always
 * has real budget consequences, not just the first time.
 */
export function computeStoryReward(kind: StoryEndingKind): number {
  switch (kind) {
    case "good":
      return REWARD.storyGood;
    case "neutral":
      return REWARD.storyNeutral;
    case "bad":
      return REWARD.storyBad;
  }
}

/**
 * Sequential unlock gate (CR-109): a level is unlocked if it's first in
 * `levelIds`, or the level immediately before it has been passed. An
 * id not present in `levelIds` is never locked by this function - that
 * shouldn't happen for real manifest entries, but failing open here
 * avoids silently hiding a level over what would be a content bug
 * elsewhere.
 */
export function isLevelUnlocked(
  levelIds: string[],
  progress: Record<string, LevelProgress>,
  levelId: string,
): boolean {
  const index = levelIds.indexOf(levelId);
  if (index <= 0) return true;
  const previousId = levelIds[index - 1];
  return progress[previousId]?.passed === true;
}
