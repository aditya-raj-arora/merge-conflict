# Security Policy

Yeah, this is a student project and not, like, a bank — but a security policy
is still an actual SCM instrument: it's the pre-defined change route for any
CR that touches something security-sensitive, so we're not improvising one
mid-panic. Here's how it works.

## Reporting a Vulnerability

**Please don't open a public GitHub Issue for a security problem.** Anything
filed publicly is visible before we've had a chance to fix it.

Instead, report privately using GitHub's built-in private vulnerability
reporting:

1. Go to the repo's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe what you found — what's affected, how to reproduce it, and how
   bad you think the impact is.

If for some reason that's not available, email
**adityarajarora123@gmail.com** directly with `[SECURITY]` in the subject
line.

## What happens next

- We'll acknowledge the report within a few days.
- If it's valid, we open a **CR (change request) Issue** for it same as any
  other change — except the description of the vulnerability itself stays
  private until a fix is merged and released, so we're not shipping an
  exploit guide alongside the bug.
- It gets triaged through the normal Change Control Board process (a PR into
  `develop`, reviewed, signed commits, all of it) — security fixes don't skip
  the pipeline, they just skip the "publicly visible while unfixed" part.
- Once patched, we credit the reporter (if they want credit) in the
  `CHANGELOG.md` entry for the fix.

## Supported versions

Since this is a single continuously-released project (no LTS branches), only
the latest tagged release on `main` is supported. If you're running an older
tag, please update.
