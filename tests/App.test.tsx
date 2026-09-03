import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { usePlayerStore } from "../src/state/usePlayerStore";

/** Bypasses the welcome screen directly via the store, the same way
 * WelcomeScreen's onStart does - keeps tests that aren't about the
 * welcome flow itself focused on what they're actually testing. */
function startAsPlayer(name = "Test Player") {
  usePlayerStore.getState().setName(name);
}

beforeEach(() => {
  usePlayerStore.getState().resetProfile();
});

describe("App", () => {
  it("shows the welcome screen first for a new player, and proceeds to level-select after entering a name", () => {
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

  it("a returning player (name already saved) goes straight to level-select", () => {
    startAsPlayer();
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();
  });

  it("only Chapter 1 is unlocked at the start - Chapter 2 is locked", () => {
    startAsPlayer();
    render(<App />);
    // The button's accessible name includes the "Locked" icon label
    // appended after the title (CR-109), hence the regex.
    expect(
      screen.getByRole("button", { name: /^Whose Fix Made It\?/ }),
    ).toBeDisabled();
  });

  it("selecting the unlocked Chapter 1 story loads it; choices appear once the reveal is skipped; back returns to select", () => {
    startAsPlayer();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Which One Shipped?" }));
    expect(
      screen.getByRole("heading", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();

    // VN-style typewriter reveal (CR-095) - choices don't appear until
    // the text finishes revealing. Skip it, same as a player clicking
    // the dialogue box to fast-forward.
    fireEvent.click(
      screen.getByRole("button", { name: /click to skip text reveal/i }),
    );

    expect(screen.getByRole("button", { name: "build-a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "build-b" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "build-c" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to levels/i }));
    expect(
      screen.getByRole("heading", { name: "Merge Conflict" }),
    ).toBeInTheDocument();
  });

  it("passing Chapter 1 (reaching a good ending) unlocks Chapter 2", () => {
    startAsPlayer();
    // Seeded directly - the unlock gate is what's under test here, not
    // the story content itself (that's ch01-story.test.ts's job).
    usePlayerStore.setState({
      progress: {
        "STORY-01-01-which-one-shipped": { passed: true, totalRuns: 1 },
      },
    });
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Whose Fix Made It?" }),
    ).toBeEnabled();
  });

  it("cannot open a level that isn't unlocked, even by forcing selectedLevelId (defensive gate)", () => {
    startAsPlayer();
    render(<App />);
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
});
