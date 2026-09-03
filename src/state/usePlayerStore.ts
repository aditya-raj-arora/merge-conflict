// CSU-03.03.001-SRC-usePlayerStore_r3
// TLCSC-03-STATE: the player's profile - name, budget, and per-level
// progress (CR-109), the last level they had open (CR-111), and total
// lifetime earnings for tier gating (CR-118). Persisted to localStorage
// only, via zustand's `persist` middleware; nothing here ever leaves the
// browser. Separate from useGameStore/useStoryStore on purpose - those
// two hold the in-progress state of whichever level is currently open,
// this one holds state that outlives any single level and survives a
// reload.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  computeEarnedDelta,
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
  /** Cumulative sum of the positive part of every reward ever applied
   * (CR-118) - unlike `budget`, this never decreases, even when a
   * mistake costs real budget. Tier gates (isChapterTierUnlocked) read
   * this instead of `budget`, specifically so a tier that's already
   * unlocked can't re-lock itself because of a later bad ending
   * elsewhere. Purely a gate input; not shown to the player as its own
   * number anywhere but the tier-progress hint on level select. */
  totalEarned: number;
  progress: Record<string, LevelProgress>;
  lastReward: LastReward | null;
  /** The manifest id of the level most recently opened, so a returning
   * player's title screen can say "Continue - last played: X" (CR-111).
   * Purely informational - it doesn't gate or change anything else. */
  lastPlayedLevelId: string | null;

  setName: (name: string) => void;

  setLastPlayedLevel: (levelId: string) => void;

  /** Records one quiz submission's outcome for `levelId`, updates the
   * budget, and marks the level passed if correct. Returns the amount
   * applied, so the caller doesn't need to re-derive it. */
  recordQuizAttempt: (levelId: string, correct: boolean) => number;

  /** Records one story ending reached for `levelId`, updates the
   * budget, and marks the level passed if the ending is "good". Returns
   * the amount applied. */
  recordStoryEnding: (levelId: string, kind: StoryEndingKind) => number;

  clearLastReward: () => void;

  /** Wipes the whole save - name, budget, progress, and last-played
   * level. Exposed in the UI as LevelSelect's "Reset progress" (CR-110)
   * and the title screen's "New Game" (CR-111). */
  resetProfile: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      name: null,
      budget: STARTING_BUDGET,
      totalEarned: 0,
      progress: {},
      lastReward: null,
      lastPlayedLevelId: null,

      setName: (name) => set({ name }),

      setLastPlayedLevel: (levelId) => set({ lastPlayedLevelId: levelId }),

      recordQuizAttempt: (levelId, correct) => {
        const { progress, budget, totalEarned } = get();
        const entry = progress[levelId] ?? { passed: false, totalRuns: 0 };
        const amount = computeQuizReward(entry.totalRuns, correct);
        set({
          budget: budget + amount,
          totalEarned: totalEarned + computeEarnedDelta(amount),
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
        const { progress, budget, totalEarned } = get();
        const entry = progress[levelId] ?? { passed: false, totalRuns: 0 };
        const amount = computeStoryReward(kind);
        set({
          budget: budget + amount,
          totalEarned: totalEarned + computeEarnedDelta(amount),
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
          totalEarned: 0,
          progress: {},
          lastReward: null,
          lastPlayedLevelId: null,
        }),
    }),
    { name: "merge-conflict:player" },
  ),
);
