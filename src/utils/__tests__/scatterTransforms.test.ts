import { describe, it, expect } from "vitest";
import {
  fragmentTransform,
  childScatter,
  FOCUS_SNAP,
} from "../scatterTransforms";

describe("fragmentTransform", () => {
  it("scattered (focus ≤ FOCUS_SNAP): scales offsets by 1.5, full rotation", () => {
    const result = fragmentTransform(10, 20, 45, 0.3);
    expect(result).toBe(
      "translate(calc(-50% + 15px), calc(-50% + 30px)) rotate(45deg)",
    );
  });

  it("landed (focus > FOCUS_SNAP): raw offsets, rotation × 0.35", () => {
    const result = fragmentTransform(10, 20, 40, 0.8);
    expect(result).toBe(
      "translate(calc(-50% + 10px), calc(-50% + 20px)) rotate(14deg)",
    );
  });

  it("hoverSpread multiplies offsets only when landed", () => {
    const result = fragmentTransform(10, 20, 40, 0.8, 2);
    expect(result).toBe(
      "translate(calc(-50% + 20px), calc(-50% + 40px)) rotate(14deg)",
    );
  });

  it("hoverSpread ignored when scattered", () => {
    const withSpread = fragmentTransform(10, 20, 45, 0.3, 2);
    const withoutSpread = fragmentTransform(10, 20, 45, 0.3);
    expect(withSpread).toBe(withoutSpread);
  });

  it("hoverSpread=1 (default) is a no-op", () => {
    const explicit = fragmentTransform(10, 20, 45, 0.8, 1);
    const implicit = fragmentTransform(10, 20, 45, 0.8);
    expect(explicit).toBe(implicit);
  });

  it("exact FOCUS_SNAP boundary is scattered (uses >)", () => {
    const atBoundary = fragmentTransform(10, 20, 45, FOCUS_SNAP);
    const belowBoundary = fragmentTransform(10, 20, 45, 0.3);
    // Both should be scattered — same scale factor, same rotation
    expect(atBoundary).toBe(belowBoundary);
  });

  it("output matches valid CSS transform format", () => {
    const result = fragmentTransform(5, -3, 12, 0.9);
    expect(result).toMatch(
      /^translate\(calc\(-50% \+ -?[\d.]+px\), calc\(-50% \+ -?[\d.]+px\)\) rotate\(-?[\d.]+deg\)$/,
    );
  });
});

describe("childScatter", () => {
  it("landed returns identity transform", () => {
    expect(childScatter([30, 40], 15, 0.8)).toBe(
      "translate(0px, 0px) rotate(0deg) scale(1)",
    );
  });

  it("scattered applies offsets and rotation with scale(1) when no scaleRange", () => {
    expect(childScatter([30, 40], 15, 0.3)).toBe(
      "translate(30px, 40px) rotate(15deg) scale(1)",
    );
  });

  it("scattered with scaleRange uses scaleRange[0]", () => {
    expect(childScatter([30, 40], 15, 0.3, [0.5, 1.5])).toBe(
      "translate(30px, 40px) rotate(15deg) scale(0.5)",
    );
  });

  it("landed ignores scaleRange", () => {
    expect(childScatter([30, 40], 15, 0.8, [0.5, 1.5])).toBe(
      "translate(0px, 0px) rotate(0deg) scale(1)",
    );
  });
});
