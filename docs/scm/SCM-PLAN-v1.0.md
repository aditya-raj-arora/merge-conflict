# SCM-PLAN-v1.0 — Merge Conflict Software Configuration Management Plan

**Team:** Aditya Raj Arora (24MIS0292), Mukta Motwani (24MIS0312)
**Repo:** [github.com/aditya-raj-arora/merge-conflict](https://github.com/aditya-raj-arora/merge-conflict)

This is the master SCM plan for the project — basically the answer to "how
are we actually running configuration management here, and not just
pretending to." Everything else in `docs/scm/` (baseline register, status
ledger, audit checklist) is a live artifact this plan produces. If those
docs and this plan ever disagree, this plan wins and the other doc is
probably just stale and needs updating.

## 1. Why this document exists

We're being graded on how well we _use_ SCM tooling and process during
development, not just on how much of the game ships. So this plan isn't
decoration — it's the thing an examiner (or a grader, or future-us six weeks
from now) can read to understand exactly how a change goes from "idea" to
"shipped, signed, and logged."

## 2. The six disciplines, and how each one shows up here

| Discipline                       | What it prevents                                     | How we actually do it                                                      |
| -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| **Configuration Identification** | Nobody can say what a "build" even consists of       | CSCI/TLCSC/LLCSC/CSU hierarchy (§3), `.gitattributes` as the type rulebook |
| **Version Control**              | Two people's changes silently clobber each other     | Git, branch-per-Issue, PR-gated merges                                     |
| **Change Control**               | Random changes land with no record of why            | GitHub Issues (`CR-*`) + PR review = our Change Control Board              |
| **Status Accounting**            | Nobody can answer "what's actually in prod"          | `STATUS-LEDGER.md`, GitHub Projects kanban                                 |
| **Configuration Audit**          | Shipped build silently drifts from what was approved | `AUDIT-CHECKLIST.md`, run at every baseline promotion                      |
| **Build & Release Management**   | Releases are ad-hoc, no way to roll back             | SemVer + release-please + signed tags + Environments                       |

## 3. Configuration Identification — the CI hierarchy

We identify Configuration Items using a CSCI → TLCSC → LLCSC → CSU tree
(this is the classic MIL-STD-498 style breakdown — a good naming system
should let you tell where something sits in the hierarchy just from its ID,
and roughly what order it was created in).

```
CSCI-MC                                  (the whole game)
├── TLCSC-01-ENGINE                      (game engine)
│   ├── LLCSC-01-01-GRAPH                (commit-graph model + renderer)
│   ├── LLCSC-01-02-MECHANICS            (chapter game mechanics)
│   ├── LLCSC-01-03-CCB                  (in-game Change Control Board sim)
│   ├── LLCSC-01-04-AUDIT                (in-game audit mechanics)
│   └── LLCSC-01-05-RELEASE              (in-game release mechanics)
├── TLCSC-02-UI                          (React components)
├── TLCSC-03-STATE                       (Zustand store)
└── TLCSC-04-CONTENT                     (levels + narrative)
    ├── LLCSC-04-01-CH01 ... LLCSC-04-06-CH06
```

- **CSCI** (Computer Software Configuration Item) — the top-level product.
  One per project: `CSCI-MC`.
- **TLCSC** (Top-Level Computer Software Component) — a major subsystem,
  roughly one per top-level `src/` folder.
- **LLCSC** (Low-Level Computer Software Component) — a subfolder/module
  inside a TLCSC.
- **CSU** (Computer Software Unit) — the leaf: an individual file or module,
  the smallest thing we track individually in the baseline register.

### 3.1 CI naming format

```
<LEVEL>-<HIERARCHY NO.>-<TYPE>-<NAME>_r<REV>
```

- `LEVEL` — `CSCI` / `TLCSC` / `LLCSC` / `CSU`
- `HIERARCHY NO.` — dotted number showing both depth and creation order
  (e.g. `01.02.003` was made after `01.02.001`, same idea as a "1.4 comes
  after 1.2" numbering scheme)
- `TYPE` — `SRC`, `DOC`, `LVL` (level JSON), `NAR` (narrative JSON), `TEST`, `CFG`
- `NAME` — short descriptive slug
- `_r<REV>` — a per-item revision counter, bumped every time _that specific
  CI_ changes. This is separate from the project's overall SemVer tag — the
  SemVer tag versions the whole CSCI baseline, `_r<REV>` tracks one CI's own
  edit history for status accounting purposes.

**Examples:**

- `LLCSC-01.01-SRC-graphEngine_r3`
- `CSU-01.01.002-SRC-commitGraph_r7`
- `CSU-04.01.001-LVL-which-one-shipped_r1`

### 3.2 CI Description table

Every CI that makes it into a baseline gets a description entry — not just
an ID floating around with no context. This lives in
`docs/scm/BASELINE-REGISTER.md` per-baseline, and the format is:

| Field                | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| CI ID                | the full `<LEVEL>-<NO.>-<TYPE>-<NAME>_r<REV>` string     |
| Name                 | human-readable name                                      |
| Type                 | SRC / DOC / LVL / NAR / TEST / CFG                       |
| Parent CI            | the LLCSC/TLCSC it lives under                           |
| Owner                | who's responsible for it                                 |
| Controlling baseline | which `BL-<NN>-<name>` tag it was last confirmed against |
| Description          | one line, what it actually is/does                       |

## 4. Version Control

- **Branches:** `<type>/<scope>-<short-description>`, e.g. `feat/vcs-merge`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/),
  footer `Refs: CR-NNN`, GPG-signed, no exceptions
