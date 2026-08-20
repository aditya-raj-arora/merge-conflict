# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning
follows [Semantic Versioning](https://semver.org/).

This file is auto-maintained going forward by `release-please` off our
Conventional Commit history — we just keep the `[Unreleased]` section honest
in the meantime.

## [0.1.1](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.1.0...v0.1.1) (2026-08-20)


### Bug Fixes

* **release:** let Vercel build remotely instead of deploying our dist/ as-is ([41e9c17](https://github.com/aditya-raj-arora/merge-conflict/commit/41e9c17ce3d2849109d2c13208b8a2e194e9e69a))
* **release:** rework deploy pipeline - Vercel staging, github-pages-gated prod ([1b676f8](https://github.com/aditya-raj-arora/merge-conflict/commit/1b676f8d3c07e4ecbcbd3464ddb3d9eb3bf098ba))
* **release:** stop release-please from prefixing tags with the component name ([262316c](https://github.com/aditya-raj-arora/merge-conflict/commit/262316cdade2befe631379cde0e1146a79775634))

## 0.1.0 (2026-08-06)


### Features

* **content:** Chapter 1 first playable slice - Which One Shipped? ([5306e58](https://github.com/aditya-raj-arora/merge-conflict/commit/5306e58363c6d96705160621e9b1d5e6dc47ab3a))


### Bug Fixes

* **quality:** allow sentence-case commit subjects for Dependabot PR titles ([88b03e2](https://github.com/aditya-raj-arora/merge-conflict/commit/88b03e28421078dac788f85292d14c64f8f6fbd3))


### Documentation

* **scm:** document and force the v0.1.0-not-v1.0.0 first release ([a2a83b3](https://github.com/aditya-raj-arora/merge-conflict/commit/a2a83b334cb184f9d1a4fc5ae92abbbbd48d5ea9))

## [Unreleased]

### Added

- Initial project scaffold (repo structure, license, docs skeleton).
- Chapter 1 first playable slice: commit-graph engine, SVG graph
  renderer, Zustand game store, and the "Which One Shipped?" level -
  the opening Configuration Identification puzzle.
