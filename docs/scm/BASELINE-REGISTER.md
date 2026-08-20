# Baseline Register

This is the permanent record of every baseline we've ever cut. A "baseline"
here means a signed `BL-<NN>-<name>` tag — a point where we said "this
configuration is approved, and here's proof of who approved it."

Every row gets added the moment a baseline tag is pushed, never edited
retroactively (if something about a past baseline turns out to be wrong,
that's a new CR and a note in this table, not a silent rewrite — see
`AUDIT-CHECKLIST.md`).

## Register

| Tag                                               | Date       | Signer           | Included CIs (versions)                                                                                                                                                                                                       | Closed CRs                                     | Approved by                                                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BL-01-identification-intro` (alongside `v0.1.0`) | 2026-08-06 | Aditya Raj Arora | `LLCSC-01.01-SRC-commitGraph_r1`, `LLCSC-01.01-SRC-layout_r1`, `LLCSC-01.02-SRC-level_r1`, `TLCSC-02-SRC-GraphCanvas_r1`, `TLCSC-02-SRC-LevelView_r1`, `TLCSC-03-SRC-useGameStore_r1`, `LLCSC-04.01-LVL-which-one-shipped_r1` | CR-024, CR-019, CR-027, CR-029, CR-032, CR-034 | Aditya Raj Arora (solo bootstrap — see SCM-PLAN-v1.0.md §5.1) | First baseline. Both tags point at commit `6b07bbc`. Deploy pipeline needed three follow-up fixes after this baseline was cut (CR-029, CR-032, CR-034) before staging/prod deploys actually worked — see AUDIT-CHECKLIST.md log and GATE-EVIDENCE.md for the full trail. Both deploy paths independently verified live post-fix: staging (Vercel) and prod (GitHub Pages, at https://aditya-raj-arora.github.io/merge-conflict/) via the real required-reviewer gate. |

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
