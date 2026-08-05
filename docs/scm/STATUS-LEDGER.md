# Status Ledger

The "what version is where, right now" doc — status accounting in one table.
Update this whenever something's version or environment changes; the GitHub
Projects board is the live/granular version of the same info, this is the
point-in-time snapshot we take at every increment (and it's what an auditor
would actually check first).

## Ledger

| Item | Current Version | Environment | Last Change | Open CRs |
|---|---|---|---|---|
| CSCI-MC (whole app) | unreleased | — | Repo scaffold ([`aaa803d`](../../CHANGELOG.md)) | CR-001 |

*(Table grows one row per top-level CI as they come online — engine,
components, content chapters, etc. Right now there's nothing shipped yet, so
it's just the CSCI-level placeholder.)*

## How to read this table

- **Item** — the CI, usually at TLCSC or LLCSC granularity (CSU-level would
  make this table unreadable fast)
- **Current Version** — semver tag if released, or `unreleased` /
  commit-hash if still in development
- **Environment** — `dev` / `staging` / `prod`, or `—` if not deployed anywhere
- **Last Change** — date or commit reference of the most recent update
- **Open CRs** — any `CR-NNN` Issues still open against this item
