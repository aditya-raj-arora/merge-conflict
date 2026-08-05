# Merge Conflict

So here's the pitch: **Merge Conflict** is a narrative browser game that
teaches Software Configuration Management (SCM) by making you feel the pain
each discipline exists to prevent, *before* handing you the tool that fixes
it. You play the Configuration Manager across three acts — an indie game
studio in crunch, an open-source library that suddenly goes viral, and Mars
launch mission control — and by the end you've been burned by (and then
rescued by) all six SCM disciplines.

This README is also doing double duty as the pitch doc for our SCM course
project, so bear with the occasional "why we did it this way" tangent.

## The six disciplines (and what each chapter teaches)

| # | Discipline | What breaks without it | Chapter |
|---|---|---|---|
| 1 | Configuration Identification | Nobody can say which build is which — three unlabeled builds, guess which one shipped | Ch.1 |
| 2 | Version Control | Two people edit the same file, nobody knows how to reconcile it | Ch.2 |
| 3 | Change Control | Random changes land with no review, no traceability to *why* | Ch.3 |
| 4 | Status Accounting | Nobody can answer "what version is actually in prod right now?" | Ch.4 |
| 5 | Configuration Audit | The shipped build silently drifts from what was actually approved | Ch.5 |
| 6 | Build & Release Management | Releases are ad-hoc, no semver, no gates, no going back | Ch.6 |

## Tech stack

- **Language:** TypeScript (strict mode)
- **Framework:** React 18 + Vite
- **State:** Zustand
- **Rendering:** custom SVG renderer over our own commit-graph model
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library (Playwright for e2e later)
- **Lint/format:** ESLint + Prettier
- **Package manager:** npm (lockfile committed)
- **Deploy:** GitHub Pages — `develop` → staging, tagged releases on `main` → prod

## How this repo demonstrates SCM (the actual point of the assignment)

Honestly the game itself is secondary — what's actually being graded is
whether *our own dev process* visibly runs on the same six disciplines the
game teaches. So a few rules we hold ourselves to, no exceptions:

- **No direct commits to `main` or `develop`.** Every change goes
  Issue → branch → PR → review → signed squash-merge. The only direct commit
  to `main` in this repo's entire history is the very first scaffold commit,
  and it says so in its own commit body.
- **Every PR traces back to a GitHub Issue** prefixed `CR-` (change request).
  No Issue, no code change — that's Change Control, not bureaucracy for its
  own sake.
- **Every commit and every tag is GPG-signed.** Branch protection enforces
  this — an unsigned commit literally cannot merge.
- **Every increment ends with** a signed semver tag, a `CHANGELOG.md` entry,
  and a new row in `docs/scm/BASELINE-REGISTER.md`.
- Full details live in [`docs/scm/SCM-PLAN-v1.0.md`](docs/scm/SCM-PLAN-v1.0.md)
  — that's the canonical plan, treat this README as the summary.

### Config Item hierarchy

We identify Configuration Items (CIs) using a CSCI → TLCSC → LLCSC → CSU tree
(basically the classic MIL-STD-498 breakdown), not a flat ID scheme:

- **CSCI** — the whole product: `CSCI-MC`
- **TLCSC** — major subsystems, one per top-level `src/` folder:
  `TLCSC-01-ENGINE`, `TLCSC-02-UI`, `TLCSC-03-STATE`, `TLCSC-04-CONTENT`
- **LLCSC** — the subfolders inside each TLCSC, e.g. under Engine:
  `LLCSC-01-01-GRAPH`, `LLCSC-01-02-MECHANICS`, `LLCSC-01-03-CCB`,
  `LLCSC-01-04-AUDIT`, `LLCSC-01-05-RELEASE`
- **CSU** — the leaf-level unit, an individual file/module, e.g.
  `CSU-001-commitGraph.ts`

Full CI ID format (position + revision, so it doubles as a status-accounting
key):

```
<LEVEL>-<HIERARCHY NO.>-<TYPE>-<NAME>_r<REV>
```

e.g. `LLCSC-01.01-SRC-graphEngine_r3`. See
[`docs/scm/SCM-PLAN-v1.0.md`](docs/scm/SCM-PLAN-v1.0.md) for the full
breakdown and the CI Description table.

## The 17-tool SCM toolchain

Yeah, it's a lot — but each one earns its place by covering a specific
discipline. This is basically our viva cheat sheet, kept in sync with
[`docs/scm/TOOLCHAIN-MAP.md`](docs/scm/TOOLCHAIN-MAP.md).

**Core version control**
- **Git** — the commit-graph substrate everything else builds on
- **Git LFS** — versions large binaries (sprites, audio) outside the normal pack
- **`.gitattributes`** — the identification rulebook: merge strategy, line
  endings, diff/LFS filters per file type
- **GPG signing** — cryptographic proof of who approved what, on every commit and tag

**Collaboration & change control (GitHub)**
- **Issues** (`change-request` template) — every `CR-*` lives here
- **Discussions** — RFC-style debate before a proposal becomes a concrete CR
- **PRs + branch protection + CODEOWNERS** — our Change Control Board
- **Projects** — live kanban board for status accounting
- **Environments** (dev/staging/prod, required reviewers on prod) — explicit release gates

**Automation / CI-CD**
- **GitHub Actions** — CI, deploy, release workflows
- **release-please** — reads Conventional Commits, opens the release PR, bumps
  version + changelog, creates the signed tag
- **Codecov** — coverage delta as a PR check

**Automated audit & hygiene**
- **CodeQL** — SAST, runs on every PR
- **Dependabot** — PRs for dependency updates/CVEs
- **gitleaks** — blocks secrets from ever getting committed

**Commit quality**
- **Conventional Commits + commitlint** — machine-checkable commit format
- **Commitizen** — `git cz` interactive prompt so nobody freehands a bad commit message
- **Husky + lint-staged** — the actual git hooks that run all of the above locally

**Versioning policy**
- **Semantic Versioning** — MAJOR = breaking engine/schema change, MINOR = new
  chapter/mechanic, PATCH = fixes/tuning

**Manual SCM docs**
- [`docs/scm/SCM-PLAN-v1.0.md`](docs/scm/SCM-PLAN-v1.0.md) — the master plan
- [`docs/scm/BASELINE-REGISTER.md`](docs/scm/BASELINE-REGISTER.md) — every baseline tag, logged
- [`docs/scm/STATUS-LEDGER.md`](docs/scm/STATUS-LEDGER.md) — what version is where
- [`docs/scm/AUDIT-CHECKLIST.md`](docs/scm/AUDIT-CHECKLIST.md) — checklist run at every baseline promotion

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branching model, commit
conventions, and PR checklist before you touch anything.

## Team

- **Aditya Raj Arora** (24MIS0292) — [@aditya-raj-arora](https://github.com/aditya-raj-arora)
- **Mukta Motwani** (24MIS0312)

## License

MIT — see [`LICENSE`](LICENSE).
