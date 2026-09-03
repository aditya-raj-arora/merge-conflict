import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphCanvas } from "../../src/components/GraphCanvas";
import type { Graph } from "../../src/engine/graph/commitGraph";
import { levelManifest } from "../../content/levelManifest";

/** Two refs on the same commit, plus a long message - the exact shape
 * that used to draw two labels on top of each other and run the message
 * off the edge of the canvas (CR-119). */
const sharedRefGraph: Graph = {
  commits: {
    c1: {
      id: "c1",
      parentIds: [],
      message: "chore: initial web config",
      authorSigned: true,
      timestamp: 0,
    },
    c2: {
      id: "c2",
      parentIds: ["c1"],
      message: "chore: tag baseline BL-04 - approved web configuration",
      authorSigned: true,
      timestamp: 1,
    },
  },
  refs: {
    "BL-04": { name: "BL-04", commitId: "c2" },
    prod: { name: "prod", commitId: "c2" },
  },
  head: { type: "branch", name: "prod" },
};

/** Three commits abreast on one row - the shape whose messages used to
 * draw straight through each other (CR-119). */
const wideRowGraph: Graph = {
  commits: {
    base: {
      id: "base",
      parentIds: [],
      message: "chore: branch off",
      authorSigned: true,
      timestamp: 0,
    },
    a: {
      id: "a",
      parentIds: ["base"],
      message: "fix: null check crash on checkout",
      authorSigned: true,
      timestamp: 1,
    },
    b: {
      id: "b",
      parentIds: ["base"],
      message: "fix: race condition in save queue",
      authorSigned: true,
      timestamp: 1,
    },
    c: {
      id: "c",
      parentIds: ["base"],
      message: "fix: memory leak in asset loader",
      authorSigned: true,
      timestamp: 1,
    },
  },
  refs: {
    "a-fix": { name: "a-fix", commitId: "a" },
    "b-fix": { name: "b-fix", commitId: "b" },
    "c-fix": { name: "c-fix", commitId: "c" },
  },
  head: { type: "branch", name: "a-fix" },
};

function texts(container: HTMLElement) {
  return [...container.querySelectorAll("text")];
}

/** The same width estimate GraphCanvas itself uses, so these checks
 * reason about the boxes the component actually laid out. jsdom can't
 * measure real glyphs (getBBox is a stub), which is exactly why the
 * component estimates rather than measures. */
const CHAR_WIDTH_EM = 0.62;

interface LabelBox {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function labelBoxes(container: HTMLElement): LabelBox[] {
  return texts(container).map((node) => {
    const isRef = node.getAttribute("text-anchor") === "middle";
    const fontSize = Number(node.getAttribute("font-size"));
    const text = node.textContent ?? "";
    const width = text.length * fontSize * CHAR_WIDTH_EM;
    const x = Number(node.getAttribute("x"));
    const y = Number(node.getAttribute("y"));
    return {
      text,
      x0: isRef ? x - width / 2 : x,
      x1: isRef ? x + width / 2 : x + width,
      y0: y - fontSize / 2,
      y1: y + fontSize / 2,
    };
  });
}

function overlappingPairs(boxes: LabelBox[]): string[] {
  const hits: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) {
        hits.push(`"${a.text}" overlaps "${b.text}"`);
      }
    }
  }
  return hits;
}

function outsideViewBox(container: HTMLElement, boxes: LabelBox[]): string[] {
  const svg = container.querySelector("svg")!;
  const [minX, minY, width, height] = svg
    .getAttribute("viewBox")!
    .split(" ")
    .map(Number);
  const slack = 0.5;
  return boxes
    .filter(
      (b) =>
        b.x0 < minX - slack ||
        b.x1 > minX + width + slack ||
        b.y0 < minY - slack ||
        b.y1 > minY + height + slack,
    )
    .map((b) => b.text);
}

/** Every graph that actually ships, pulled off the real manifest so new
 * content is covered automatically. */
const contentGraphs: Array<{ name: string; graph: Graph }> = levelManifest
  .filter((entry) => entry.kind === "story")
  .flatMap((entry) =>
    Object.entries(entry.story.stages)
      .filter(([, stage]) => stage.graph)
      .map(([stageId, stage]) => ({
        name: `${entry.chapterId}/${stageId}`,
        graph: stage.graph!,
      })),
  );

