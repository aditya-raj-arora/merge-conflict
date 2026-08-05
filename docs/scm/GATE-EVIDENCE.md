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
