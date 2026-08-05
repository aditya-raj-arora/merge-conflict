import { describe, expect, it } from "vitest";

describe("gate-evidence: intentional failure", () => {
  it("fails on purpose to test the CI gate", () => {
    expect(1 + 1).toBe(3);
  });
});
