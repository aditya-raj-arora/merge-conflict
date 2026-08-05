# Baseline Register

This is the permanent record of every baseline we've ever cut. A "baseline"
here means a signed `BL-<NN>-<name>` tag — a point where we said "this
configuration is approved, and here's proof of who approved it."

Every row gets added the moment a baseline tag is pushed, never edited
retroactively (if something about a past baseline turns out to be wrong,
that's a new CR and a note in this table, not a silent rewrite — see
`AUDIT-CHECKLIST.md`).

## Register

| Tag | Date | Signer | Included CIs (versions) | Closed CRs | Approved by | Notes |
|---|---|---|---|---|---|---|
| _(none yet — first baseline lands at the end of Ch.1, `BL-01-identification-intro`)_ | | | | | | |

## How to read this table

- **Tag** — the `BL-<NN>-<name>` signed annotated tag, e.g. `BL-01-identification-intro`
- **Date** — when the tag was pushed
- **Signer** — whoever's GPG key signed the tag
- **Included CIs (versions)** — the top-level CIs (usually TLCSC/LLCSC level)
  that changed in this baseline, with their `_r<REV>` values, per the naming
  scheme in `SCM-PLAN-v1.0.md` §3
- **Closed CRs** — which `CR-NNN` Issues this baseline resolves
- **Approved by** — who signed off in the CCB decision (usually the PR
  reviewer, not necessarily the same person as Signer)
- **Notes** — anything unusual: hotfixes, deviations, known gaps
