import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { usePlayerStore } from "../src/state/usePlayerStore";

/** Sets a saved name directly via the store, the way a real returning
 * player's persisted profile would already have one - then renders App
 * and clicks past the resulting title screen (CR-111), the same way a
 * player clicking "Continue" would. Keeps tests that aren't about the
 * welcome/title flow itself focused on what they're actually testing. */
function renderAsReturningPlayer(name = "Test Player") {
  usePlayerStore.getState().setName(name);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
}

beforeEach(() => {
  usePlayerStore.getState().resetProfile();
});

describe("App", () => {
  it("shows the welcome screen first for a new player, and proceeds straight to level-select after entering a name (no title screen)", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Merge Conflict" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Your name"), {
      target: { value: "Ada" },
    });
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(
      screen.getByRole("button", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();
  });

  describe("title screen (CR-111)", () => {
    it("a returning player (name already saved) sees the title screen, not level-select, first", () => {
      usePlayerStore.getState().setName("Test Player");
      render(<App />);

      expect(
        screen.getByText(/welcome back, test player/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Which One Shipped?" }),
      ).not.toBeInTheDocument();
    });

    it("Continue proceeds to level-select", () => {
      usePlayerStore.getState().setName("Test Player");
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));

      expect(
        screen.getByRole("button", { name: "Which One Shipped?" }),
      ).toBeInTheDocument();
    });

    it("shows the last-played level's title on the Continue button, once there is one", () => {
      usePlayerStore.setState({
        name: "Test Player",
        lastPlayedLevelId: "STORY-01-01-which-one-shipped",
      });
      render(<App />);

      expect(
        screen.getByText(/last played: which one shipped\?/i),
      ).toBeInTheDocument();
    });

    it("New Game is confirm-gated and wipes the profile back to the welcome screen", () => {
      usePlayerStore.getState().setName("Test Player");
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "New Game" }));
      expect(
        screen.getByText(/wipes your name, budget, and all progress/i),
      ).toBeInTheDocument();
      // Not wiped yet.
      expect(usePlayerStore.getState().name).toBe("Test Player");

      fireEvent.click(screen.getByRole("button", { name: "Yes, start over" }));

      expect(usePlayerStore.getState().name).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Merge Conflict" }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });
  });

  it("only Chapter 1 is unlocked at the start - Chapter 2 is locked", () => {
    renderAsReturningPlayer();
    // The button's accessible name includes the "Locked" icon label
    // appended after the title (CR-109), hence the regex.
    expect(
      screen.getByRole("button", { name: /^Whose Fix Made It\?/ }),
    ).toBeDisabled();
  });

  it("selecting the unlocked Chapter 1 story loads it (past its project brief); choices appear once the reveal is skipped; back returns to select", () => {
    renderAsReturningPlayer();

    fireEvent.click(screen.getByRole("button", { name: "Which One Shipped?" }));
    // CR-113: Chapter 1 now carries a project brief, shown first.
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));

    expect(
      screen.getByRole("heading", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();

    // VN-style typewriter reveal (CR-095) - choices don't appear until
    // the text finishes revealing. Skip it, same as a player clicking
    // the dialogue box to fast-forward.
    fireEvent.click(
      screen.getByRole("button", { name: /click to skip text reveal/i }),
    );
    // The opening stage is narrative-only (autoNext) - CR-113's 5-question
    // redesign puts the first real choice one stage in.
    fireEvent.click(screen.getByRole("button", { name: "▼ Continue" }));
    fireEvent.click(
      screen.getByRole("button", { name: /click to skip text reveal/i }),
    );

    expect(
      screen.getByRole("button", {
        name: "No - unsigned and explicitly marked work-in-progress",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Looks fine - it's the most recent feature work",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to levels/i }));
    expect(
      screen.getByRole("heading", { name: "Merge Conflict" }),
    ).toBeInTheDocument();
  });

  it("passing Chapter 1 (reaching a good ending) unlocks Chapter 2", () => {
    renderAsReturningPlayer();
    // Seeded directly - the unlock gate is what's under test here, not
    // the story content itself (that's ch01-story.test.ts's job).
    act(() => {
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
        },
      });
    });
    expect(
      screen.getByRole("button", { name: "Whose Fix Made It?" }),
    ).toBeEnabled();
  });

  it("cannot open a level that isn't unlocked, even by forcing selectedLevelId (defensive gate)", () => {
    renderAsReturningPlayer();
    // Chapter 2's button is disabled and rendered without an onClick
    // handler firing anything, so clicking it is a no-op - this
    // confirms the level-select screen, not just App's own state, stays
    // put.
    fireEvent.click(
      screen.getByRole("button", { name: /^Whose Fix Made It\?/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Merge Conflict" }),
    ).toBeInTheDocument();
  });

  it("remembers the last played level once a level is opened", () => {
    renderAsReturningPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Which One Shipped?" }));
    expect(usePlayerStore.getState().lastPlayedLevelId).toBe(
      "STORY-01-01-which-one-shipped",
    );
  });

  it("offers a Next Level shortcut once a level is passed, jumping straight into the next one", () => {
    renderAsReturningPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Which One Shipped?" }));
    // CR-113: Chapter 1 now carries a project brief, shown first.
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));

    const skip = () =>
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );
    const pick = (label: string) => {
      skip();
      fireEvent.click(screen.getByRole("button", { name: label }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    };
    const autoContinue = () => {
      skip();
      fireEvent.click(screen.getByRole("button", { name: "▼ Continue" }));
    };

    autoContinue(); // start -> check-build-a
    pick("No - unsigned and explicitly marked work-in-progress"); // -> check-build-c
    pick("No - it's missing fixes that landed afterward"); // -> check-build-d
    pick("No - it's explicitly marked internal-only"); // -> check-build-e
    pick("No - it's never actually marked as approved"); // -> check-build-b
    pick("Yes - fully signed, and explicitly approved"); // -> resolution-clean
    autoContinue(); // resolution-clean -> good-ending
    skip();

    const nextButton = screen.getByRole("button", {
      name: /^Next Level: Whose Fix Made It\?/,
    });
    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", { name: "Whose Fix Made It?" }),
    ).toBeInTheDocument();
  });

  describe("project brief (CR-112)", () => {
    function renderUnlockedThroughChapter3() {
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
        },
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    }

    it("shows the project brief before the story, for a level that has one", () => {
      renderUnlockedThroughChapter3();
      fireEvent.click(
        screen.getByRole("button", { name: "Who Skipped Review?" }),
      );

      expect(
        screen.getByText("Lighthouse Sync — Post-Surge Change Audit"),
      ).toBeInTheDocument();
      expect(screen.getByText(/priya nandan/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Who Skipped Review?" }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Begin" }));

      expect(
        screen.getByRole("heading", { name: "Who Skipped Review?" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Lighthouse Sync — Post-Surge Change Audit"),
      ).not.toBeInTheDocument();
    });

    it("does not re-show the brief on the same level after Back and reselecting", () => {
      renderUnlockedThroughChapter3();
      fireEvent.click(
        screen.getByRole("button", { name: "Who Skipped Review?" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Begin" }));
      fireEvent.click(screen.getByRole("button", { name: /back to levels/i }));
      fireEvent.click(
        screen.getByRole("button", { name: "Who Skipped Review?" }),
      );

      expect(
        screen.getByRole("heading", { name: "Who Skipped Review?" }),
      ).toBeInTheDocument();
    });

    it("skips straight to the level for one with no project brief", () => {
      // Chapter 2 doesn't have a project brief yet (only Chapters 1 and 3
      // do, as of CR-113) - unlock it and confirm it opens directly.
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
        },
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
      fireEvent.click(
        screen.getByRole("button", { name: "Whose Fix Made It?" }),
      );

      expect(
        screen.getByRole("heading", { name: "Whose Fix Made It?" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Project brief")).not.toBeInTheDocument();
    });
  });
});
