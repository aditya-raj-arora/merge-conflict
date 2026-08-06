// CSU-03.01.001-SRC-useGameStore_r1
import { create } from "zustand";
import { evaluateAnswer, type Level } from "../engine/mechanics/level";

export type AnswerResult = "correct" | "incorrect" | null;

interface GameState {
  level: Level | null;
  selectedOptionId: string | null;
  result: AnswerResult;
  loadLevel: (level: Level) => void;
  selectOption: (optionId: string) => void;
  submitAnswer: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  selectedOptionId: null,
  result: null,

  loadLevel: (level) => set({ level, selectedOptionId: null, result: null }),

  selectOption: (optionId) => set({ selectedOptionId: optionId }),

  submitAnswer: () => {
    const { level, selectedOptionId } = get();
    if (!level || !selectedOptionId) return;
    const correct = evaluateAnswer(level, selectedOptionId);
    set({ result: correct ? "correct" : "incorrect" });
  },

  reset: () => set({ selectedOptionId: null, result: null }),
}));
