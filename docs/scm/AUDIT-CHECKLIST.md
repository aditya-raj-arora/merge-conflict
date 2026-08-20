# Audit Checklist

This is the checklist we actually run through at every baseline promotion —
i.e., every time we're about to cut a `BL-<NN>-<name>` tag. The whole point
of a Configuration Audit is catching drift between "what got approved" and
"what's actually about to ship," so this isn't a formality, it's the last
gate before something becomes a baseline.

Copy this checklist into the PR/Issue for the release (or just tick it off
here and note the baseline tag it was run for) before tagging.

## Checklist

- [ ] **CodeQL clean** — no unresolved high/critical findings on the branch being promoted
- [ ] **gitleaks clean** — no secrets flagged in the full-history scan
- [ ] **Coverage delta ≥ 0** — Codecov patch check isn't red, overall project coverage hasn't dropped
- [ ] **Dependabot security queue empty** — no open, unmerged security-advisory PRs
- [ ] **All CRs listed in the release are resolved** — every `CR-NNN` referenced in the CHANGELOG entries for this release is actually closed
- [ ] **Tag signature verifies** — `git tag -v <tag>` shows a good signature
- [ ] **Baseline register entry drafted** — the new row for `BASELINE-REGISTER.md` is ready (tag, date, signer, included CIs, closed CRs, approver, notes)
- [ ] **Status ledger updated** — affected rows in `STATUS-LEDGER.md` reflect the new version/environment

## Why each check exists

| Check             | What it catches                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| CodeQL            | A known-bad code pattern slipping into an "approved" baseline                                     |
| gitleaks          | A secret getting baked permanently into git history                                               |
| Coverage delta    | Untested code quietly becoming part of the shipped configuration                                  |
| Dependabot queue  | A known CVE in a dependency being present in what we're about to call "approved"                  |
| CRs resolved      | A baseline claiming to include work that was never actually finished/reviewed                     |
| Tag signature     | No way to prove _who_ approved this baseline, or that it wasn't tampered with after the fact      |
| Baseline register | The whole point of an audit — if this table's stale, nobody downstream can trust "what's in prod" |
| Status ledger     | Same idea, but for "where is it," not "what is it"                                                |

## Audit log

| Baseline tag                 | Date       | Run by           | Result                    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ---------- | ---------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BL-01-identification-intro` | 2026-08-06 | Aditya Raj Arora | Pass, with one gap noted  | CodeQL: clean (0 open alerts). gitleaks: clean. Coverage delta: **not measured** - Codecov was never connected to a real account/token, so `codecov/patch` isn't a real signal yet (dropped from required checks back in Step 5). Dependabot queue: empty. CRs resolved: all 8 closed as part of this audit (CR-001, CR-003, CR-019, CR-021, CR-024, CR-027, CR-029, CR-032) - they'd been merged for a while but never auto-closed, since PRs used `Refs:` instead of a GitHub closing keyword; fixed the PR template (see CR-038) so this doesn't recur. Tag signature: verifies (`git tag -v`). Register + ledger: this PR.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `BL-02-dependency-hardening` | 2026-08-20 | Aditya Raj Arora | Pass, with two gaps noted | CodeQL: clean (0 open alerts, both `code-scanning/alerts` and per-PR checks). gitleaks: clean on every PR. Coverage delta: **still not measured** - same Codecov gap as BL-01, unchanged. Dependabot queue: empty (6 PRs merged this cycle: #49, #46, #45, #44, #43, #41). CRs resolved: **none formally opened** - this baseline is routine dependency/CI hygiene (Dependabot bumps + the deploy-pipeline fixes already closed under BL-01's CRs), no user-facing or content change, so no `CR-NNN` was filed; noted as a process gap in `BASELINE-REGISTER.md` rather than silently skipped. Tag signature: verifies (`git tag -v v0.1.1` and `git tag -v BL-02-dependency-hardening`, both good). Register + ledger: this PR. One real bug caught mid-audit: Dependabot's vite 6→8 PR (#41) broke `npm ci` (ERESOLVE against `@vitejs/plugin-react@4.7.0`) and had been sitting red for 10 days - fixed by bumping `@vitejs/plugin-react` to `^6.1.0` in the same PR, verified locally (typecheck/lint/test/build all green) before merge. Prod deploy independently verified live via the required-reviewer gate (run `32366836650`, approved and completed). |
