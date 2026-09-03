# Status Ledger

The "what version is where, right now" doc — status accounting in one table.
Update this whenever something's version or environment changes; the GitHub
Projects board is the live/granular version of the same info, this is the
point-in-time snapshot we take at every increment (and it's what an auditor
would actually check first).

## Ledger

| Item                                                 | Current Version                                        | Environment                         | Last Change                                | Open CRs |
| ---------------------------------------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------------------------------ | -------- |
| CSCI-MC (whole app)                                  | `v0.9.1` / `BL-17-reset-progress`                      | staging + prod (both verified live) | 2026-09-03, reset-progress option (CR-110) | —        |
| TLCSC-02-UI > LevelSelect                            | `_r3` (adds the Reset progress control, confirm-gated) | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-02-UI > WelcomeScreen                          | `_r1` (new)                                            | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-01-ENGINE > LLCSC-01-02-MECHANICS > economy.ts | `_r1` (new)                                            | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-03-STATE > usePlayerStore                      | `_r1` (new, localStorage-persisted)                    | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-01-ENGINE (commit graph + level mechanics)     | `_r1` (all units)                                      | staging + prod                      | 2026-08-06                                 | —        |
| TLCSC-02-UI (GraphCanvas)                            | `_r1`                                                  | staging + prod                      | 2026-08-06                                 | —        |
| TLCSC-02-UI > LevelView                              | `_r2` (records quiz attempts against the player store) | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-03-STATE (useGameStore)                        | `_r1`                                                  | staging + prod                      | 2026-08-06                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-01-CH01 (STORY-01-01)    | `_r2` (deepened; supersedes retired LVL-01-01)         | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-02-UI > StoryView                              | `_r3` (records story endings against the player store) | staging + prod                      | 2026-09-03                                 | —        |
| TLCSC-01-ENGINE > LLCSC-01-02-MECHANICS > story.ts   | `_r1` (new)                                            | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-02-CH02 (STORY-02-01)    | `_r1` (supersedes retired LVL-02-01)                   | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-03-CH03 (STORY-03-01)    | `_r1` (supersedes retired LVL-03-01)                   | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-04-CH04 (STORY-04-01)    | `_r1` (supersedes retired LVL-04-01)                   | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-05-CH05 (STORY-05-01)    | `_r1` (supersedes retired LVL-05-01)                   | staging + prod                      | 2026-09-01                                 | —        |
| TLCSC-04-CONTENT > LLCSC-04-06-CH06 (STORY-06-01)    | `_r1` (supersedes retired LVL-06-01)                   | staging + prod                      | 2026-09-01                                 | —        |

_(Table grows one row per top-level CI as they come online. `staging` =
Vercel, deployed from `develop`; `prod` = GitHub Pages at
https://aditya-raj-arora.github.io/merge-conflict/, deployed from
`v*.*.*` tags through the required-reviewer gate — see CR-034 for why
they're on different hosts.)_

## How to read this table

- **Item** — the CI, usually at TLCSC or LLCSC granularity (CSU-level would
  make this table unreadable fast)
- **Current Version** — semver tag if released, or `unreleased` /
  commit-hash if still in development
- **Environment** — `dev` / `staging` / `prod`, or `—` if not deployed anywhere
- **Last Change** — date or commit reference of the most recent update
- **Open CRs** — any `CR-NNN` Issues still open against this item
