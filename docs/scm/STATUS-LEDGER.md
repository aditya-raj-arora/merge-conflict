# Status Ledger

The "what version is where, right now" doc — status accounting in one table.
Update this whenever something's version or environment changes; the GitHub
Projects board is the live/granular version of the same info, this is the
point-in-time snapshot we take at every increment (and it's what an auditor
would actually check first).

## Ledger

| Item                                             | Current Version                         | Environment                         | Last Change                             | Open CRs |
| ------------------------------------------------ | --------------------------------------- | ----------------------------------- | --------------------------------------- | -------- |
| CSCI-MC (whole app)                              | `v0.1.0` / `BL-01-identification-intro` | staging + prod (both verified live) | 2026-08-06, Chapter 1 baseline (CR-024) | —        |
| TLCSC-01-ENGINE (commit graph + level mechanics) | `_r1` (all units)                       | staging + prod                      | 2026-08-06                              | —        |
| TLCSC-02-UI (GraphCanvas, LevelView)             | `_r1`                                   | staging + prod                      | 2026-08-06                              | —        |
| TLCSC-03-STATE (useGameStore)                    | `_r1`                                   | staging + prod                      | 2026-08-06                              | —        |
| TLCSC-04-CONTENT > LLCSC-04-01-CH01 (LVL-01-01)  | `_r1`                                   | staging + prod                      | 2026-08-06                              | —        |

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
