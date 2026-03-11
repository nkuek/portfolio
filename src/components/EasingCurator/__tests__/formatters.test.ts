import { describe, it, expect } from "vitest";
import {
  formatCSS,
  formatCSSTransition,
  formatCSSVariable,
  formatLinearEasing,
  formatSpringKeyframes,
  formatMotionConfig,
} from "../ExportPanel/formatters";

describe("formatCSS", () => {
  it("formats cubic-bezier string", () => {
    expect(formatCSS({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 })).toBe(
      "cubic-bezier(0.25, 0.1, 0.25, 1)",
    );
  });

  it("handles zero values", () => {
    expect(formatCSS({ x1: 0, y1: 0, x2: 1, y2: 1 })).toBe(
      "cubic-bezier(0, 0, 1, 1)",
    );
  });

  it("handles negative y values", () => {
    expect(formatCSS({ x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6 })).toBe(
      "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    );
  });
});

describe("formatCSSTransition", () => {
  it("includes duration and cubic-bezier", () => {
    const result = formatCSSTransition(
      { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
      500,
    );
    expect(result).toBe(
      "transition: all 500ms cubic-bezier(0.25, 0.1, 0.25, 1);",
    );
  });
});

describe("formatCSSVariable", () => {
  it("uses default name", () => {
    const result = formatCSSVariable({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });
    expect(result).toBe("--ease-my-ease: cubic-bezier(0.25, 0.1, 0.25, 1);");
  });

  it("uses custom name", () => {
    const result = formatCSSVariable({ x1: 0, y1: 0, x2: 1, y2: 1 }, "linear");
    expect(result).toBe("--ease-linear: cubic-bezier(0, 0, 1, 1);");
  });
});

describe("formatLinearEasing", () => {
  it("wraps samples in linear()", () => {
    const result = formatLinearEasing([0, 0.5, 1]);
    expect(result).toBe("linear(0, 0.5, 1)");
  });
});

describe("formatSpringKeyframes", () => {
  it("generates @keyframes with percentage stops", () => {
    const samples = [0, 0.5, 1];
    const result = formatSpringKeyframes(samples);
    expect(result).toContain("@keyframes spring {");
    expect(result).toContain("0% { transform: translateX(0.0%); }");
    expect(result).toContain("50% { transform: translateX(50.0%); }");
    expect(result).toContain("100% { transform: translateX(100.0%); }");
  });

  it("handles 101 samples", () => {
    const samples = Array.from({ length: 101 }, (_, i) => i / 100);
    const result = formatSpringKeyframes(samples);
    const lines = result.split("\n");
    // header + 101 stops + closing brace
    expect(lines).toHaveLength(103);
  });
});

describe("formatMotionConfig", () => {
  it("formats Framer Motion spring config", () => {
    const result = formatMotionConfig({
      mass: 1,
      stiffness: 100,
      damping: 10,
    });
    expect(result).toContain('type: "spring"');
    expect(result).toContain("mass: 1");
    expect(result).toContain("stiffness: 100");
    expect(result).toContain("damping: 10");
  });
});
