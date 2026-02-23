import { describe, it, expect } from "vitest";
import { interpolatePath, getSegmentInfo, type Point } from "../cameraPath";

describe("interpolatePath", () => {
  it("returns origin for empty array", () => {
    expect(interpolatePath([], 0.5)).toEqual({ x: 0, y: 0 });
  });

  it("returns the point for single-element array", () => {
    expect(interpolatePath([{ x: 7, y: 3 }], 0.5)).toEqual({ x: 7, y: 3 });
  });

  it("t=0 returns first waypoint exactly", () => {
    const pts: Point[] = [
      { x: 3, y: 7 },
      { x: 10, y: 20 },
      { x: 30, y: 50 },
    ];
    expect(interpolatePath(pts, 0)).toEqual({ x: 3, y: 7 });
  });

  it("t=1 returns last waypoint exactly", () => {
    const pts: Point[] = [
      { x: 3, y: 7 },
      { x: 10, y: 20 },
      { x: 30, y: 50 },
    ];
    expect(interpolatePath(pts, 1)).toEqual({ x: 30, y: 50 });
  });

  it("t < 0 clamps to first waypoint", () => {
    const pts: Point[] = [
      { x: 3, y: 7 },
      { x: 10, y: 20 },
      { x: 30, y: 50 },
    ];
    expect(interpolatePath(pts, -1)).toEqual({ x: 3, y: 7 });
  });

  it("t > 1 clamps to last waypoint", () => {
    const pts: Point[] = [
      { x: 3, y: 7 },
      { x: 10, y: 20 },
      { x: 30, y: 50 },
    ];
    expect(interpolatePath(pts, 5)).toEqual({ x: 30, y: 50 });
  });

  it("collinear points at midpoint return exact waypoint", () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const result = interpolatePath(pts, 0.5);
    expect(result.x).toBeCloseTo(1, 10);
    expect(result.y).toBeCloseTo(1, 10);
  });

  it("two points produce linear interpolation at midpoint", () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const result = interpolatePath(pts, 0.5);
    expect(result.x).toBeCloseTo(5, 10);
    expect(result.y).toBeCloseTo(5, 10);
  });

  it("non-collinear 4-point curve stays within reasonable bounds", () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 5 },
      { x: 10, y: 10 },
    ];
    const result = interpolatePath(pts, 0.5);
    // Catmull-Rom can overshoot slightly, allow generous margin
    expect(result.x).toBeGreaterThanOrEqual(-5);
    expect(result.x).toBeLessThanOrEqual(15);
    expect(result.y).toBeGreaterThanOrEqual(-5);
    expect(result.y).toBeLessThanOrEqual(15);
    expect(Number.isFinite(result.x)).toBe(true);
    expect(Number.isFinite(result.y)).toBe(true);
  });
});

describe("getSegmentInfo", () => {
  it("t=0 returns index 0 with localProgress 1", () => {
    expect(getSegmentInfo(5, 0)).toEqual({ index: 0, localProgress: 1 });
  });

  it("t=1 returns last index with localProgress 1", () => {
    expect(getSegmentInfo(5, 1)).toEqual({ index: 4, localProgress: 1 });
  });

  it("exact midpoint returns correct index with localProgress 1", () => {
    expect(getSegmentInfo(5, 0.5)).toEqual({ index: 2, localProgress: 1 });
  });

  it("between waypoints returns fractional localProgress", () => {
    const result = getSegmentInfo(5, 0.3);
    expect(result.index).toBe(1);
    expect(result.localProgress).toBeCloseTo(0.8, 10);
  });
});
