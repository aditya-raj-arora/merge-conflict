// CSU-01.02.002-SRC-story_r2
// LLCSC-01-02-MECHANICS: a branching, multi-stage story - a choice
// doesn't just get graded right/wrong, it moves the player to a
// genuinely different stage with its own consequences and, eventually,
// its own ending. Additive alongside level.ts's single-question
// mechanic (CR-091) - existing quiz-format levels are untouched.
import type { Graph } from "../graph/commitGraph";

export interface StoryChoice {
  id: string;
  label: string;
  /** The stage this choice leads to - the actual branching mechanism. */
  nextStageId: string;
}

export interface StoryEnding {
  kind: "good" | "bad" | "neutral";
  debrief: string;
}

/** Drives StoryView's backdrop theme (CR-095) - purely presentational,
 * the engine never reasons about mood. */
export type StoryMood = "calm" | "tense" | "danger" | "neutral";

export interface StoryStage {
  id: string;
  narrative: string;
  /** Who's "speaking" this beat - e.g. "Narrator", "You", "Teammate".
   * Optional; StoryView falls back to "Narrator" if omitted. */
  speaker?: string;
  /** Backdrop theme for this beat (CR-095). Optional; falls back to
   * "neutral" if omitted. */
  mood?: StoryMood;
  /** Optional - a narrative-only stage (no new graph info) can omit this. */
  graph?: Graph;
  /** The question posed this stage, if any (absent on ending/autoNext stages). */
  prompt?: string;
  /** Present only on a stage with a real decision point. */
  choices?: StoryChoice[];
  /** Present only on a narrative-only beat with no decision - click to
   * continue straight to exactly one next stage (CR-095). Mutually
   * exclusive with `choices` and `ending`. This is how a path gets more
   * depth without inventing a decision at every single stage. */
  autoNext?: string;
  /** Present only on a terminal stage - mutually exclusive with
   * `choices` and `autoNext`. */
  ending?: StoryEnding;
}

export interface Story {
  id: string;
  chapterId: string;
  title: string;
  startStageId: string;
  stages: Record<string, StoryStage>;
}

/** Pure: given the story, the current stage id, and a chosen choice id,
 * returns the next stage id. Throws if the stage or choice doesn't exist -
 * a broken reference here is a content bug, not a recoverable state. */
export function advance(
  story: Story,
  currentStageId: string,
  choiceId: string,
): string {
  const stage = story.stages[currentStageId];
  if (!stage) {
    throw new Error(`Unknown stage: "${currentStageId}".`);
  }
  const choice = stage.choices?.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Stage "${currentStageId}" has no choice "${choiceId}".`);
  }
  return choice.nextStageId;
}

/** Pure: given the story and the current stage id, returns the single
 * next stage id for a narrative-only (autoNext) beat. Mirrors advance()
 * for the no-real-choice case. Throws if the stage has no autoNext. */
export function advanceAuto(story: Story, currentStageId: string): string {
  const stage = story.stages[currentStageId];
  if (!stage) {
    throw new Error(`Unknown stage: "${currentStageId}".`);
  }
  if (!stage.autoNext) {
    throw new Error(`Stage "${currentStageId}" has no autoNext.`);
  }
  return stage.autoNext;
}

export interface StoryStructuralIssue {
  type:
    | "malformed-stage"
    | "dangling-next-stage"
    | "unreachable-stage"
    | "no-good-ending";
  detail: string;
}

/**
 * Structural validity, not "one correct answer" - a Story has no single
 * correct answer by design. Checks: every stage has exactly one of
 * choices/ending/autoNext, every nextStageId and autoNext target
 * resolves, every stage is reachable from startStageId, and at least
 * one reachable ending is "good". See SPEC-story-schema-v1.0.md's
 * Solvability testing section.
 */
export function validateStoryStructure(story: Story): StoryStructuralIssue[] {
  const issues: StoryStructuralIssue[] = [];

  for (const stage of Object.values(story.stages)) {
    const hasChoices = Boolean(stage.choices && stage.choices.length > 0);
    const hasEnding = Boolean(stage.ending);
    const hasAutoNext = Boolean(stage.autoNext);
    const modeCount = [hasChoices, hasEnding, hasAutoNext].filter(
      Boolean,
    ).length;
    if (modeCount !== 1) {
      issues.push({
        type: "malformed-stage",
        detail: `Stage "${stage.id}" must have exactly one of a non-empty choices array, an ending, or autoNext.`,
      });
    }
    for (const choice of stage.choices ?? []) {
      if (!story.stages[choice.nextStageId]) {
        issues.push({
          type: "dangling-next-stage",
          detail: `Stage "${stage.id}" choice "${choice.id}" points to unknown stage "${choice.nextStageId}".`,
        });
      }
    }
    if (stage.autoNext && !story.stages[stage.autoNext]) {
      issues.push({
        type: "dangling-next-stage",
        detail: `Stage "${stage.id}" autoNext points to unknown stage "${stage.autoNext}".`,
      });
    }
  }

  const reachable = new Set<string>();
  const queue = [story.startStageId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const stage = story.stages[id];
    for (const choice of stage?.choices ?? []) {
      queue.push(choice.nextStageId);
    }
    if (stage?.autoNext) {
      queue.push(stage.autoNext);
    }
  }
  for (const id of Object.keys(story.stages)) {
    if (!reachable.has(id)) {
      issues.push({
        type: "unreachable-stage",
        detail: `Stage "${id}" is never reachable from "${story.startStageId}".`,
      });
    }
  }

  const hasGoodEnding = [...reachable].some(
    (id) => story.stages[id]?.ending?.kind === "good",
  );
  if (!hasGoodEnding) {
    issues.push({
      type: "no-good-ending",
      detail: 'No reachable stage has ending.kind === "good".',
    });
  }

  return issues;
}

/** Minimal runtime shape-check for story JSON loaded via a static import. */
export function parseStory(raw: unknown): Story {
  const story = raw as Story;
  if (
    !story ||
    typeof story !== "object" ||
    !story.id ||
    !story.startStageId ||
    !story.stages ||
    typeof story.stages !== "object"
  ) {
    throw new Error("Invalid story: missing required fields.");
  }
  return story;
}
