# SPEC-progression-economy-v1.0 — Level Progression, Budget Economy, and Player Profile

Introduced by CR-109. Adds a persistent player profile - a name, a
budget, and per-level progress - that gates level access and reacts to
every choice the player makes, on top of the existing `Level`/`Story`
mechanics, which are unchanged.

Source of truth for the TypeScript types and pure logic:
`src/engine/economy.ts`. This doc should always match that file - if
they drift, the `.ts` file wins.

## Why

The brief: levels unlock in order as the previous one is "played and
passed"; a company budget starts at some amount and every choice grows
or shrinks it, with a perfect choice earning the most and a bad mistake
costing real money; everything lives in the browser's `localStorage`
only; and a first-launch screen introduces the system and collects the
player's name.

## Data model

```ts
interface LevelProgress {
  passed: boolean;
  totalRuns: number; // every completed attempt, not just passing ones
}

interface PlayerState {
  name: string | null;
  budget: number;
  progress: Record<string, LevelProgress>; // keyed by manifest entry id
  lastReward: { levelId: string; amount: number } | null;
}
```

Persisted via `zustand/persist` under the localStorage key
`merge-conflict:player` (`src/state/usePlayerStore.ts`). Nothing here is
ever sent anywhere - it's read and written entirely client-side.

## Passing a level

- **Quiz** (`Level`): passed the moment the correct option has ever been
  chosen (`evaluateAnswer` returns true).
- **Story**: passed the moment a `"good"` ending has ever been reached.
  Reaching `"neutral"` or `"bad"` does **not** pass the level - the
  player can always retry via StoryView's existing "Play again".

Once `passed` is `true` for a level, it stays `true` regardless of how
later replays turn out (see `usePlayerStore.recordStoryEnding`).

## Unlocking

`isLevelUnlocked(levelIds, progress, levelId)`: a level is unlocked if
it's first in `levelIds` (the manifest's own order), or the level
immediately before it has `passed: true`. Purely sequential - there is
no per-chapter or per-branch unlock tree, matching the manifest's flat
list-of-levels shape.

## The budget

Starts at `STARTING_BUDGET` (10,000). Every completed attempt applies a
reward or punishment from a fixed table (`REWARD` in `economy.ts`):

| Outcome                                            | Amount |
| -------------------------------------------------- | -----: |
| Quiz, correct, first-ever submission for the level | +1,000 |
| Quiz, correct, after a prior wrong attempt         |      0 |
| Quiz, incorrect (every time)                       |   -400 |
| Story ending: `good`                               | +1,000 |
| Story ending: `neutral`                            |   +200 |
| Story ending: `bad`                                |   -600 |

Two asymmetric rules, both explicit design decisions (confirmed with
the requester before building, not assumed):

1. **Quiz "perfect" bonus is one-shot per level.** Only a correct answer
   on the very first submission ever made for that level earns the full
   reward. A wrong answer always costs the same amount, every time it
   happens; a correct answer that comes after a wrong one still passes
   the level (unlocking the next one) but earns nothing further - the
   perfect bonus was already forfeited by the mistake.
2. **Story rewards apply on every replay, including after already
   passing.** Unlike the quiz case, reaching an ending - any kind, any
   number of times - always applies that ending's reward or punishment.
   "Play again" has real, repeatable budget consequences.

There is no budget floor and no "game over" state. The budget is a
running consequence tracker, not a lockout - it can go negative and
nothing else in the game reacts to that fact (explicit scope decision,
CR-109).

## Resetting progress

`LevelSelect` exposes `usePlayerStore().resetProfile()` (CR-110) as a
"Reset progress" control at the bottom of the screen, behind an inline
confirm step - it's destructive and irreversible, so it isn't a
one-click action. Confirming wipes name, budget, and all per-level
progress back to defaults in one call; since `resetProfile()` also
clears the name, `App.tsx`'s existing welcome-screen gate sends the
player straight back to `WelcomeScreen` afterward - no separate routing
logic needed for this.

## First-launch screen

`WelcomeScreen` (CR-109) renders when `usePlayerStore().name` is `null`,
i.e. on a genuinely fresh browser/profile. It explains the budget and
progression rules in plain terms and collects the player's name (up to
40 characters, trimmed, required to proceed). Once a name is set,
`App.tsx` never shows this screen again for that profile - a returning
player goes straight to `LevelSelect`.

## Solvability / testing note

Unlike `Level`/`Story`'s own structural tests, this layer's tests are
about the _rules_, not any specific content: `tests/engine/economy.test.ts`
covers the pure functions directly, `tests/state/usePlayerStore.test.ts`
covers the store's persistence and mutation behavior, and
`tests/App.test.tsx` / `tests/components/LevelSelect.test.tsx` cover the
unlock gate and welcome-screen flow end to end.
