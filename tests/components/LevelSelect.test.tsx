import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0201 from "../../content/chapters/ch02-version-control/LVL-02-01-whose-fix-made-it.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    kind: "quiz",
    id: "LVL-02-01-whose-fix-made-it",
    chapterId: "ch02-version-control",
    title: "Whose Fix Made It?",
    level: parseLevel(rawLvl0201),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch02-version-control" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Whose Fix Made It?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Whose Fix Made It?" }));

    expect(onSelect).toHaveBeenCalledWith("LVL-02-01-whose-fix-made-it");
  });
});
