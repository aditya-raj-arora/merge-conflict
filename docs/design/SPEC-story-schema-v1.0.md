# SPEC-story-schema-v1.0 — Branching Story JSON Shape

Companion to `SPEC-level-schema-v1.0.md`. A `Story` is the branching,
multi-stage counterpart to a `Level` (CR-091): instead of one question
graded right/wrong on the spot, a choice moves the player to a genuinely
different stage, which can carry its own consequences and, eventually,
its own ending. `Level` is unchanged and still exists side by side with
`Story` - most chapters still use it.

Source of truth for the TypeScript types: `src/engine/mechanics/story.ts`
(`Story`, `StoryStage`, `StoryChoice`, `StoryEnding`). This doc should
always match that file - if they drift, the `.ts` file wins.

## Naming convention

Story files live at `content/chapters/<chapter-id>/STORY-<chapter>-<seq>-<slug>.json`,
e.g. `content/chapters/ch01-identification/STORY-01-01-which-one-shipped.json` -
parallel to `LVL-<chapter>-<seq>-<slug>.json` for `Level` files. Per the CI
naming scheme in `docs/scm/SCM-PLAN-v1.0.md` §3, a story file is a `CSU`
of type `STORY`, living under the same `LLCSC-04-<NN>-CH<NN>` its chapter
would use for a `LVL` file.

## Top-level shape

```ts
interface Story {
  id: string; // matches the filename, e.g. "STORY-01-01-which-one-shipped"
  chapterId: string; // e.g. "ch01-identification"
  title: string; // shown as the story heading, every stage
  startStageId: string; // must be a key in stages
  stages: Record<string, StoryStage>;
  project?: ProjectBrief; // optional project-brief framing (CR-112) - see SPEC-project-brief-v1.0.md
}

interface StoryStage {
  id: string; // must equal its own key in stages, same redundancy rule as Level's Commit.id
  narrative: string; // scene text shown this stage; \n\n for paragraph breaks
  speaker?: string; // who's "speaking" this beat, e.g. "Narrator", "You", "Teammate" - StoryView falls back to "Narrator" if omitted
  mood?: "calm" | "tense" | "danger" | "neutral"; // drives StoryView's backdrop theme (CR-095); falls back to "neutral"
  graph?: Graph; // optional - reuses the exact same Graph shape as Level (see SPEC-level-schema-v1.0.md)
  prompt?: string; // the question posed this stage - only on a stage with choices
  choices?: StoryChoice[]; // a real decision point
  autoNext?: string; // a narrative-only beat, click to continue straight to this stage id (CR-095) - no decision, just pacing/depth
  ending?: StoryEnding; // a terminal stage
}

interface StoryChoice {
  id: string;
  label: string;
  nextStageId: string; // must be a key in stages - this is the branching mechanism
}

interface StoryEnding {
  kind: "good" | "bad" | "neutral";
  debrief: string;
}
```

## Rules a story fixture must follow

- Every `StoryStage.id` used as a key in `stages` must equal that stage's
  own `id` field (same redundancy-on-purpose rule as `Level`'s `Commit`).
- `startStageId` must reference a stage that exists in `stages`.
- Every `StoryChoice.nextStageId` and every `StoryStage.autoNext` must
  reference a stage that exists in `stages`.
- A stage has **exactly one** of `choices` (non-empty), `ending`, or
  `autoNext` - never more than one, never none. A stage with `choices`
  needs a `prompt`; a stage with `ending` or `autoNext` needs neither
  `prompt` nor `choices`.
- Every stage must be reachable from `startStageId` by following choices
  and `autoNext` edges - an authored-but-unreachable stage is a content
  bug.
- Every reachable path must terminate at an ending - no cycles. This is
  a straightforward branching tree/DAG, not a full state machine; if a
  future story genuinely needs loops, that's a schema change, not an
  implicit extension of this one.
- At least one reachable ending must be `kind: "good"` - a story with no
  way to actually succeed isn't testing anything, it's just linear
  fiction with extra steps.

None of this is enforced by a JSON Schema validator, same caveat as
`Level` - `parseStory()` only checks the top-level fields are present.
Structural correctness (reachability, no dangling `nextStageId`/
`autoNext`, at least one good ending) is caught by tests written
against each story fixture, not by the parser.

### `autoNext` - depth without inventing a decision at every stage (CR-095)

A choice point at every single stage gets exhausting to author and to
play. `autoNext` is how a path gets real narrative depth - multiple
beats, alternating speakers, rising tension - without forcing a
decision each time. Use it for scene-setting, a teammate's reaction, or
anything that's pure pacing; reserve `choices` for the moments that
actually matter. Not every path needs the same depth: a story is free
to let its "things went fine" path stay short while its consequence
paths run deeper - see `STORY-01-01`'s build-b path (quick) versus its
build-a/build-c paths (5+ stages, with a real second decision point on
the build-a side).

## Solvability testing (structural, not "one correct answer")

A `Level`'s solvability test proves there's exactly one correct answer.
A `Story` has no single correct answer - the whole point is that
different choices lead to different, valid endings - so its test proves
the _structure_ is sound instead:

1. Every `nextStageId` referenced by any choice, and every `autoNext`,
   resolves to a real stage.
2. Every stage is reachable from `startStageId`.
3. Every stage has exactly one of `choices` (non-empty), `ending`, or
   `autoNext`.
4. At least one reachable ending has `kind: "good"`.

See `tests/engine/story.test.ts` for the reusable validator and
`tests/engine/ch01-story.test.ts` for `STORY-01-01` run through it,
including assertions on minimum path depth for the consequence branches.

## Document history

| Version | Date       | Change                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| 1.0     | 2026-09-01 | Initial spec, written alongside STORY-01-01 (CR-091)                           |
| 1.0     | 2026-09-01 | Added `speaker`, `mood`, `autoNext` for the VN UI and deeper branches (CR-095) |
| 1.0     | 2026-09-03 | Added optional `project` (CR-112)                                              |
