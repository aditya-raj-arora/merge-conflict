import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";

describe("App", () => {
  it("renders the level-select screen first, with both shipped levels", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Merge Conflict" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Whose Fix Made It?" }),
    ).toBeInTheDocument();
  });

  it("selecting a story loads it; choices appear once the reveal is skipped; back returns to select", () => {
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

  it("Chapter 2's level is reachable too", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Whose Fix Made It?" }));
    expect(
      screen.getByRole("heading", { name: "Whose Fix Made It?" }),
    ).toBeInTheDocument();
  });
});
