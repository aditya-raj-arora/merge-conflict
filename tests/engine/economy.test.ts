import { describe, expect, it } from "vitest";
import {
  computeEarnedDelta,
  computeQuizReward,
  computeStoryReward,
  isChapterTierUnlocked,
  isLevelUnlocked,
  isLevelUnlockedWithTiers,
  REWARD,
  STARTING_BUDGET,
  type LevelProgress,
  type TierDefinition,
} from "../../src/engine/economy";

describe("computeQuizReward", () => {
  it("a correct answer on the very first submission earns the full reward", () => {
    expect(computeQuizReward(0, true)).toBe(REWARD.quizCorrectFirstTry);
  });

  it("a correct answer after prior attempts earns nothing further", () => {
    expect(computeQuizReward(1, true)).toBe(0);
    expect(computeQuizReward(5, true)).toBe(0);
  });

  it("a wrong answer always costs the same amount, regardless of prior attempts", () => {
    expect(computeQuizReward(0, false)).toBe(REWARD.quizIncorrect);
    expect(computeQuizReward(3, false)).toBe(REWARD.quizIncorrect);
  });

  it("the correct-answer reward is strictly positive and the wrong-answer cost is strictly negative", () => {
    expect(REWARD.quizCorrectFirstTry).toBeGreaterThan(0);
    expect(REWARD.quizIncorrect).toBeLessThan(0);
  });
});

describe("computeStoryReward", () => {
  it("ranks good > neutral > bad, with bad being a real loss", () => {
    expect(computeStoryReward("good")).toBe(REWARD.storyGood);
    expect(computeStoryReward("neutral")).toBe(REWARD.storyNeutral);
    expect(computeStoryReward("bad")).toBe(REWARD.storyBad);

    expect(computeStoryReward("good")).toBeGreaterThan(
      computeStoryReward("neutral"),
    );
    expect(computeStoryReward("neutral")).toBeGreaterThan(
      computeStoryReward("bad"),
    );
    expect(computeStoryReward("bad")).toBeLessThan(0);
  });
});

describe("isLevelUnlocked", () => {
  const levelIds = ["a", "b", "c"];

  it("the first level is always unlocked, regardless of progress", () => {
    expect(isLevelUnlocked(levelIds, {}, "a")).toBe(true);
  });

  it("a later level is locked until the immediately preceding one is passed", () => {
    expect(isLevelUnlocked(levelIds, {}, "b")).toBe(false);
    expect(isLevelUnlocked(levelIds, {}, "c")).toBe(false);
  });

  it("a later level unlocks once the immediately preceding one is passed", () => {
    const progress: Record<string, LevelProgress> = {
      a: { passed: true, totalRuns: 1 },
    };
    expect(isLevelUnlocked(levelIds, progress, "b")).toBe(true);
    // c still needs b passed, not just a
    expect(isLevelUnlocked(levelIds, progress, "c")).toBe(false);
  });

  it("passing a level that isn't merely attempted (totalRuns > 0 but not passed) does not unlock the next", () => {
    const progress: Record<string, LevelProgress> = {
      a: { passed: false, totalRuns: 3 },
    };
    expect(isLevelUnlocked(levelIds, progress, "b")).toBe(false);
  });

  it("an id not present in levelIds fails open (never locked by this function)", () => {
    expect(isLevelUnlocked(levelIds, {}, "not-a-real-level")).toBe(true);
  });
});

describe("STARTING_BUDGET", () => {
  it("is a positive number", () => {
    expect(STARTING_BUDGET).toBeGreaterThan(0);
  });
});

describe("computeEarnedDelta (CR-118)", () => {
  it("passes a positive reward through unchanged", () => {
    expect(computeEarnedDelta(1_000)).toBe(1_000);
  });

  it("clamps a negative reward (a loss) to zero", () => {
    expect(computeEarnedDelta(-600)).toBe(0);
    expect(computeEarnedDelta(-400)).toBe(0);
  });

  it("passes zero through as zero", () => {
    expect(computeEarnedDelta(0)).toBe(0);
  });
});

