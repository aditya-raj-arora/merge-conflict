# Gate Evidence

This doc exists to answer one question: **how do we know the gates
actually work, and aren't just YAML that happens to exist?**

Produced by a throwaway branch (`throwaway/gate-evidence`, off a PR that
was never merged) that deliberately tripped each gate one at a time.
Nothing from that branch ever reached `develop` or `main` - this file is
the only thing that survives it, cherry-picked onto its own change.

Refs: CR-021

## 1. Non-conventional commit message

**What we did:** tried to commit with the message
`this is not a conventional commit` (no type, no colon, no subject).

**Result:** blocked locally by the `commit-msg` Husky hook before it ever
reached a commit object.

```
⧗   input: this is not a conventional commit
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
husky - commit-msg script failed (code 1)
```

**Second layer:** even if someone bypassed the local hook (`--no-verify`)
and pushed anyway, opening a PR with a non-conventional _title_ fails the
`commitlint-pr-title` required status check in CI - see the
`commitlint-pr-title: fail` runs on Dependabot PRs #5-#9 earlier in this
project's history (before CR-019 relaxed the subject-case rule) for a
real example of this happening organically, not just staged for this doc.

## 2. Secret in a staged file

**What we did:** committed `.gate-evidence-secret-test.txt` containing a
fake, well-formed AWS access key ID (`AKIA` + 16 uppercase letters -
matches the shape gitleaks looks for, isn't a real credential). Value
intentionally not reproduced verbatim in this doc - see below.

**Result, local layer:** blocked by the `pre-commit` Husky hook before
the commit was created:

```
Finding:     AWS_ACCESS_KEY_ID=REDACTED
Secret:      REDACTED
RuleID:      aws-access-token
Entropy:     3.884184
File:        .gate-evidence-secret-test.txt
Line:        2

gitleaks found something that looks like a secret in your staged changes.
husky - pre-commit script failed (code 1)
```

**Result, remote layer:** bypassed the local hook with `--no-verify`
(intentional, for this exercise) and pushed anyway. The `gitleaks`
required status check failed on the PR:
[run 31009921550](https://github.com/aditya-raj-arora/merge-conflict/actions/runs/31009921550/job/92319152377)

- confirms the belt-and-braces design (local hook + CI job) actually has
  two independent layers, not just one that happens to work.

## 3. Unsigned commit

**What we did:** created a commit with `git commit --no-gpg-sign`
(deliberately bypassing our own `commit.gpgsign true` git config) and
pushed it straight to the PR branch with `git push --no-verify`.

**Result:** GitHub's commit API confirms the commit is unverified:

```json
{
  "payload": null,
  "reason": "unsigned",
  "signature": null,
  "verified": false,
  "verified_at": null
}
```

The PR's `mergeStateStatus` immediately flipped to `BLOCKED` (while still
reporting `mergeable: MERGEABLE` - i.e. no content conflict, purely the
signature requirement holding it back). Did not attempt an actual merge
call to force a rejection message out of the API - the read-only
verification data above is sufficient evidence, and repeatedly calling
`gh pr merge` against a protected branch isn't something to do just to
watch it fail.

Test file removed in the next commit (properly signed) - this branch's
history still contains the one unsigned commit, which is fine since the
whole branch gets deleted at the end of this exercise without ever
merging.
