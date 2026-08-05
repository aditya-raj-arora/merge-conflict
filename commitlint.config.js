export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "test",
        "refactor",
        "chore",
        "ci",
        "build",
        "release",
      ],
    ],
    // The default config-conventional rule disallows sentence-case
    // subjects, but Dependabot always titles its PRs "Bump X from Y to Z"
    // (sentence-case) - which would otherwise fail commitlint-pr-title on
    // every single dependency-update PR. Narrowed to still catch the
    // genuinely-wrong cases (Start Case, PascalCase, UPPERCASE) without
    // blocking Dependabot's PRs. See CR-019.
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
  },
};
