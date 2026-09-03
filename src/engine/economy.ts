// CSU-01.02.003-SRC-economy_r2
// LLCSC-01-02-MECHANICS: the budget economy and level-progression rules
// (CR-109), plus tiered progression (CR-118). Pure and store/UI-agnostic
// on purpose, same philosophy as level.ts/story.ts - usePlayerStore.ts is
// the only thing that calls this and actually mutates state, and content
// (which chapters belong to which tier) lives in content/levelManifest.ts,
// not here - this module only knows the shape of a tier, not any real one.
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

/** How much of one reward/punishment amount counts toward `totalEarned`
 * (CR-118). Only the positive part - a loss (a wrong quiz answer, a bad
 * story ending) still costs real budget, but it never claws back
 * `totalEarned`, which is what tier gates read. That asymmetry is
 * deliberate: `totalEarned` only ever goes up, so a tier that's already
 * unlocked can never re-lock itself because of a later mistake
 * elsewhere - see isChapterTierUnlocked. */
export function computeEarnedDelta(rewardAmount: number): number {
  return Math.max(rewardAmount, 0);
}

/** One rank of chapters (CR-118), e.g. "Foundations" = Chapters 1-2.
 * `chapterIds` lists its member chapters in play order. `unlockThreshold`
 * is the `totalEarned` a player needs before the tier's *first* chapter
 * unlocks - chapters after the first within a tier are still gated the
 * ordinary sequential way (the previous chapter in the tier, passed),
 * not by money again. The first tier in a list should always use
 * threshold 0, since isChapterTierUnlocked treats tier index 0 as
 * always-unlocked regardless of the number given. Content-agnostic on
 * purpose - the actual tier definitions (which chapters, what names,
 * what thresholds) live in content/levelManifest.ts, not here. */
export interface TierDefinition {
  name: string;
  chapterIds: string[];
  unlockThreshold: number;
}

/** Whether `chapterId`'s tier is unlocked, given how much the player has
 * earned in total (CR-118). A chapter that isn't listed in any tier -
 * including every chapter when `tiers` is empty - is never gated by this
 * function, the same fail-open philosophy as isLevelUnlocked: a content
 * gap shouldn't silently hide a chapter. The first tier a chapter could
 * belong to (index 0) is always unlocked, regardless of its
 * `unlockThreshold` - there's nothing to have earned yet at the very
 * start. */
export function isChapterTierUnlocked(
  tiers: TierDefinition[],
  totalEarned: number,
  chapterId: string,
): boolean {
  const tierIndex = tiers.findIndex((t) => t.chapterIds.includes(chapterId));
  if (tierIndex <= 0) return true;
  return totalEarned >= tiers[tierIndex].unlockThreshold;
}

/**
 * The combined unlock gate a real level-select screen actually uses
 * (CR-118): sequential-within-tier by default (same rule as
 * isLevelUnlocked - the previous entry in `levelIds` must be passed),
 * except at the one entry that's actually a tier's entry point - the
 * earliest entry, by manifest order, whose chapter belongs to that tier
 * - where the gate switches to `isChapterTierUnlocked` instead. Crossing
 * into a new tier no longer requires having passed the previous tier's
 * last chapter, only having earned enough. Deliberately keyed off
 * manifest position, not just "is this entry's chapterId the tier's
 * first chapterId" - a tier whose first chapter ever had more than one
 * level in it would otherwise money-gate every level in that chapter,
 * not just the tier's true entry point (real content today has exactly
 * one level per chapter, so this only matters if that ever changes).
 * `entries` only needs `id` and `chapterId` - it isn't `ManifestEntry`
 * itself, so this stays content-agnostic.
 */
export function isLevelUnlockedWithTiers(
  entries: Array<{ id: string; chapterId: string }>,
  progress: Record<string, LevelProgress>,
  tiers: TierDefinition[],
  totalEarned: number,
  levelId: string,
): boolean {
  const levelIds = entries.map((e) => e.id);
  const index = levelIds.indexOf(levelId);
  if (index <= 0) return true;

  const entry = entries[index];
  const tier = tiers.find((t) => t.chapterIds.includes(entry.chapterId));
  if (tier) {
    const tierEntryPointIndex = entries.findIndex((e) =>
      tier.chapterIds.includes(e.chapterId),
    );
    if (tierEntryPointIndex === index) {
      return isChapterTierUnlocked(tiers, totalEarned, entry.chapterId);
    }
  }

  const previousId = levelIds[index - 1];
  return progress[previousId]?.passed === true;
}
