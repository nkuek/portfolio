import { describe, expect, it } from "vitest";
import {
  formatCSSAnimation,
  formatCSSKeyframes,
  formatFramerMotion,
  formatTailwind,
} from "../ExportPanel/formatters";
import type { KeyframeStop, SegmentEasing } from "../types";

const testKeyframes: KeyframeStop[] = [
  {
    id: "kf-0",
    offset: 0,
    properties: {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0,
      opacity: 1,
      backgroundColor: "#6366f1",
    },
    mask: {
      translateX: false,
      translateY: false,
      scale: false,
      rotate: false,
      opacity: true,
      backgroundColor: false,
    },
  },
  {
    id: "kf-50",
    offset: 50,
    properties: {
      translateX: 100,
      translateY: 0,
      scale: 0.5,
      rotate: 180,
      opacity: 0.5,
      backgroundColor: "#ef4444",
    },
    mask: {
      translateX: true,
      translateY: false,
      scale: true,
      rotate: false,
      opacity: true,
      backgroundColor: false,
    },
  },
  {
    id: "kf-100",
    offset: 100,
    properties: {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0,
      opacity: 1,
      backgroundColor: "#6366f1",
    },
    mask: {
      translateX: false,
      translateY: false,
      scale: false,
      rotate: false,
      opacity: true,
      backgroundColor: false,
    },
  },
];

const testEasings: SegmentEasing[] = [
  {
    fromId: "kf-0",
    toId: "kf-50",
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    easingName: "ease",
  },
  {
    fromId: "kf-50",
    toId: "kf-100",
    easing: "cubic-bezier(0.42, 0, 0.58, 1)",
    easingName: "ease-in-out",
  },
];

describe("formatCSSKeyframes", () => {
  it("produces a valid @keyframes block", () => {
    const result = formatCSSKeyframes("my-animation", testKeyframes, testEasings);
    expect(result).toContain("@keyframes my-animation {");
    expect(result).toContain("0% {");
    expect(result).toContain("50% {");
    expect(result).toContain("100% {");
    expect(result.endsWith("}")).toBe(true);
  });

  it("only includes masked properties", () => {
    const result = formatCSSKeyframes("test", testKeyframes, testEasings);
    // kf-0 only has opacity masked
    const lines = result.split("\n");
    const kf0Start = lines.findIndex((l) => l.includes("0% {"));
    const kf0End = lines.findIndex((l, i) => i > kf0Start && l.trim() === "}");
    const kf0Block = lines.slice(kf0Start, kf0End + 1).join("\n");

    expect(kf0Block).toContain("opacity: 1");
    expect(kf0Block).not.toContain("transform:");
    expect(kf0Block).not.toContain("background-color:");
  });

  it("includes animation-timing-function from segment easings", () => {
    const result = formatCSSKeyframes("test", testKeyframes, testEasings);
    expect(result).toContain(
      "animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1)",
    );
    expect(result).toContain(
      "animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1)",
    );
  });

  it("does not include animation-timing-function on last keyframe", () => {
    const result = formatCSSKeyframes("test", testKeyframes, testEasings);
    const lines = result.split("\n");
    const kf100Start = lines.findIndex((l) => l.includes("100% {"));
    const kf100End = lines.findIndex(
      (l, i) => i > kf100Start && l.trim() === "}",
    );
    const kf100Block = lines.slice(kf100Start, kf100End + 1).join("\n");

    expect(kf100Block).not.toContain("animation-timing-function");
  });

  it("combines transform properties into a single transform line", () => {
    const result = formatCSSKeyframes("test", testKeyframes, testEasings);
    const lines = result.split("\n");
    const kf50Start = lines.findIndex((l) => l.includes("50% {"));
    const kf50End = lines.findIndex(
      (l, i) => i > kf50Start && l.trim() === "}",
    );
    const kf50Block = lines.slice(kf50Start, kf50End + 1).join("\n");

    expect(kf50Block).toContain("transform: translateX(100px) scale(0.5)");
    // Should be a single transform line, not separate
    const transformCount = kf50Block
      .split("\n")
      .filter((l) => l.includes("transform:")).length;
    expect(transformCount).toBe(1);
  });

  it("handles single-property keyframes", () => {
    const singlePropKeyframes: KeyframeStop[] = [
      {
        id: "a",
        offset: 0,
        properties: {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0,
          opacity: 0,
          backgroundColor: "#000",
        },
        mask: {
          translateX: false,
          translateY: false,
          scale: false,
          rotate: false,
          opacity: true,
          backgroundColor: false,
        },
      },
      {
        id: "b",
        offset: 100,
        properties: {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0,
          opacity: 1,
          backgroundColor: "#000",
        },
        mask: {
          translateX: false,
          translateY: false,
          scale: false,
          rotate: false,
          opacity: true,
          backgroundColor: false,
        },
      },
    ];
    const result = formatCSSKeyframes("fade-in", singlePropKeyframes, []);
    expect(result).toContain("opacity: 0");
    expect(result).toContain("opacity: 1");
    expect(result).not.toContain("transform:");
  });

  it("handles keyframes with no masked properties", () => {
    const emptyKeyframes: KeyframeStop[] = [
      {
        id: "a",
        offset: 0,
        properties: {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0,
          opacity: 1,
          backgroundColor: "#000",
        },
        mask: {
          translateX: false,
          translateY: false,
          scale: false,
          rotate: false,
          opacity: false,
          backgroundColor: false,
        },
      },
      {
        id: "b",
        offset: 100,
        properties: {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0,
          opacity: 1,
          backgroundColor: "#000",
        },
        mask: {
          translateX: false,
          translateY: false,
          scale: false,
          rotate: false,
          opacity: false,
          backgroundColor: false,
        },
      },
    ];
    const result = formatCSSKeyframes("empty", emptyKeyframes, []);
    expect(result).toContain("0% {");
    expect(result).toContain("100% {");
    // Should have empty blocks (no property lines)
    expect(result).not.toContain("opacity:");
    expect(result).not.toContain("transform:");
  });
});

