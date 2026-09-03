# SPEC-project-brief-v1.0 — Project-Brief Framing

Introduced by CR-112. A small, optional piece of framing either a
`Level` or a `Story` can carry: a project name, a description, and
optionally who the player's nominally reporting to and what ticket
brought them in. Shown once, via `ProjectBriefScreen`, before the level
itself - purely narrative dressing, no rules of its own.

Source of truth for the TypeScript type: `src/engine/project.ts`
(`ProjectBrief`). This doc should always match that file - if they
drift, the `.ts` file wins.

## Why a separate, shared type

Both mechanics (`Level` and `Story`) can carry a project brief, and
they carry it the same way - one small optional field, not a
per-mechanic reimplementation. `ProjectBrief` lives in
`src/engine/project.ts` rather than inside `level.ts` or `story.ts` so
neither mechanic has to import the other's module just to know the
brief's shape.

## Shape

```ts
interface ProjectBrief {
  name: string; // the brief's heading - not the same as the level's own title
  description: string; // one or two paragraphs of context; \n\n for paragraph breaks
  stakeholder?: string; // who the player's nominally reporting to, e.g. "Priya Nandan, Release Manager"
  ticket?: string; // a ticket/incident reference, e.g. "INC-4471"
}
```

`Level` and `Story` both gain an optional `project?: ProjectBrief`
field (see `SPEC-level-schema-v1.0.md` / `SPEC-story-schema-v1.0.md`).
Neither mechanic requires one - a level with no `project` behaves
exactly as it did before this CR.

## Where it's surfaced

`content/levelManifest.ts`'s `toQuizEntry`/`toStoryEntry` copy `project`
straight onto the resulting `ManifestEntry`, so `App.tsx` can check for
one without caring which mechanic the level actually uses.

`App.tsx` shows `ProjectBriefScreen` once per level-visit: it tracks
`briefAcknowledgedFor` (the id of the level whose brief has already been
shown this "visit," compared against the currently selected level's
id, not a plain boolean) so that:

- Opening a level with a `project` for the first time shows the brief
  before the level.
- Replaying the same level ("Play again" inside `StoryView`, or
  "Try again" inside `LevelView`) does **not** re-show the brief -
  `selectedLevelId` hasn't changed.
- Opening a _different_ level with a `project` - including via the
  "Next Level" shortcut (CR-111) - shows its own brief again, since its
  id differs from whatever `briefAcknowledgedFor` currently holds.
- A level with no `project` skips this screen entirely; nothing about
  its flow changes.

## Non-goals

- No rules, no scoring, no state beyond "has this been shown yet this
  visit." It's framing, not a mechanic.
- Not required - most existing levels don't have one yet. Chapter 3's
  redesign (CR-112) is the first to carry one; the rest are expected to
  gain one as each is redesigned in turn, same as every other piece of
  this project's content work.

## Document history

| Version | Date       | Change                                 |
| ------- | ---------- | -------------------------------------- |
| 1.0     | 2026-09-03 | Initial spec, written alongside CR-112 |
