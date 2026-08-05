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

| Check | What it catches |
|---|---|
| CodeQL | A known-bad code pattern slipping into an "approved" baseline |
| gitleaks | A secret getting baked permanently into git history |
| Coverage delta | Untested code quietly becoming part of the shipped configuration |
| Dependabot queue | A known CVE in a dependency being present in what we're about to call "approved" |
| CRs resolved | A baseline claiming to include work that was never actually finished/reviewed |
| Tag signature | No way to prove *who* approved this baseline, or that it wasn't tampered with after the fact |
| Baseline register | The whole point of an audit — if this table's stale, nobody downstream can trust "what's in prod" |
| Status ledger | Same idea, but for "where is it," not "what is it" |

## Audit log

| Baseline tag | Date | Run by | Result | Notes |
|---|---|---|---|---|
| _(none yet)_ | | | | |