describe("isChapterTierUnlocked (CR-118)", () => {
  const tiers: TierDefinition[] = [
    { name: "Tier A", chapterIds: ["ch-a"], unlockThreshold: 0 },
    { name: "Tier B", chapterIds: ["ch-b"], unlockThreshold: 2_000 },
    { name: "Tier C", chapterIds: ["ch-c"], unlockThreshold: 4_000 },
  ];

  it("the first tier is always unlocked, regardless of totalEarned", () => {
    expect(isChapterTierUnlocked(tiers, 0, "ch-a")).toBe(true);
  });

  it("a later tier is locked until totalEarned meets its threshold", () => {
    expect(isChapterTierUnlocked(tiers, 1_999, "ch-b")).toBe(false);
    expect(isChapterTierUnlocked(tiers, 2_000, "ch-b")).toBe(true);
  });

  it("a tier further out needs its own, higher threshold met", () => {
    expect(isChapterTierUnlocked(tiers, 2_000, "ch-c")).toBe(false);
    expect(isChapterTierUnlocked(tiers, 4_000, "ch-c")).toBe(true);
  });

  it("a chapter not listed in any tier fails open (never locked by this function)", () => {
    expect(isChapterTierUnlocked(tiers, 0, "not-a-real-chapter")).toBe(true);
  });

  it("an empty tier list never locks anything", () => {
    expect(isChapterTierUnlocked([], 0, "ch-b")).toBe(true);
  });
});

describe("isLevelUnlockedWithTiers (CR-118)", () => {
  const entries = [
    { id: "l1", chapterId: "ch-a" },
    { id: "l2", chapterId: "ch-a" },
    { id: "l3", chapterId: "ch-b" },
    { id: "l4", chapterId: "ch-b" },
  ];
  const tiers: TierDefinition[] = [
    { name: "Tier A", chapterIds: ["ch-a"], unlockThreshold: 0 },
    { name: "Tier B", chapterIds: ["ch-b"], unlockThreshold: 2_000 },
  ];

  it("the very first level is always unlocked", () => {
    expect(isLevelUnlockedWithTiers(entries, {}, tiers, 0, "l1")).toBe(true);
  });

  it("a later level in the same chapter still needs the previous one passed, tiers aside", () => {
    expect(isLevelUnlockedWithTiers(entries, {}, tiers, 0, "l2")).toBe(false);
    const progress: Record<string, LevelProgress> = {
      l1: { passed: true, totalRuns: 1 },
    };
    expect(isLevelUnlockedWithTiers(entries, progress, tiers, 0, "l2")).toBe(
      true,
    );
  });

  it("a new tier's first chapter is gated on totalEarned, not on the previous chapter being passed", () => {
    const progress: Record<string, LevelProgress> = {
      l1: { passed: true, totalRuns: 1 },
      l2: { passed: false, totalRuns: 1 }, // l2 never passed
    };
    // Not enough earned yet, even though l2 (immediately before l3) was
    // never passed - money is the only thing that matters here.
    expect(
      isLevelUnlockedWithTiers(entries, progress, tiers, 1_999, "l3"),
    ).toBe(false);
    // Enough earned - l3 unlocks despite l2 never having been passed.
    expect(
      isLevelUnlockedWithTiers(entries, progress, tiers, 2_000, "l3"),
    ).toBe(true);
  });

  it("a level whose chapter isn't first in its tier stays gated on the ordinary sequential rule", () => {
    // l4 is second in ch-b - even with plenty earned, it still needs l3
    // (immediately before it) passed, same as isLevelUnlocked.
    expect(isLevelUnlockedWithTiers(entries, {}, tiers, 10_000, "l4")).toBe(
      false,
    );
    const progress: Record<string, LevelProgress> = {
      l3: { passed: true, totalRuns: 1 },
    };
    expect(
      isLevelUnlockedWithTiers(entries, progress, tiers, 10_000, "l4"),
    ).toBe(true);
  });
});
