import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import useReducedMotion from "../useReducedMotion";

describe("useReducedMotion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when user prefers reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when user does not prefer reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
