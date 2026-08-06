import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

describe("App", () => {
  it("renders the Chapter 1 level title", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Which One Shipped?" }),
    ).toBeInTheDocument();
  });

  it("renders all three build options as selectable buttons", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "build-a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "build-b" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "build-c" })).toBeInTheDocument();
  });
});
