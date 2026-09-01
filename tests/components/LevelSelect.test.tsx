import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0601 from "../../content/chapters/ch06-build-release/LVL-06-01-which-tag-lied.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    kind: "quiz",
    id: "LVL-06-01-which-tag-lied",
    chapterId: "ch06-build-release",
    title: "Which Tag Lied?",
    level: parseLevel(rawLvl0601),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch06-build-release" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Which Tag Lied?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Which Tag Lied?" }));

    expect(onSelect).toHaveBeenCalledWith("LVL-06-01-which-tag-lied");
  });
});
