import { beforeEach, describe, expect, it } from "vitest";
import { usePlayerStore } from "../../src/state/usePlayerStore";
import { REWARD, STARTING_BUDGET } from "../../src/engine/economy";

beforeEach(() => {
  usePlayerStore.getState().resetProfile();
  localStorage.clear();
});

describe("usePlayerStore", () => {
  it("starts with no name, the starting budget, and no progress", () => {
    const state = usePlayerStore.getState();
    expect(state.name).toBeNull();
    expect(state.budget).toBe(STARTING_BUDGET);
    expect(state.progress).toEqual({});
  });

  it("setName sets the player's name", () => {
    usePlayerStore.getState().setName("Ada");
    expect(usePlayerStore.getState().name).toBe("Ada");
  });

  describe("recordQuizAttempt", () => {
    it("a correct first attempt earns the full reward and passes the level", () => {
      const amount = usePlayerStore.getState().recordQuizAttempt("lvl-1", true);

      expect(amount).toBe(REWARD.quizCorrectFirstTry);
      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.quizCorrectFirstTry);
      expect(state.progress["lvl-1"]).toEqual({
        passed: true,
        totalRuns: 1,
      });
    });

    it("a wrong attempt costs budget and does not pass the level", () => {
      const amount = usePlayerStore
        .getState()
        .recordQuizAttempt("lvl-1", false);

      expect(amount).toBe(REWARD.quizIncorrect);
      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.quizIncorrect);
      expect(state.progress["lvl-1"]).toEqual({
        passed: false,
        totalRuns: 1,
      });
    });

    it("a correct attempt after a prior wrong one still passes the level, but earns nothing further", () => {
      const store = usePlayerStore.getState();
      store.recordQuizAttempt("lvl-1", false);
      const amount = store.recordQuizAttempt("lvl-1", true);

      expect(amount).toBe(0);
      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.quizIncorrect);
      expect(state.progress["lvl-1"]).toEqual({
        passed: true,
        totalRuns: 2,
      });
    });

    it("records lastReward with the level id and amount", () => {
      usePlayerStore.getState().recordQuizAttempt("lvl-1", true);
      expect(usePlayerStore.getState().lastReward).toEqual({
        levelId: "lvl-1",
        amount: REWARD.quizCorrectFirstTry,
      });
    });
  });

  describe("recordStoryEnding", () => {
    it("a good ending earns the full reward and passes the level", () => {
      const amount = usePlayerStore
        .getState()
        .recordStoryEnding("story-1", "good");

      expect(amount).toBe(REWARD.storyGood);
      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.storyGood);
      expect(state.progress["story-1"]).toEqual({
        passed: true,
        totalRuns: 1,
      });
    });

    it("a bad ending costs budget and does not pass the level", () => {
      const amount = usePlayerStore
        .getState()
        .recordStoryEnding("story-1", "bad");

      expect(amount).toBe(REWARD.storyBad);
      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.storyBad);
      expect(state.progress["story-1"].passed).toBe(false);
    });

    it("a neutral ending earns a small reward but does not pass the level", () => {
      const amount = usePlayerStore
        .getState()
        .recordStoryEnding("story-1", "neutral");

      expect(amount).toBe(REWARD.storyNeutral);
      expect(usePlayerStore.getState().progress["story-1"].passed).toBe(false);
    });

    it("replaying to a good ending after already passing still applies the reward again (CR-109 decision 2)", () => {
      const store = usePlayerStore.getState();
      store.recordStoryEnding("story-1", "good");
      store.recordStoryEnding("story-1", "good");

      const state = usePlayerStore.getState();
      expect(state.budget).toBe(STARTING_BUDGET + REWARD.storyGood * 2);
      expect(state.progress["story-1"]).toEqual({
        passed: true,
        totalRuns: 2,
      });
    });

    it("once passed, stays passed even if a later replay ends badly", () => {
      const store = usePlayerStore.getState();
      store.recordStoryEnding("story-1", "good");
      store.recordStoryEnding("story-1", "bad");

      expect(usePlayerStore.getState().progress["story-1"].passed).toBe(true);
    });
  });

  it("resetProfile wipes name, budget, and progress back to defaults", () => {
    const store = usePlayerStore.getState();
    store.setName("Ada");
    store.recordQuizAttempt("lvl-1", true);
    store.resetProfile();

    const state = usePlayerStore.getState();
    expect(state.name).toBeNull();
    expect(state.budget).toBe(STARTING_BUDGET);
    expect(state.progress).toEqual({});
    expect(state.lastReward).toBeNull();
  });

  it("clearLastReward clears lastReward without touching budget/progress", () => {
    const store = usePlayerStore.getState();
    store.recordQuizAttempt("lvl-1", true);
    store.clearLastReward();

    const state = usePlayerStore.getState();
    expect(state.lastReward).toBeNull();
    expect(state.budget).toBe(STARTING_BUDGET + REWARD.quizCorrectFirstTry);
  });

  it("persists to localStorage under the merge-conflict:player key", () => {
    usePlayerStore.getState().setName("Ada");
    const raw = localStorage.getItem("merge-conflict:player");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.name).toBe("Ada");
  });
});
