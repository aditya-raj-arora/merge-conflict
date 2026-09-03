import { describe, expect, it } from "vitest";
import {
  computeQuizReward,
  computeStoryReward,
  isLevelUnlocked,
  REWARD,
  STARTING_BUDGET,
  type LevelProgress,
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
