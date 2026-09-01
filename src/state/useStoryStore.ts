// CSU-03.02.001-SRC-useStoryStore_r2
// Separate from useGameStore on purpose (CR-091) - the 5 existing
// quiz-format levels run entirely through useGameStore/LevelView and
// are untouched by anything in here.
import { create } from "zustand";
import { advance, advanceAuto, type Story } from "../engine/mechanics/story";

interface StoryState {
  story: Story | null;
  currentStageId: string | null;
  selectedChoiceId: string | null;
  loadStory: (story: Story) => void;
  selectChoice: (choiceId: string) => void;
  confirmChoice: () => void;
  /** Advances a narrative-only (autoNext) beat - no choice involved. */
  continueAuto: () => void;
  restart: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  story: null,
  currentStageId: null,
  selectedChoiceId: null,

  loadStory: (story) =>
    set({ story, currentStageId: story.startStageId, selectedChoiceId: null }),

  selectChoice: (choiceId) => set({ selectedChoiceId: choiceId }),

  confirmChoice: () => {
    const { story, currentStageId, selectedChoiceId } = get();
    if (!story || !currentStageId || !selectedChoiceId) return;
    const nextStageId = advance(story, currentStageId, selectedChoiceId);
    set({ currentStageId: nextStageId, selectedChoiceId: null });
  },

  continueAuto: () => {
    const { story, currentStageId } = get();
    if (!story || !currentStageId) return;
    const nextStageId = advanceAuto(story, currentStageId);
    set({ currentStageId: nextStageId, selectedChoiceId: null });
  },

  restart: () => {
    const { story } = get();
    if (!story) return;
    set({ currentStageId: story.startStageId, selectedChoiceId: null });
  },
}));
