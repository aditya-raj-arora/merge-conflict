---
name: Change Request (CR)
about: Propose a change that needs Change Control Board review before any code gets written
title: "CR-XXX: "
labels: change-request
assignees: ''
---

<!--
Heads up: this Issue *is* the CR. Don't write code for this until it's been
triaged and the CCB decision at the bottom is filled in as Approved. That's
the whole point of Change Control — no surprise commits, everything traces
back to one of these.
-->

## Summary

<!-- One or two sentences. What's changing? -->

## Discipline

<!-- Check whichever discipline(s) this CR belongs to -->

- [ ] Configuration Identification (`ci`)
- [ ] Version Control (`vcs`)
- [ ] Change Control (`ccb`)
- [ ] Status Accounting (`status`)
- [ ] Configuration Audit (`audit`)
- [ ] Build & Release Management (`release`)

## Motivation

<!-- Why does this need to happen? What breaks/is missing without it? -->

## Proposed change

<!-- What are we actually going to do about it? -->

## Affected CIs

<!--
List the Configuration Items this touches, using our CSCI/TLCSC/LLCSC/CSU
naming (see docs/scm/SCM-PLAN-v1.0.md). E.g.:
- TLCSC-01-ENGINE > LLCSC-01-01-GRAPH > CSU-001-commitGraph.ts
-->

## Acceptance criteria

<!-- How do we know this is actually done? Be specific, this becomes the DoD check. -->

## Risk

<!-- Low / Medium / High, plus a sentence on why -->

## CCB decision

- [ ] Approved
- [ ] Rejected
- [ ] Deferred

<!-- Reviewer fills this in during triage, with a one-line reason -->
