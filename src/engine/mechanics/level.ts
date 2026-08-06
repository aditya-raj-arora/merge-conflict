// CSU-01.02.001-SRC-level_r1
// LLCSC-01-02-MECHANICS: the level model shared by every chapter's
// multiple-choice-over-a-commit-graph puzzles, plus the pure "did they
// get it right" evaluator so it's testable without any UI involved.
import type { Graph } from "../graph/commitGraph";

export interface LevelOption {
  id: string;
  label: string;
}

export interface Level {
  id: string;
  chapterId: string;
  title: string;
  narrative: {
    intro: string;
    correctDebrief: string;
    incorrectDebrief: string;
  };
  graph: Graph;
  prompt: string;
  options: LevelOption[];
  correctOptionId: string;
}

export function evaluateAnswer(level: Level, optionId: string): boolean {
  return optionId === level.correctOptionId;
}

/** Minimal runtime shape-check for level JSON loaded via a static import. */
export function parseLevel(raw: unknown): Level {
  const level = raw as Level;
  if (
    !level ||
    typeof level !== "object" ||
    !level.id ||
    !level.graph ||
    !Array.isArray(level.options) ||
    !level.correctOptionId
  ) {
    throw new Error("Invalid level: missing required fields.");
  }
  return level;
}
