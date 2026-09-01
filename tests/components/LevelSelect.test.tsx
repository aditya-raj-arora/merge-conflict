import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0401 from "../../content/chapters/ch04-status-accounting/LVL-04-01-whats-actually-live.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    kind: "quiz",
    id: "LVL-04-01-whats-actually-live",
    chapterId: "ch04-status-accounting",
    title: "What's Actually Live?",
    level: parseLevel(rawLvl0401),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch04-status-accounting" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "What's Actually Live?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole("button", { name: "What's Actually Live?" }),
    );

    expect(onSelect).toHaveBeenCalledWith("LVL-04-01-whats-actually-live");
  });
});
