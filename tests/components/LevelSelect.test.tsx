import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0301 from "../../content/chapters/ch03-change-control/LVL-03-01-who-skipped-review.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    kind: "quiz",
    id: "LVL-03-01-who-skipped-review",
    chapterId: "ch03-change-control",
    title: "Who Skipped Review?",
    level: parseLevel(rawLvl0301),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch03-change-control" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Who Skipped Review?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Who Skipped Review?" }),
    );

    expect(onSelect).toHaveBeenCalledWith("LVL-03-01-who-skipped-review");
  });
});
