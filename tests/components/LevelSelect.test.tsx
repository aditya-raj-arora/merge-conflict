import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LevelSelect } from "../../src/components/LevelSelect";
import { usePlayerStore } from "../../src/state/usePlayerStore";
import { STARTING_BUDGET } from "../../src/engine/economy";
import type { ManifestEntry } from "../../content/levelManifest";
import { levelManifest, toQuizEntry, TIERS } from "../../content/levelManifest";

// As of CR-108 every registered chapter is story-format, so this test no
// longer borrows a real chapter's quiz fixture (that pattern broke on every
// chapter redesign - see CR-106/CR-107's history). A minimal synthetic quiz
// level, built with the same toQuizEntry() helper the manifest itself uses,
// exercises the "quiz" branch of LevelSelect's polymorphic entry rendering
// without depending on any particular chapter staying in quiz format.
function makeSyntheticQuizLevel(id: string, title: string) {
  return {
    id,
    chapterId: "ch-test-synthetic",
    title,
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
}

const entries: ManifestEntry[] = [
  toQuizEntry(
    makeSyntheticQuizLevel("LVL-TEST-01-synthetic", "Synthetic Test Level"),
  ),
];

const twoEntries: ManifestEntry[] = [
  toQuizEntry(
    makeSyntheticQuizLevel("LVL-TEST-01-first", "First Synthetic Level"),
  ),
  toQuizEntry(
    makeSyntheticQuizLevel("LVL-TEST-02-second", "Second Synthetic Level"),
  ),
];

beforeEach(() => {
  usePlayerStore.getState().resetProfile();
});

describe("LevelSelect", () => {
  it("renders one button per entry, grouped under its chapter", () => {
    render(<LevelSelect entries={entries} onSelect={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "ch-test-synthetic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Synthetic Test Level" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the entry's id when clicked", () => {
    let selected: string | null = null;
    render(
      <LevelSelect entries={entries} onSelect={(id) => (selected = id)} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Synthetic Test Level" }),
    );

    expect(selected).toBe("LVL-TEST-01-synthetic");
  });

  it("the first level is always unlocked, even with no progress yet", () => {
    render(<LevelSelect entries={twoEntries} onSelect={() => {}} />);
    expect(
      screen.getByRole("button", { name: "First Synthetic Level" }),
    ).toBeEnabled();
  });

  it("a later level is locked (disabled) until the previous one is passed", () => {
    render(<LevelSelect entries={twoEntries} onSelect={() => {}} />);
    // The button's accessible name includes the "Locked" icon label
    // appended after the title (CR-109), hence the regex.
    expect(
      screen.getByRole("button", { name: /^Second Synthetic Level/ }),
    ).toBeDisabled();
  });

  it("a later level unlocks once the previous one is marked passed", () => {
    usePlayerStore.setState({
      progress: { "LVL-TEST-01-first": { passed: true, totalRuns: 1 } },
    });
    render(<LevelSelect entries={twoEntries} onSelect={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Second Synthetic Level" }),
    ).toBeEnabled();
  });

  it("shows the player's name and budget", () => {
    usePlayerStore.setState({ name: "Ada", budget: 12_345 });
    render(<LevelSelect entries={entries} onSelect={() => {}} />);
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Budget: 12,345")).toBeInTheDocument();
  });

  describe("reset progress (CR-110)", () => {
    it("clicking Reset progress shows an inline confirm step, not an immediate wipe", () => {
      usePlayerStore.setState({ name: "Ada", budget: 5_000 });
      render(<LevelSelect entries={entries} onSelect={() => {}} />);

      fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));

      expect(
        screen.getByText(/wipes your name, budget, and all progress/i),
      ).toBeInTheDocument();
      // Nothing was actually reset yet.
      expect(usePlayerStore.getState().name).toBe("Ada");
      expect(usePlayerStore.getState().budget).toBe(5_000);
    });

    it("Cancel dismisses the confirm step without resetting anything", () => {
      usePlayerStore.setState({ name: "Ada", budget: 5_000 });
      render(<LevelSelect entries={entries} onSelect={() => {}} />);

      fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        screen.queryByText(/wipes your name, budget, and all progress/i),
      ).not.toBeInTheDocument();
      expect(usePlayerStore.getState().name).toBe("Ada");
      expect(usePlayerStore.getState().budget).toBe(5_000);
    });

    it("Yes, reset wipes name, budget, and progress back to defaults", () => {
      usePlayerStore.setState({
        name: "Ada",
        budget: 5_000,
        progress: { "LVL-TEST-01-synthetic": { passed: true, totalRuns: 1 } },
      });
      render(<LevelSelect entries={entries} onSelect={() => {}} />);

      fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, reset" }));

      const state = usePlayerStore.getState();
      expect(state.name).toBeNull();
      expect(state.budget).toBe(STARTING_BUDGET);
      expect(state.progress).toEqual({});
    });
  });

  describe("tiers (CR-118)", () => {
    it("a chapter not listed in any tier renders with no tier header (synthetic fixtures)", () => {
      render(<LevelSelect entries={entries} onSelect={() => {}} />);
      for (const tier of TIERS) {
        expect(
          screen.queryByRole("heading", { name: tier.name }),
        ).not.toBeInTheDocument();
      }
    });

    it("renders a heading for each real tier, grouping its chapters underneath", () => {
      render(<LevelSelect entries={levelManifest} onSelect={() => {}} />);
      for (const tier of TIERS) {
        expect(
          screen.getByRole("heading", { name: tier.name }),
        ).toBeInTheDocument();
      }
    });

    it("a locked tier's first chapter shows how much more is needed, not just a lock icon", () => {
      // Tier 2 ("Operations") needs 2,000 earned - starting fresh, it
      // hasn't been.
      render(<LevelSelect entries={levelManifest} onSelect={() => {}} />);
      expect(
        screen.getByText(/unlocks at 2,000 earned — you have 0/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Who Skipped Review\?/ }),
      ).toBeDisabled();
    });

    it("passing both of Tier 1's chapters alone does not unlock Tier 2 without enough earned", () => {
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
        },
        totalEarned: 0,
      });
      render(<LevelSelect entries={levelManifest} onSelect={() => {}} />);
      expect(
        screen.getByRole("button", { name: /^Who Skipped Review\?/ }),
      ).toBeDisabled();
    });

    it("Tier 2's first chapter unlocks once totalEarned meets its threshold, even without Tier 1's last chapter passed", () => {
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          // Chapter 2 deliberately left unpassed - CR-118's hybrid gate
          // means Tier 2 no longer needs it, only the money.
        },
        totalEarned: 2_000,
      });
      render(<LevelSelect entries={levelManifest} onSelect={() => {}} />);
      expect(
        screen.getByRole("button", { name: "Who Skipped Review?" }),
      ).toBeEnabled();
      expect(
        screen.queryByText(/unlocks at 2,000 earned/i),
      ).not.toBeInTheDocument();
    });

    it("a tier's second chapter still needs the tier's first chapter passed, money aside", () => {
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
          // STORY-03-01 unlocked by money but never actually passed.
        },
        totalEarned: 2_000,
      });
      render(<LevelSelect entries={levelManifest} onSelect={() => {}} />);
      expect(
        screen.getByRole("button", { name: /^What Does Prod Actually Run\?/ }),
      ).toBeDisabled();
    });
  });
});
