# Contributing to Merge Conflict

Quick heads up before anything else: this repo is graded on how well we
_use_ SCM process, not just on shipped features. So yeah, the workflow below
looks like overkill for a two-person student project — that's the point,
don't skip steps because "it's just us."

## The one rule that overrides everything else

**No direct commits to `main` or `develop`. Ever.** Not a one-line typo fix,
not a docs tweak, nothing. Both branches are protected — you physically
can't push to them directly even if you wanted to. Everything goes through a
branch + PR.

(The lone exception: the very first scaffold commit on `main`, which is
called out explicitly in its own commit message as the one-time exception
that proves the rule.)

## Branching model

- **`main`** — production. Only fast-forward pushes from a released commit
  (see CR-123). Protected: status checks must pass, signed commits required,
  no force-push, no deletions, admins included. Deliberately _not_ PR-gated:
  with force-push disabled, dropping the PR rule is what makes pushes
  fast-forward-only, which is the guarantee that actually matters here —
  `main` can only ever move forward onto a commit that already exists, fully
  reviewed and tagged, on `develop`. Nothing is authored on `main`.
- **`develop`** — integration branch. All feature work PRs into here first.
  Protected: PR required, status checks, signed commits required.
- **`feat/*`, `fix/*`, `docs/*`, `test/*`, `refactor/*`, `chore/*`, `ci/*`** —
  short-lived, one branch per Issue, deleted after merge.
- **`release/vX.Y.Z`** — cut from `develop` when a chapter's done. Only patch
  fixes land here. Merges to `main` (tagged) and back-merges to `develop`.

Branch naming: `<type>/<scope>-<short-description>`, e.g. `feat/vcs-merge`.

## Issue-first workflow

If there's no Issue for it, don't write the code yet. Every code change
starts life as a **CR (Change Request)** Issue:

1. Open an Issue using the `change-request` template.
2. Tag it with the discipline it belongs to: `ci`, `vcs`, `ccb`, `audit`,
   `release`, or `status`.
3. If it's still a fuzzy idea rather than a concrete change, start a
   **Discussion** (RFC template) first — Discussions are for "should we do
   this at all," Issues are for "here's the change we're doing."
4. Once the Issue exists (it'll get a number, e.g. `#42`), branch off
   `develop`, do the work, reference `CR-42` in every commit.

## Commit format — Conventional Commits, no exceptions

```
type(scope): imperative summary

optional body

Refs: CR-NNN
```

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`,
`build`, `release`.

Easiest way to not mess this up: run `npm run cz` instead of `git commit` —
Commitizen walks you through it interactively. `commitlint` also runs as a
git hook, so a malformed message just won't commit.

## Signing commits

Every commit and tag must be GPG-signed — `commit.gpgsign` and
`tag.gpgsign` should already be `true` in your global git config (see the
main project setup). If you haven't set up a signing key yet:

```bash
gpg --full-generate-key
```

Pick ECC (Curve 25519), no expiry, and use the email tied to your GitHub
account. Then:

```bash
git config --global user.signingkey <your-long-key-id>
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Upload the public key (`gpg --armor --export <key-id>`) to GitHub yourself
under Settings → SSH and GPG keys. Branch protection will simply reject
unsigned commits at merge time, so this isn't optional.

## PR checklist

Every PR:

- [ ] Targets `develop` (never `main` directly)
- [ ] Title matches the intended squash-merge Conventional Commit
- [ ] Linked to a `CR-` Issue
- [ ] Tests added/updated where relevant
- [ ] Docs updated where relevant
- [ ] `CHANGELOG.md` entry added under `[Unreleased]`
- [ ] `BASELINE-REGISTER.md` updated if this PR closes out an increment
- [ ] All commits are Conventional + signed
- [ ] CI is green (lint, typecheck, test, build, CodeQL, gitleaks, Codecov)

## Definition of done

An increment (chapter/feature) isn't "done" until:

1. It's playable end to end in the browser.
2. Its failure state is reachable and explained in the debrief.
3. All CI checks pass.
4. Level fixtures pass solvability tests.
5. The level-schema spec doc matches what's actually shipped.
6. `CHANGELOG.md`, `BASELINE-REGISTER.md`, `STATUS-LEDGER.md` are all updated.
7. Dependabot queue for the release is empty.
8. A signed semver tag exists, verifies, and passed the `prod` Environment gate.
9. A signed `BL-<NN>-<name>` baseline tag exists alongside the semver tag.
10. Every commit in the increment is signed, Conventional, and references a `CR-` Issue.

If any of these is missing, it's not done — log the gap and open a follow-up
CR instead of quietly shipping it half-finished.
