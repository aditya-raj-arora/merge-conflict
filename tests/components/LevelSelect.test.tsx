import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0101 from "../../content/chapters/ch01-identification/LVL-01-01-which-one-shipped.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    id: "LVL-01-01-which-one-shipped",
    chapterId: "ch01-identification",
    title: "Which One Shipped?",
    level: parseLevel(rawLvl0101),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch01-identification" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Which One Shipped?" }));

    expect(onSelect).toHaveBeenCalledWith("LVL-01-01-which-one-shipped");
  });
});
