// CSU-03.03.001-SRC-usePlayerStore_r1
// TLCSC-03-STATE: the player's profile - name, budget, and per-level
// progress (CR-109). Persisted to localStorage only, via zustand's
// `persist` middleware; nothing here ever leaves the browser. Separate
// from useGameStore/useStoryStore on purpose - those two hold the
// in-progress state of whichever level is currently open, this one
// holds state that outlives any single level and survives a reload.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  computeQuizReward,
  computeStoryReward,
  STARTING_BUDGET,
  type LevelProgress,
} from "../engine/economy";
import type { StoryEndingKind } from "../engine/mechanics/story";

/** The last reward/punishment applied, so a view can show "+1,000" or
 * "-400" right after a submission/ending without recomputing it. Reset
 * to null on loadLevel/loadStory so a freshly-opened level doesn't show
 * a stale delta from whatever was played before it. */
interface LastReward {
  levelId: string;
  amount: number;
}

interface PlayerState {
  name: string | null;
  budget: number;
  progress: Record<string, LevelProgress>;
  lastReward: LastReward | null;

  setName: (name: string) => void;

  /** Records one quiz submission's outcome for `levelId`, updates the
   * budget, and marks the level passed if correct. Returns the amount
   * applied, so the caller doesn't need to re-derive it. */
  recordQuizAttempt: (levelId: string, correct: boolean) => number;

  /** Records one story ending reached for `levelId`, updates the
   * budget, and marks the level passed if the ending is "good". Returns
   * the amount applied. */
  recordStoryEnding: (levelId: string, kind: StoryEndingKind) => number;

  clearLastReward: () => void;

  /** Wipes the whole save - name, budget, and all progress. Not exposed
   * in the UI yet (CR-109 explicitly left a reset UI out of scope); it
   * exists so tests don't have to reach into localStorage directly. */
  resetProfile: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      name: null,
      budget: STARTING_BUDGET,
      progress: {},
      lastReward: null,

      setName: (name) => set({ name }),

      recordQuizAttempt: (levelId, correct) => {
        const { progress, budget } = get();
        const entry = progress[levelId] ?? { passed: false, totalRuns: 0 };
        const amount = computeQuizReward(entry.totalRuns, correct);
        set({
          budget: budget + amount,
          progress: {
            ...progress,
            [levelId]: {
              passed: entry.passed || correct,
              totalRuns: entry.totalRuns + 1,
            },
          },
          lastReward: { levelId, amount },
        });
        return amount;
      },

      recordStoryEnding: (levelId, kind) => {
        const { progress, budget } = get();
        const entry = progress[levelId] ?? { passed: false, totalRuns: 0 };
        const amount = computeStoryReward(kind);
        set({
          budget: budget + amount,
          progress: {
            ...progress,
            [levelId]: {
              passed: entry.passed || kind === "good",
              totalRuns: entry.totalRuns + 1,
            },
          },
          lastReward: { levelId, amount },
        });
        return amount;
      },

      clearLastReward: () => set({ lastReward: null }),

      resetProfile: () =>
        set({
          name: null,
          budget: STARTING_BUDGET,
          progress: {},
          lastReward: null,
        }),
    }),
    { name: "merge-conflict:player" },
  ),
);
