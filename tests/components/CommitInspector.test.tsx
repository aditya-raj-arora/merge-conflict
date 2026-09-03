import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CommitInspector } from "../../src/components/CommitInspector";
import { GraphCanvas } from "../../src/components/GraphCanvas";
import type { Graph } from "../../src/engine/graph/commitGraph";

/** Nova API's shape: prod sits one unaudited commit past the baseline.
 * The chapter no longer says so in prose (CR-120), so the inspector is
 * how a player establishes it (CR-121). */
const auditGraph: Graph = {
  commits: {
    a1: {
      id: "a1",
      parentIds: [],
      message: "release: cut v1.0.0",
      authorSigned: true,
      timestamp: 0,
    },
    a2: {
      id: "a2",
      parentIds: ["a1"],
      message: "chore: tag baseline BL-01 - approved launch configuration",
      authorSigned: true,
      timestamp: 1,
    },
    a3: {
      id: "a3",
      parentIds: ["a2"],
      message: "fix: bump rate-limit threshold under load (Refs: CR-201)",
      authorSigned: false,
      timestamp: 2,
    },
  },
  refs: {
    "BL-01": { name: "BL-01", commitId: "a2" },
    prod: { name: "prod", commitId: "a3" },
  },
  head: { type: "branch", name: "prod" },
};

describe("CommitInspector (CR-121)", () => {
  it("prompts the player to pick something when nothing is selected", () => {
    render(
      <CommitInspector
        graph={auditGraph}
        selectedCommitIds={[]}
        onClear={() => {}}
      />,
    );
    expect(
      screen.getByText(/click a commit to inspect it/i),
    ).toBeInTheDocument();
  });

  it("shows a single commit's message, id, refs and signature state", () => {
    render(
      <CommitInspector
        graph={auditGraph}
        selectedCommitIds={["a3"]}
        onClear={() => {}}
      />,
    );
    expect(
      screen.getByText(/bump rate-limit threshold under load/),
    ).toBeInTheDocument();
    expect(screen.getByText("a3")).toBeInTheDocument();
    expect(screen.getByText("prod")).toBeInTheDocument();
    expect(screen.getByText("unsigned")).toBeInTheDocument();
  });

  it("names the relationship between two commits, using their refs", () => {
    render(
      <CommitInspector
        graph={auditGraph}
        selectedCommitIds={["a3", "a2"]}
        onClear={() => {}}
      />,
    );
    expect(
      screen.getByText("prod is 1 commit ahead of BL-01."),
    ).toBeInTheDocument();
  });

  it("says plainly when two refs are the same commit", () => {
    const sameCommit: Graph = {
      ...auditGraph,
      refs: {
        "BL-01": { name: "BL-01", commitId: "a2" },
        prod: { name: "prod", commitId: "a2" },
      },
    };
    render(
      <CommitInspector
        graph={sameCommit}
        selectedCommitIds={["a2"]}
        onClear={() => {}}
      />,
    );
    // One node carrying both refs - the compliant shape.
    expect(screen.getByText("BL-01")).toBeInTheDocument();
    expect(screen.getByText("prod")).toBeInTheDocument();
  });

  it("reports the comparison without ever declaring a verdict", () => {
    render(
      <CommitInspector
        graph={auditGraph}
        selectedCommitIds={["a3", "a2"]}
        onClear={() => {}}
      />,
    );
    // Deciding whether "1 commit ahead" is drift is the player's job -
    // the tool must not answer the question the chapter is asking.
    const panel = screen.getByText(/ahead of BL-01/).closest("div")!;
    expect(panel.textContent).not.toMatch(
      /drift|compliant|violation|pass|fail/i,
    );
  });

  it("clears the selection on request", () => {
    const onClear = vi.fn();
    render(
      <CommitInspector
        graph={auditGraph}
        selectedCommitIds={["a2"]}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("GraphCanvas selection (CR-121)", () => {
  it("is a static picture when no handler is given", () => {
    const { container } = render(<GraphCanvas graph={auditGraph} />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it("turns commits into real buttons when a handler is given", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GraphCanvas graph={auditGraph} onSelectCommit={onSelect} />,
    );
    const nodes = container.querySelectorAll('circle[role="button"]');
    expect(nodes).toHaveLength(3);
    for (const node of nodes) {
      expect(node.getAttribute("tabindex")).toBe("0");
    }
  });

  it("reports the clicked commit", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GraphCanvas graph={auditGraph} onSelectCommit={onSelect} />,
    );
    const node = container.querySelector('circle[aria-label^="Commit a2"]')!;
    fireEvent.click(node);
    expect(onSelect).toHaveBeenCalledWith("a2");
  });

  it("is operable from the keyboard, not just the mouse", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GraphCanvas graph={auditGraph} onSelectCommit={onSelect} />,
    );
    const node = container.querySelector('circle[aria-label^="Commit a3"]')!;
    fireEvent.keyDown(node, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("a3");

    fireEvent.keyDown(node, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("marks selected commits as pressed, for assistive tech as well as sighted players", () => {
    const { container } = render(
      <GraphCanvas
        graph={auditGraph}
        selectedCommitIds={["a2"]}
        onSelectCommit={() => {}}
      />,
    );
    const selectedNode = container.querySelector(
      'circle[aria-label^="Commit a2"]',
    )!;
    const otherNode = container.querySelector(
      'circle[aria-label^="Commit a1"]',
    )!;
    expect(selectedNode.getAttribute("aria-pressed")).toBe("true");
    expect(otherNode.getAttribute("aria-pressed")).toBe("false");
  });

  it("draws a highlight ring only around selected commits", () => {
    const { container } = render(
      <GraphCanvas
        graph={auditGraph}
        selectedCommitIds={["a2", "a3"]}
        onSelectCommit={() => {}}
      />,
    );
    expect(container.querySelectorAll("circle.stroke-sky-300")).toHaveLength(2);
  });
});
