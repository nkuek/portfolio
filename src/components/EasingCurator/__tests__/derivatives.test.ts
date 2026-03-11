import { describe, it, expect } from "vitest";
import { sampleBezierDerivatives } from "../derivatives";

describe("sampleBezierDerivatives", () => {
  it("returns 101 velocity and acceleration samples by default", () => {
    const result = sampleBezierDerivatives({
      x1: 0.25,
      y1: 0.1,
      x2: 0.25,
      y2: 1,
    });
    expect(result.velocities).toHaveLength(101);
    expect(result.accelerations).toHaveLength(101);
  });

  it("respects custom numSamples", () => {
    const result = sampleBezierDerivatives({ x1: 0, y1: 0, x2: 1, y2: 1 }, 51);
    expect(result.velocities).toHaveLength(51);
    expect(result.accelerations).toHaveLength(51);
  });

  it("linear curve has constant velocity ~1", () => {
    const result = sampleBezierDerivatives({ x1: 0, y1: 0, x2: 1, y2: 1 });
    // Interior samples should all be near 1 (slope of y=x)
    for (let i = 5; i < 96; i++) {
      expect(result.velocities[i]).toBeCloseTo(1, 0);
    }
  });

  it("linear curve has near-zero acceleration", () => {
    const result = sampleBezierDerivatives({ x1: 0, y1: 0, x2: 1, y2: 1 });
    for (let i = 5; i < 96; i++) {
      expect(Math.abs(result.accelerations[i]!)).toBeLessThan(1);
    }
  });

  it("ease-in starts with low velocity", () => {
    const result = sampleBezierDerivatives({ x1: 0.42, y1: 0, x2: 1, y2: 1 });
    // Early velocity should be low (curve is flat at start)
    expect(result.velocities[5]!).toBeLessThan(0.5);
    // Late velocity should be high
    expect(result.velocities[95]!).toBeGreaterThan(1);
  });

  it("ease-out starts with high velocity", () => {
    const result = sampleBezierDerivatives({ x1: 0, y1: 0, x2: 0.58, y2: 1 });
    expect(result.velocities[5]!).toBeGreaterThan(1);
    expect(result.velocities[95]!).toBeLessThan(0.5);
  });

  it("all values are finite", () => {
    const curves = [
      { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
      { x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6 },
      { x1: 0.5, y1: 1.5, x2: 0.75, y2: 1.25 },
    ];
    for (const curve of curves) {
      const result = sampleBezierDerivatives(curve);
      for (const v of result.velocities) expect(Number.isFinite(v)).toBe(true);
      for (const a of result.accelerations)
        expect(Number.isFinite(a)).toBe(true);
    }
  });
});
