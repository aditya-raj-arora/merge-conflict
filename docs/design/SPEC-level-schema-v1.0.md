# SPEC-level-schema-v1.0 — Level JSON Shape

Every chapter's puzzles are the same basic shape under the hood: show a
commit graph, ask a question about it, check the answer. This doc is the
contract for that shape so content and engine can be built somewhat
independently of each other - if a level JSON matches this, the engine
can load it, full stop.

Source of truth for the TypeScript types: `src/engine/mechanics/level.ts`
(`Level`, `LevelOption`) and `src/engine/graph/commitGraph.ts` (`Graph`,
`Commit`, `Ref`, `Head`). This doc should always match those - if they
drift, the `.ts` files win and this doc needs updating.

## Naming convention

Level files live at `content/chapters/<chapter-id>/LVL-<chapter>-<seq>-<slug>.json`,
e.g. `content/chapters/ch01-identification/LVL-01-01-which-one-shipped.json`.
Per the CI naming scheme in `docs/scm/SCM-PLAN-v1.0.md` §3, a level file is
a `CSU` (Computer Software Unit) of type `LVL`, living under
`LLCSC-04-<NN>-CH<NN>` (its chapter).

## Top-level shape

```ts
interface Level {
  id: string; // matches the filename, e.g. "LVL-01-01-which-one-shipped"
  chapterId: string; // e.g. "ch01-identification"
  title: string; // shown as the level heading
  narrative: {
    intro: string; // shown before the player answers
    correctDebrief: string; // shown if they get it right
    incorrectDebrief: string; // shown if they get it wrong
  };
  graph: Graph; // the commit graph this level is about - see below
  prompt: string; // the actual question
  options: LevelOption[]; // the multiple-choice answers
  correctOptionId: string; // must match one of options[].id
  project?: ProjectBrief; // optional project-brief framing (CR-112) - see SPEC-project-brief-v1.0.md
}

interface LevelOption {
  id: string;
  label: string;
}
```

## The `graph` field

Reuses the exact same `Graph` shape the engine itself uses (not a
separate "level graph" format) - this is deliberate, so a level fixture
can be fed straight into the pure graph operations (`commit`, `branch`,
`checkout`) in tests without any translation layer.

```ts
interface Graph {
  commits: Record<string, Commit>;
  refs: Record<string, Ref>;
  head: Head;
}

interface Commit {
  id: string;
  parentIds: string[]; // [] for a root commit
  message: string;
  authorSigned: boolean;
  timestamp: number; // logical ordering, not a real epoch time
}

interface Ref {
  name: string;
  commitId: string;
}

type Head =
  { type: "branch"; name: string } | { type: "detached"; commitId: string };
```

## Merge commits

A merge commit is just a `Commit` whose `parentIds` has more than one
entry - there's no separate "merge" shape. `layoutGraph()` and
`GraphCanvas` were written parent-count-agnostic from the start (see
`LLCSC-01-01-GRAPH`'s doc comment in `commitGraph.ts`), so this works with
no schema or engine changes; verified against a real fixture in
`tests/engine/layout.test.ts` and shipped in
`content/chapters/ch02-version-control/LVL-02-01-whose-fix-made-it.json`
(CR-051).

One thing to know when authoring one: `computeLanes()` in `layout.ts`
assigns lanes by walking **first-parent** history from each ref, so give
every diverging branch its own ref (not just the branch that ends up
merged) - otherwise a commit only reachable as a merge's second-plus
parent falls into the "unreferenced commit" fallback lane assignment
instead of a lane that reflects its actual branch.

```json
{
  "id": "c4",
  "parentIds": ["c2", "c3"],
  "message": "merge: combine two branches",
  "authorSigned": true,
  "timestamp": 2
}
```

## Rules a level fixture must follow

- Every `Commit.id` used as a key in `commits` must equal that commit's
  own `id` field (redundant on purpose - makes the object easy to iterate
  either by key or by value without a mismatch).
- Every `parentIds` entry must reference a commit that also exists in
  `commits`.
- Every `Ref.commitId` must reference a commit that exists in `commits`.
- `correctOptionId` must exactly match the `id` of one entry in `options`.
- `head` must resolve to a real commit (either a branch name present in
  `refs`, or a commit id present in `commits`).

None of this is currently enforced by a JSON Schema validator - `parseLevel()`
in `level.ts` only checks that the required top-level fields are present,
not full structural validity. If a level fixture and this spec disagree,
it'll most likely surface as a broken render or a failing solvability
test, not a clean validation error. Worth a follow-up CR if content
volume grows enough that this becomes painful.

## Solvability testing

Every level fixture should have a corresponding test (see
`tests/engine/level.test.ts` for `LVL-01-01`) that:

1. Runs `evaluateAnswer(level, level.correctOptionId)` and asserts `true`.
2. Runs `evaluateAnswer(level, <every other option id>)` and asserts `false`.

This is what "solvability test" means in the Definition of Done - proof
that the level, as authored, actually has exactly one correct answer that
the engine agrees is correct.

## Document history

| Version | Date       | Change                                                                 |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 1.0     | 2026-08-06 | Initial spec, written alongside LVL-01-01                              |
| 1.0     | 2026-08-20 | Added the Merge commits section, verified alongside LVL-02-01 (CR-051) |
| 1.0     | 2026-09-03 | Added optional `project` (CR-112) - not used by any active fixture yet |
