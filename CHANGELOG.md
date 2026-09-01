# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning
follows [Semantic Versioning](https://semver.org/).

This file is auto-maintained going forward by `release-please` off our
Conventional Commit history — we just keep the `[Unreleased]` section honest
in the meantime.

## [0.7.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.6.0...v0.7.0) (2026-09-01)


### Features

* **content:** branching story engine mechanic; redesign Chapter 1 ([#92](https://github.com/aditya-raj-arora/merge-conflict/issues/92)) ([5259e3a](https://github.com/aditya-raj-arora/merge-conflict/commit/5259e3a2458ee745e0381b9939b046a25858e84e))

## [0.6.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.5.0...v0.6.0) (2026-09-01)


### Features

* **content:** Chapter 6 first playable slice - Which Tag Lied? ([#84](https://github.com/aditya-raj-arora/merge-conflict/issues/84)) ([3839a25](https://github.com/aditya-raj-arora/merge-conflict/commit/3839a25f1b99b88f3c34a79e9ad963510a2d0787))

## [0.5.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.4.0...v0.5.0) (2026-08-20)


### Features

* **content:** Chapter 5 first playable slice - Does It Still Match? ([#74](https://github.com/aditya-raj-arora/merge-conflict/issues/74)) ([d8ba23d](https://github.com/aditya-raj-arora/merge-conflict/commit/d8ba23d602e75fdde73d8ce2d78b0c22e42b92a4))

## [0.4.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.3.0...v0.4.0) (2026-08-20)


### Features

* **content:** Chapter 4 first playable slice - What's Actually Live? ([#70](https://github.com/aditya-raj-arora/merge-conflict/issues/70)) ([9d7bf3f](https://github.com/aditya-raj-arora/merge-conflict/commit/9d7bf3fb02f3e4ec8bc821798383f44055ac4efc))

## [0.3.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.2.1...v0.3.0) (2026-08-20)


### Features

* **content:** Chapter 3 first playable slice - Who Skipped Review? ([#66](https://github.com/aditya-raj-arora/merge-conflict/issues/66)) ([045e940](https://github.com/aditya-raj-arora/merge-conflict/commit/045e940792515551e79f94cc84884efb68e6ce55))

## [0.2.1](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.2.0...v0.2.1) (2026-08-20)


### Features

* **ui:** level-select screen so all shipped levels are reachable ([#59](https://github.com/aditya-raj-arora/merge-conflict/issues/59)) ([49aa7a9](https://github.com/aditya-raj-arora/merge-conflict/commit/49aa7a943fb3adc3b50dc176331c46b18e93e14d))


### Continuous Integration

* force v0.2.1 for the level-select release ([fd53cfd](https://github.com/aditya-raj-arora/merge-conflict/commit/fd53cfd48ceabc44d21927a7fe6f76b7742648d8))

## [0.2.0](https://github.com/aditya-raj-arora/merge-conflict/compare/v0.1.1...v0.2.0) (2026-08-20)


### Features

* **content:** Chapter 2 first playable slice - Whose Fix Made It? ([#52](https://github.com/aditya-raj-arora/merge-conflict/issues/52)) ([cbe431b](https://github.com/aditya-raj-arora/merge-conflict/commit/cbe431bdc50c88c6dcfdabdad49a30dbe2163bc5))


### Bug Fixes

* **release:** pre-1.0 feat commits should bump MINOR, not PATCH ([#55](https://github.com/aditya-raj-arora/merge-conflict/issues/55)) ([6f262f4](https://github.com/aditya-raj-arora/merge-conflict/commit/6f262f44cfb41684333287b94f65b81c0ffde78c))

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
