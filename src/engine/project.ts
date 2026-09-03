// CSU-01.02.004-SRC-project_r1
// LLCSC-01-02-MECHANICS: the project-brief shape (CR-112) shared by
// both mechanics - a Level or Story can optionally carry one, shown
// once via ProjectBriefScreen before the player sees the level itself.
// Framing only: it carries no rules of its own, doesn't affect scoring
// or progression, and both mechanics work exactly the same with or
// without one.
export interface ProjectBrief {
  /** Shown as the brief's heading, e.g. "Lighthouse Sync - Post-Surge
   * Change Audit". Not the same as the level's own title. */
  name: string;
  /** A paragraph or two of context - what the project is, what's gone
   * wrong, why the player's been brought in. */
  description: string;
  /** Who the player is nominally reporting to/for, e.g. "Priya Nandan,
   * Release Manager". Optional. */
  stakeholder?: string;
  /** A ticket/incident reference, e.g. "INC-4471". Optional. */
  ticket?: string;
}