describe("formatCSSAnimation", () => {
  it("produces correct shorthand", () => {
    const result = formatCSSAnimation("slide", 1000, 1, "normal", "none");
    expect(result).toBe("animation: slide 1000ms linear 1 normal none;");
  });

  it("handles infinite iteration count", () => {
    const result = formatCSSAnimation("pulse", 500, "infinite", "normal", "none");
    expect(result).toContain("infinite");
  });

  it("handles alternate direction", () => {
    const result = formatCSSAnimation("bounce", 800, 2, "alternate", "both");
    expect(result).toBe("animation: bounce 800ms linear 2 alternate both;");
  });
});

describe("formatTailwind", () => {
  it("includes @theme block with --animate- variable", () => {
    const result = formatTailwind(
      "my-animation",
      testKeyframes,
      testEasings,
      1000,
      1,
      "normal",
      "none",
    );
    expect(result).toContain("@theme {");
    expect(result).toContain(
      "--animate-my-animation: my-animation 1000ms linear 1 normal none;",
    );
    expect(result).toContain("}");
  });

  it("includes @keyframes block", () => {
    const result = formatTailwind(
      "my-animation",
      testKeyframes,
      testEasings,
      1000,
      1,
      "normal",
      "none",
    );
    expect(result).toContain("@keyframes my-animation {");
    expect(result).toContain("opacity:");
  });
});

describe("formatFramerMotion", () => {
  it("produces object with animate and transition", () => {
    const result = formatFramerMotion(testKeyframes, testEasings, 1000);
    expect(result).toContain("animate:");
    expect(result).toContain("transition:");
    expect(result).toContain("duration:");
    expect(result).toContain("times:");
    expect(result).toContain("ease:");
  });

  it("includes correct times array", () => {
    const result = formatFramerMotion(testKeyframes, testEasings, 1000);
    expect(result).toContain("times: [0, 0.5, 1]");
  });

  it("maps property names correctly (translateX to x)", () => {
    const result = formatFramerMotion(testKeyframes, testEasings, 1000);
    // translateX is masked on kf-50, so it should appear as "x"
    expect(result).toContain("x:");
    expect(result).not.toContain("translateX:");
  });
});
