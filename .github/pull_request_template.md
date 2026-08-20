<!--
Quick reminder before you fill this out: this PR should be targeting
`develop` (or `main` only if it's a release/* branch). If GitHub is showing
you a base branch of `main` and this isn't a release PR, stop and fix that
first.
-->

## Linked CR

Closes #<!-- issue number -->

<!--
Use a real GitHub closing keyword (Closes/Fixes/Resolves #NNN), not just
"Refs: CR-NNN" - the latter shows up in the commit body for traceability
but does NOT auto-close the Issue on merge. Learned this the hard way in
CR-038: eight resolved CRs sat open for days because every PR only used
Refs. Still add "Refs: CR-NNN" in the squash-merge commit body too (that
part's for commit-history traceability, this closing keyword is for the
Issue itself).
-->

## What changed and why

<!-- Keep it short, the CR issue has the full motivation -->

## Checklist

- [ ] Linked to a `CR-` Issue (above)
- [ ] Tests added/updated where relevant
- [ ] Docs updated where relevant
- [ ] `CHANGELOG.md` entry added under `[Unreleased]`
- [ ] `docs/scm/BASELINE-REGISTER.md` updated (only if this PR closes out an increment)
- [ ] Every commit follows Conventional Commits format
- [ ] Every commit is GPG-signed
- [ ] PR title matches the intended squash-merge commit message
- [ ] This was NOT pushed directly to `main` or `develop` — it's a PR, obviously, but saying it anyway
