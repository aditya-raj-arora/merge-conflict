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
}

interface StoryStage {
  id: string; // must equal its own key in stages, same redundancy rule as Level's Commit.id
  narrative: string; // scene text shown this stage; \n\n for paragraph breaks
  graph?: Graph; // optional - reuses the exact same Graph shape as Level (see SPEC-level-schema-v1.0.md)
  prompt?: string; // the question posed this stage
  choices?: StoryChoice[]; // required on every stage except an ending
  ending?: StoryEnding; // required on a terminal stage, mutually exclusive with choices
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
- Every `StoryChoice.nextStageId` must reference a stage that exists in
  `stages`.
- A stage has exactly one of `choices` or `ending`, never both, never
  neither. A stage with `choices` needs a non-empty array and a `prompt`;
  a stage with `ending` needs no `prompt` and no `choices`.
- Every stage must be reachable from `startStageId` by following
  choices - an authored-but-unreachable stage is a content bug.
- Every reachable path must terminate at an ending - no cycles. This is
  a straightforward branching tree/DAG, not a full state machine; if a
  future story genuinely needs loops, that's a schema change, not an
  implicit extension of this one.
- At least one reachable ending must be `kind: "good"` - a story with no
  way to actually succeed isn't testing anything, it's just linear
  fiction with extra steps.

None of this is enforced by a JSON Schema validator, same caveat as
`Level` - `parseStory()` only checks the top-level fields are present.
Structural correctness (reachability, no dangling `nextStageId`, at
least one good ending) is caught by tests written against each story
fixture, not by the parser.

## Solvability testing (structural, not "one correct answer")

A `Level`'s solvability test proves there's exactly one correct answer.
A `Story` has no single correct answer - the whole point is that
different choices lead to different, valid endings - so its test proves
the _structure_ is sound instead:

1. Every `nextStageId` referenced by any choice resolves to a real stage.
2. Every stage is reachable from `startStageId`.
3. Every stage has exactly one of `choices` (non-empty) or `ending`.
4. At least one reachable ending has `kind: "good"`.

See `tests/engine/story.test.ts` for the reusable validator and
`tests/engine/ch01-story.test.ts` for `STORY-01-01` run through it.

## Document history

| Version | Date       | Change                                               |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0     | 2026-09-01 | Initial spec, written alongside STORY-01-01 (CR-091) |
