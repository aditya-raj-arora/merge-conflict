# Toolchain Map — the viva cheat sheet

Seventeen tools, six disciplines. This table is meant to answer, for every
single one: which discipline is it doing the work of, and what would we
never notice was wrong without it. Keep this file honest — if a tool gets
swapped out or a workflow gets renamed, update this table in the same PR.

| # | Tool | Discipline | Why it's here | Without it, we wouldn't catch... |
|---|---|---|---|---|
| 1 | **Git** | Version Control | The commit-graph substrate everything else is built on | ...literally any change history at all |
| 2 | **Git LFS** | Configuration Identification | Versions large binaries (sprites, audio) outside the normal delta-compressed pack | ...a bloated, unclonable repo full of binary diffs |
| 3 | **`.gitattributes`** | Configuration Identification | Declares merge strategy / line endings / diff-driver per file type — the "identification rulebook" | ...CRLF/LF churn, binary files getting corrupted by text-mode diffs |
| 4 | **GPG signing** | Change Control | Cryptographic proof of who approved a commit/tag, and that it wasn't altered after | ...someone impersonating another contributor's commits |
| 5 | **GitHub Issues** (`change-request` template) | Change Control | Every `CR-*` — the actual change-request record | ...changes with zero paper trail for *why* |
| 6 | **GitHub Discussions** (RFC template) | Change Control | Pre-CR debate space — proposal → CR → baseline | ...half-baked ideas getting committed to before anyone's pushed back on them |
| 7 | **PRs + branch protection + CODEOWNERS** | Change Control | Our actual Change Control Board | ...unreviewed code landing on protected branches |
| 8 | **GitHub Projects** | Status Accounting | Live kanban view of what's in progress/done | ...losing track of what's actually finished vs. still open |
| 9 | **GitHub Environments** (dev/staging/prod) | Build & Release Management | Explicit, reviewer-gated release stages | ...a change reaching prod without anyone explicitly approving that specific promotion |
| 10 | **GitHub Actions** | Build & Release Management | Runs CI, deploy, and release workflows | ...manually running lint/test/build/deploy every single time (and forgetting to) |
| 11 | **release-please** | Build & Release Management | Reads Conventional Commits, auto-bumps version + CHANGELOG, cuts the tag | ...manual, inconsistent, easy-to-forget version bumps |
| 12 | **Codecov** | Status Accounting | Quantified test-suite status as a PR check | ...coverage silently eroding over time with nobody noticing |
| 13 | **CodeQL** | Configuration Audit | Automated SAST on every PR | ...a known-vulnerable code pattern getting merged and later "audited" as fine |
| 14 | **Dependabot** | Change Control (for third-party CIs) | Opens CRs for dependency updates/CVEs | ...a dependency's known CVE sitting unpatched indefinitely |
| 15 | **gitleaks** | Configuration Audit | Blocks secrets pre-commit and in CI | ...an API key getting permanently baked into git history |
| 16 | **Conventional Commits + commitlint** | Change Control / Status Accounting | Machine-readable commit format, enforced by hook + CI | ...inconsistent commit messages that release-please can't parse into a changelog |
| 17 | **Commitizen + Husky/lint-staged** | Change Control | `git cz` prompt + the actual local git hooks that enforce all of the above before it even reaches CI | ...bad commits/lint errors/secrets reaching GitHub at all, instead of getting caught locally |

## Versioning policy (not a tool, but the rule they all serve)

**Semantic Versioning** — MAJOR = breaking engine/schema change, MINOR = new
discipline chapter or mechanic, PATCH = fixes/content tuning. Every other
tool in this table either produces a semver-tagged artifact or checks one.

## Manual docs (the human-run half of the toolchain)

Not everything's automatable — these four docs are where a human actually
has to sit down and think:

- [`SCM-PLAN-v1.0.md`](SCM-PLAN-v1.0.md) — the plan itself
- [`BASELINE-REGISTER.md`](BASELINE-REGISTER.md) — every baseline, logged
- [`STATUS-LEDGER.md`](STATUS-LEDGER.md) — what's where, right now
- [`AUDIT-CHECKLIST.md`](AUDIT-CHECKLIST.md) — run before every baseline promotion
