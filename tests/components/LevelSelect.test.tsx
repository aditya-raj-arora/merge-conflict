import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import type { ManifestEntry } from "../../content/levelManifest";
import rawLvl0501 from "../../content/chapters/ch05-configuration-audit/LVL-05-01-does-it-still-match.json";
import { parseLevel } from "../../src/engine/mechanics/level";

const entries: ManifestEntry[] = [
  {
    kind: "quiz",
    id: "LVL-05-01-does-it-still-match",
    chapterId: "ch05-configuration-audit",
    title: "Does It Still Match?",
    level: parseLevel(rawLvl0501),
  },
];

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "ch05-configuration-audit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Does It Still Match?" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelect entries={entries} onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Does It Still Match?" }),
    );

    expect(onSelect).toHaveBeenCalledWith("LVL-05-01-does-it-still-match");
  });
});