- **Branch model:** see `CONTRIBUTING.md` for the full breakdown of
  `main` / `develop` / `feat|fix|docs|test|refactor|chore|ci/*` / `release/*`

## 5. Change Control

Every change starts as a `CR-` Issue (using the `change-request` template),
optionally preceded by an RFC Discussion if it's still a fuzzy idea. The
Change Control Board here is, practically speaking, GitHub PR review +
branch protection + CODEOWNERS — a PR can't merge without passing status
checks and getting an approving review, and CODEOWNERS auto-requests that
review from the right person.

### 5.1 Known deviation — required review count during solo bootstrap

GitHub hard-blocks self-approval on your own PR (this is a platform rule,
not something branch protection can waive — even repo admins can't override
it). Since the bootstrap phase of this project is a single person pushing
commits before Mukta is added as a GitHub collaborator, `required_approving_
review_count` on `develop` and `main` is temporarily set to **0** rather
than 1, purely so these early PRs can actually merge.

This is a deliberate, logged exception, not a silent bypass — everything
else in the CCB gate still applies (status checks must pass, commits must
be signed, PR must reference a `CR-` Issue). Once Mukta's GitHub handle is
added to `CODEOWNERS` and she's a collaborator on the repo, this gets
reverted back to `required_approving_review_count: 1` so review is a real
second pair of eyes again, not a formality. Track that reversion as its own
CR when it happens.

## 6. Status Accounting

`docs/scm/STATUS-LEDGER.md` tracks, per item: current version, which
environment it's deployed to (dev/staging/prod), when it last changed, and
which CRs are still open against it. The GitHub Projects kanban board is the
live/day-to-day version of the same information; the ledger is the
point-in-time snapshot we update at each increment.

## 7. Configuration Audit

`docs/scm/AUDIT-CHECKLIST.md` is run at every baseline promotion —
basically a "does what we're about to tag actually match what was approved"
sanity check. Covers CodeQL, gitleaks, coverage delta, Dependabot queue
status, and whether every CR in the release is actually resolved.

## 8. Build & Release Management

- **Versioning:** SemVer. MAJOR = breaking engine/schema change, MINOR = new
  chapter/mechanic, PATCH = fixes/tuning.
- **Automation:** release-please reads our Conventional Commit history,
  opens a release PR bumping `package.json` + `CHANGELOG.md`, and on merge
  cuts a signed `vX.Y.Z` tag.
- **Baselines:** alongside every semver tag, we also cut a signed
  `BL-<NN>-<name>` tag — the semver tag versions the _build_, the baseline
  tag versions the _approved configuration_ (they usually point at the same
  commit, but conceptually they're answering different questions).
- **Environments:** `dev` (no gate) → `staging` (5-min wait timer, deploys
  from `develop`) → `prod` (required reviewer, only deploys from `main`,
  only on tag push).
- **First release is `v0.1.0`, not `v1.0.0`:** release-please treats a
  `package.json` version of exactly `0.0.0` as a special "unreleased"
  sentinel and defaults straight to `1.0.0` for the first release,
  ignoring our `bump-minor-pre-major` config (which only applies once a
  version is already below `1.0.0` - `0.0.0` itself doesn't count). Since
  MINOR = "new chapter" here and Chapter 1 is our first chapter, not a
  "1.0 stable" milestone, we override this once via a `Release-As: 0.1.0`
  commit trailer (release-please's documented mechanism for forcing the
  next computed version). See CR-027.

## 9. The 17-tool toolchain

See [`TOOLCHAIN-MAP.md`](TOOLCHAIN-MAP.md) for the full tool-by-tool
breakdown of what covers which discipline and why. Short version: it's in
the main `README.md` too, kept in sync with this doc.

## 10. Document history

| Version | Date       | Change                            |
| ------- | ---------- | --------------------------------- |
| 1.0     | 2026-08-05 | Initial SCM plan, bootstrap phase |
