import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { usePlayerStore } from "../src/state/usePlayerStore";
import { TIERS } from "../content/levelManifest";

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

  describe("welcome screen progression blurb (CR-119)", () => {
    it("explains the tier gate, naming each gated tier and its real threshold", () => {
      render(<App />);

      // The copy is generated from TIERS rather than written out by hand,
      // precisely so it can't go stale the way the pre-CR-119 wording did
      // (it still promised "pass one before the next becomes available"
      // for a whole release after CR-118 started charging for a tier).
      for (const tier of TIERS.filter((t) => t.unlockThreshold > 0)) {
        expect(
          screen.getByText(
            new RegExp(
              `${tier.name} at ${tier.unlockThreshold.toLocaleString()}`,
            ),
          ),
        ).toBeInTheDocument();
      }
    });

    it("no longer claims passing the previous chapter is all it takes", () => {
      render(<App />);
      expect(
        screen.queryByText(/pass one before the next becomes available/i),
      ).not.toBeInTheDocument();
    });

    it("says earnings are never clawed back by a mistake", () => {
      render(<App />);
      expect(
        screen.getByText(/never takes back a tier you've already opened/i),
      ).toBeInTheDocument();
    });
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

    // CR-114: Chapter 2 now carries a project brief too, shown first.
    expect(
      screen.getByText("Sprint 14 — Merge Verification"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));

    expect(
      screen.getByRole("heading", { name: "Whose Fix Made It?" }),
    ).toBeInTheDocument();
  });

  describe("tier progression (CR-118)", () => {
    it("the Next Level shortcut disappears at a tier boundary when the next chapter isn't earned yet", () => {
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
          "STORY-03-01-who-skipped-review": { passed: true, totalRuns: 1 },
        },
        // Just under Tier 3's 4,000 threshold - clearing Chapter 4 with a
        // good ending (+1,000) lands at 3,800, still short.
        totalEarned: 2_800,
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
      fireEvent.click(
        screen.getByRole("button", { name: "What Does Prod Actually Run?" }),
      );
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

      autoContinue(); // start -> check-lighthouse
      pick("No - prod's ref doesn't land on v1.4.2 at all");
      pick("Yes - prod's ref is exactly v2.3.0's commit");
      pick(
        "No - prod is actually on v5.2.1, two releases ahead of the dashboard",
      );
      pick("Yes - prod's ref is exactly v3.0.0's commit");
      pick(
        'No - the dashboard still says "in progress" hours after it finished',
      );
      autoContinue(); // resolution-clean -> good-ending
      skip();

      // The chapter was cleared, but Tier 3 still isn't unlocked.
      expect(usePlayerStore.getState().totalEarned).toBe(3_800);
      expect(
        screen.queryByRole("button", { name: /^Next Level:/ }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /back to levels/i }));
      expect(
        screen.getByText(/unlocks at 4,000 earned — you have 3,800/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Does It Still Match\?/ }),
      ).toBeDisabled();
    });
  });

  describe("project brief (CR-112)", () => {
    function renderUnlockedThroughChapter3() {
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
        },
        // CR-118: Chapter 3 is Tier 2's first chapter, so passing
        // Chapters 1-2 alone no longer unlocks it - it also needs
        // Tier 2's earn threshold met.
        totalEarned: 2_000,
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

    it("shows the project brief for Chapter 6 too, now that all six chapters have one (CR-117)", () => {
      // As of CR-117, every chapter (1-6) carries a project brief - there's
      // no longer a "no brief" chapter left to test the skip-straight-in
      // case against.
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: {
          "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
          "STORY-02-01-whose-fix-made-it": { passed: true, totalRuns: 1 },
          "STORY-03-01-who-skipped-review": { passed: true, totalRuns: 1 },
          "STORY-04-01-what-does-prod-actually-run": {
            passed: true,
            totalRuns: 1,
          },
          "STORY-05-01-does-it-still-match": {
            passed: true,
            totalRuns: 1,
          },
        },
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
      fireEvent.click(
        screen.getByRole("button", {
          name: "Which Tag Lied?",
        }),
      );

      expect(
        screen.getByText("Q3 Release Train — Version Integrity Sweep"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Which Tag Lied?" }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Begin" }));

      expect(
        screen.getByRole("heading", { name: "Which Tag Lied?" }),
      ).toBeInTheDocument();
    });
  });

  describe("inspecting the graph inside a story (CR-121)", () => {
    /** Opens Chapter 5 and advances to its first check. Chapter 5 is used
     * rather than Chapter 1 because Chapters 1-3 only carry a graph on
     * their opening stage - their individual checks render none, so there
     * is nothing to inspect there. Chapters 4-6 carry one per check. */
    function openFirstGraphStage() {
      usePlayerStore.getState().setName("Test Player");
      usePlayerStore.setState({
        progress: Object.fromEntries(
          [
            "STORY-01-01-which-one-shipped",
            "STORY-02-01-whose-fix-made-it",
            "STORY-03-01-who-skipped-review",
            "STORY-04-01-what-does-prod-actually-run",
          ].map((id) => [id, { passed: true, totalRuns: 1 }]),
        ),
        totalEarned: 4_000,
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
      fireEvent.click(
        screen.getByRole("button", { name: "Does It Still Match?" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Begin" }));
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: "▼ Continue" }));
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );
    }

    it("invites the player to inspect, before anything is selected", () => {
      openFirstGraphStage();
      expect(
        screen.getByText(/click a commit to inspect it/i),
      ).toBeInTheDocument();
    });

    it("Chapter 1's checks carry an inspectable graph too (CR-122)", () => {
      // Chapters 1-3 used to draw their graph once on the opening stage
      // and nothing after it, so the player was asked five questions
      // about a graph that had left the screen - and the inspector had
      // nothing to inspect. They now inherit one chapter-wide graph.
      renderAsReturningPlayer();
      fireEvent.click(
        screen.getByRole("button", { name: "Which One Shipped?" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Begin" }));
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: "▼ Continue" }));
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );

      // We are on the first real check, not the intro.
      expect(
        screen.getByRole("button", {
          name: "No - unsigned and explicitly marked work-in-progress",
        }),
      ).toBeInTheDocument();

      const nodes = document.querySelectorAll('circle[role="button"]');
      expect(nodes.length).toBeGreaterThan(0);

      fireEvent.click(nodes[0]);
      expect(
        screen.getByRole("button", { name: /clear selection/i }),
      ).toBeInTheDocument();
    });

    it("selecting a commit shows what it actually is", () => {
      openFirstGraphStage();
      const nodes = document.querySelectorAll('circle[role="button"]');
      expect(nodes.length).toBeGreaterThan(0);

      fireEvent.click(nodes[0]);

      expect(
        screen.queryByText(/click a commit to inspect it/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /clear selection/i }),
      ).toBeInTheDocument();
    });

    it("selecting two commits states how they relate", () => {
      openFirstGraphStage();
      const nodes = [...document.querySelectorAll('circle[role="button"]')];
      fireEvent.click(nodes[0]);
      fireEvent.click(nodes[1]);

      // Whatever the pair, the panel has to say something concrete about
      // the relationship rather than leaving the player to guess.
      expect(
        screen.getByText(
          /(commits? ahead of|commits? behind|are the same commit|separate lines of history)/i,
        ),
      ).toBeInTheDocument();
    });

    it("clicking a selected commit again deselects it", () => {
      openFirstGraphStage();
      const node = document.querySelectorAll('circle[role="button"]')[0];

      fireEvent.click(node);
      expect(node.getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(node);
      expect(node.getAttribute("aria-pressed")).toBe("false");
      expect(
        screen.getByText(/click a commit to inspect it/i),
      ).toBeInTheDocument();
    });

    it("a selection made on one stage does not carry into the next", () => {
      openFirstGraphStage();
      fireEvent.click(document.querySelectorAll('circle[role="button"]')[0]);
      expect(
        screen.getByRole("button", { name: /clear selection/i }),
      ).toBeInTheDocument();

      // Answer the check and move on - the next stage asks about its own
      // graph, so the old selection would be meaningless.
      fireEvent.click(
        screen.getByRole("button", {
          name: "Drifted - prod has moved past the commit BL-01 names",
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(
        screen.getByRole("button", { name: /click to skip text reveal/i }),
      );

      expect(
        screen.getByText(/click a commit to inspect it/i),
      ).toBeInTheDocument();
    });
  });
});