describe("GraphCanvas legibility (CR-119)", () => {
  describe("text colour", () => {
    it("every label paints an explicit colour, never falling back to SVG's black default", () => {
      const { container } = render(<GraphCanvas graph={sharedRefGraph} />);
      const labels = texts(container);
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) {
        const fill = label.getAttribute("fill");
        const className = label.getAttribute("class") ?? "";
        // Either an explicit fill attribute, or a fill-* utility class.
        expect(fill !== null || /\bfill-/.test(className)).toBe(true);
        // The old bug was the *absence* of any of this, which renders black.
        expect(fill).not.toBe("black");
        expect(fill).not.toBe("#000000");
      }
    });

    it("commit messages inherit the surrounding text colour", () => {
      const { container } = render(<GraphCanvas graph={sharedRefGraph} />);
      const message = texts(container).find((t) =>
        t.textContent?.startsWith("chore: initial web config"),
      );
      expect(message?.getAttribute("fill")).toBe("currentColor");
    });
  });

  describe("refs sharing one commit", () => {
    it("renders both refs", () => {
      render(<GraphCanvas graph={sharedRefGraph} />);
      expect(screen.getByText("BL-04")).toBeInTheDocument();
      expect(screen.getByText("prod")).toBeInTheDocument();
    });

    it("stacks them at different heights instead of drawing one over the other", () => {
      const { container } = render(<GraphCanvas graph={sharedRefGraph} />);
      const labels = texts(container);
      const baseline = labels.find((t) => t.textContent === "BL-04")!;
      const stacked = labels.find((t) => t.textContent === "prod")!;

      // Same commit, so same x - but they must not share a y.
      expect(baseline.getAttribute("x")).toBe(stacked.getAttribute("x"));
      expect(baseline.getAttribute("y")).not.toBe(stacked.getAttribute("y"));

      const gap = Math.abs(
        Number(baseline.getAttribute("y")) - Number(stacked.getAttribute("y")),
      );
      // Far enough apart that 11px text can't visually collide.
      expect(gap).toBeGreaterThanOrEqual(11);
    });
  });

  describe("commits at the same depth", () => {
    it("gives every commit its own row, so no two messages share a line", () => {
      const { container } = render(<GraphCanvas graph={wideRowGraph} />);
      const labels = texts(container);
      const messages = [
        "branch off",
        "null check",
        "race condition",
        "memory leak",
      ].map((needle) => labels.find((t) => t.textContent?.includes(needle))!);

      const ys = messages.map((t) => Number(t.getAttribute("y")));
      expect(new Set(ys).size).toBe(4);

      const sorted = [...ys].sort((p, q) => p - q);
      for (let i = 1; i < sorted.length; i++) {
        // A full row apart, not a nudge - 12px text can't collide.
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(40);
      }
    });

    it("still orders ancestors below descendants", () => {
      const { container } = render(<GraphCanvas graph={wideRowGraph} />);
      const labels = texts(container);
      const root = labels.find((t) => t.textContent?.includes("branch off"))!;
      const child = labels.find((t) => t.textContent?.includes("null check"))!;

      // y grows downward in SVG, so the older commit sits lower.
      expect(Number(root.getAttribute("y"))).toBeGreaterThan(
        Number(child.getAttribute("y")),
      );
    });

    it("keeps a message clear of every other commit's ref label", () => {
      const { container } = render(<GraphCanvas graph={wideRowGraph} />);
      const labels = texts(container);
      const refNames = new Set(["a-fix", "b-fix", "c-fix"]);
      const refs = labels.filter((t) => refNames.has(t.textContent ?? ""));
      const messages = labels.filter((t) => !refNames.has(t.textContent ?? ""));

      // Every ref label clears every message's line by more than the two
      // fonts' half-heights combined (6 + 5.5), which is what used to fail
      // when messages fanned out within a shared row.
      for (const ref of refs) {
        for (const message of messages) {
          const gap = Math.abs(
            Number(ref.getAttribute("y")) - Number(message.getAttribute("y")),
          );
          expect(gap).toBeGreaterThan(11.5);
        }
      }
    });
  });

  describe("canvas sizing", () => {
    it("the viewBox is wide enough for the longest message, so nothing is clipped", () => {
      const { container } = render(<GraphCanvas graph={sharedRefGraph} />);
      const svg = container.querySelector("svg")!;
      const [minX, , width] = svg
        .getAttribute("viewBox")!
        .split(" ")
        .map(Number);

      const longest = texts(container).find((t) =>
        t.textContent?.includes("approved web configuration"),
      )!;
      const startX = Number(longest.getAttribute("x"));
      // A conservative lower bound on the rendered width of that message.
      const approxWidth = longest.textContent!.length * 12 * 0.5;

      expect(startX + approxWidth).toBeLessThanOrEqual(minX + width);
    });

    it("scales down rather than overflowing a narrow container", () => {
      const { container } = render(<GraphCanvas graph={wideRowGraph} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("class")).toContain("max-w-full");
      expect(svg.getAttribute("viewBox")).toBeTruthy();
    });

    it("keeps a ref label on the leftmost lane inside the canvas", () => {
      const { container } = render(<GraphCanvas graph={wideRowGraph} />);
      const svg = container.querySelector("svg")!;
      const [minX] = svg.getAttribute("viewBox")!.split(" ").map(Number);

      // Centred ref labels on lane 0 extend to the left of the node, which
      // used to fall outside the canvas entirely.
      const leftmost = texts(container).find((t) => t.textContent === "a-fix")!;
      const half = ("a-fix".length * 11 * 0.62) / 2;
      expect(Number(leftmost.getAttribute("x")) - half).toBeGreaterThanOrEqual(
        minX,
      );
    });
  });

  // The spot checks above cover the shapes that were broken. This sweeps
  // every graph the game actually ships, so a new chapter can't quietly
  // reintroduce a collision or a clipped label.
  describe("every graph in the shipped content", () => {
    it("has graphs to check", () => {
      expect(contentGraphs.length).toBeGreaterThanOrEqual(18);
    });

    it.each(contentGraphs)("$name has no overlapping labels", ({ graph }) => {
      const { container } = render(<GraphCanvas graph={graph} />);
      expect(overlappingPairs(labelBoxes(container))).toEqual([]);
    });

    it.each(contentGraphs)("$name clips no label", ({ graph }) => {
      const { container } = render(<GraphCanvas graph={graph} />);
      expect(outsideViewBox(container, labelBoxes(container))).toEqual([]);
    });

    it.each(contentGraphs)("$name paints every label", ({ graph }) => {
      const { container } = render(<GraphCanvas graph={graph} />);
      const labels = texts(container);

      // Guards the two checks above against passing vacuously: every
      // commit message and every ref name has to actually be on screen.
      expect(labels).toHaveLength(
        Object.keys(graph.commits).length + Object.keys(graph.refs).length,
      );

      for (const label of labels) {
        const painted =
          label.getAttribute("fill") !== null ||
          /\bfill-/.test(label.getAttribute("class") ?? "");
        expect(painted).toBe(true);
      }
    });
  });
});
