import { describe, it, expect } from "vitest";
import {
  simulateSpring,
  springToLinearEasing,
  SPRING_PRESETS,
  DEFAULT_SPRING_CONFIG,
} from "../spring";

describe("simulateSpring", () => {
  it("returns 101 samples for default config", () => {
    const result = simulateSpring(DEFAULT_SPRING_CONFIG);
    expect(result.samples).toHaveLength(101);
    expect(result.velocities).toHaveLength(101);
    expect(result.accelerations).toHaveLength(101);
  });

  it("starts at 0 and settles near 1", () => {
    const result = simulateSpring(DEFAULT_SPRING_CONFIG);
    expect(result.samples[0]).toBeCloseTo(0, 1);
    expect(result.samples[100]).toBeCloseTo(1, 2);
  });

  it("settleMs is a positive integer", () => {
    const result = simulateSpring(DEFAULT_SPRING_CONFIG);
    expect(result.settleMs).toBeGreaterThan(0);
    expect(Number.isInteger(result.settleMs)).toBe(true);
  });

  it("overdamped spring never overshoots", () => {
    const result = simulateSpring({ mass: 1, stiffness: 100, damping: 50 });
    for (const v of result.samples) {
      expect(v).toBeLessThanOrEqual(1.001);
      expect(v).toBeGreaterThanOrEqual(-0.001);
    }
  });

  it("underdamped spring oscillates past 1", () => {
    const result = simulateSpring({ mass: 1, stiffness: 180, damping: 8 });
    const max = Math.max(...result.samples);
    expect(max).toBeGreaterThan(1.05);
  });

  it("high stiffness settles faster than low stiffness", () => {
    const stiff = simulateSpring({ mass: 1, stiffness: 400, damping: 28 });
    const soft = simulateSpring({ mass: 1, stiffness: 60, damping: 10 });
    expect(stiff.settleMs).toBeLessThan(soft.settleMs);
  });

  it("heavy mass settles slower than light mass", () => {
    const heavy = simulateSpring({ mass: 3, stiffness: 200, damping: 18 });
    const light = simulateSpring({ mass: 1, stiffness: 200, damping: 18 });
    expect(heavy.settleMs).toBeGreaterThan(light.settleMs);
  });

  it("caps at MAX_SECONDS for extremely underdamped spring", () => {
    const result = simulateSpring({ mass: 1, stiffness: 100, damping: 0.1 });
    expect(result.settleMs).toBe(10000);
  });

  it("all presets produce valid results", () => {
    for (const preset of SPRING_PRESETS) {
      const result = simulateSpring(preset.config);
      expect(result.samples).toHaveLength(101);
      expect(result.samples[0]).toBeCloseTo(0, 1);
      expect(result.samples[100]).toBeCloseTo(1, 1);
      expect(result.settleMs).toBeGreaterThan(0);
    }
  });
});

describe("springToLinearEasing", () => {
  it("wraps values in linear() syntax", () => {
    const result = springToLinearEasing([0, 0.5, 1]);
    expect(result).toBe("linear(0, 0.5, 1)");
  });

  it("rounds to 3 decimal places", () => {
    const result = springToLinearEasing([0.12345, 0.67891]);
    expect(result).toBe("linear(0.123, 0.679)");
  });

  it("handles negative values from overshoot", () => {
    const result = springToLinearEasing([-0.1, 1.2, 1]);
    expect(result).toBe("linear(-0.1, 1.2, 1)");
  });

  it("produces valid CSS for all presets", () => {
    for (const preset of SPRING_PRESETS) {
      const result = simulateSpring(preset.config);
      const css = springToLinearEasing(result.samples);
      expect(css).toMatch(/^linear\(.+\)$/);
      expect(css.split(",")).toHaveLength(101);
    }
  });
});
