import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import { toQuizEntry } from "../../content/levelManifest";

// As of CR-108 every registered chapter is story-format, so this test no
// longer borrows a real chapter's quiz fixture (that pattern broke on every
// chapter redesign - see CR-106/CR-107's history). A minimal synthetic quiz
// level, built with the same toQuizEntry() helper the manifest itself uses,
// exercises the "quiz" branch of LevelSelect's polymorphic entry rendering
// without depending on any particular chapter staying in quiz format.
const syntheticQuizLevel = {
  id: "LVL-TEST-01-synthetic",
  chapterId: "ch-test-synthetic",
  title: "Synthetic Test Level",
  narrative: {
    intro: "intro",
    correctDebrief: "correct",
    incorrectDebrief: "incorrect",
  },
  graph: {
    commits: {
      c1: {
        id: "c1",
        parentIds: [],
        message: "init",
        authorSigned: true,
        timestamp: 0,
      },
    },
    refs: { main: { name: "main", commitId: "c1" } },
    head: { type: "branch", name: "main" },
  },
  prompt: "prompt",
  options: [{ id: "a", label: "A" }],
  correctOptionId: "a",
};

const entries: ManifestEntry[] = [toQuizEntry(syntheticQuizLevel)];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch-test-synthetic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Synthetic Test Level" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Synthetic Test Level" }),
    );

    expect(onSelect).toHaveBeenCalledWith("LVL-TEST-01-synthetic");
  });
});
