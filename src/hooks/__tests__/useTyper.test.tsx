import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import useTyper from "../useTyper";

let observerCallback: IntersectionObserverCallback;
let mockObserverInstance: MockIntersectionObserver;

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(cb: IntersectionObserverCallback) {
    observerCallback = cb;
    mockObserverInstance = this;
  }
}

/** Attach a DOM element to the hook's callback ref and trigger in-view */
async function setupAndEnterView(result: {
  current: ReturnType<typeof useTyper>;
}) {
  act(() => {
    result.current.ref(document.createElement("div"));
  });
  await act(async () => {
    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      mockObserverInstance as unknown as IntersectionObserver,
    );
  });
}

describe("useTyper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initial display is items[0]", () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    expect(result.current.display).toBe("Hi");
  });

  it("initial cursor is visible", () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    expect(result.current.cursorVisible).toBe(true);
  });

  it("does NOT start typing/deleting before element is in view", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));

    // Attach ref but never trigger intersection
    act(() => {
      result.current.ref(document.createElement("div"));
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.display).toBe("Hi");
  });

  it("starts deleting after in-view + 3000ms initial delay", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    await setupAndEnterView(result);

    // Just before the delay — no change
    await act(async () => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.display).toBe("Hi");

    // At 3000ms the first tick fires: delete one char
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.display).toBe("H");
  });

  it("after full deletion, pauses, then types next item char-by-char", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    await setupAndEnterView(result);

    // t+3000: "H" (first delete)
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.display).toBe("H");

    // t+3040: "" (second delete, string empty)
    await act(async () => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current.display).toBe("");

    // t+3440: "G" (pause 400ms, then type first char of "Go")
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.display).toBe("G");

    // t+3520: "Go" (type second char, 80ms with Math.random=0)
    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current.display).toBe("Go");
  });

  it("cycles back to first item after exhausting all items", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    await setupAndEnterView(result);

    // Full sequence:
    // +3000 → "H", +40 → "", +400 → "G", +80 → "Go"
    // +2000 → "G" (delete), +40 → "" (delete done, roleIdx → 0)
    // +400 → "H" (typing first item again)
    await act(async () => {
      vi.advanceTimersByTime(3000 + 40 + 400 + 80 + 2000 + 40 + 400);
    });
    expect(result.current.display).toBe("H");

    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current.display).toBe("Hi");
  });

  it("cursor toggles every 530ms when in view", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));
    await setupAndEnterView(result);

    expect(result.current.cursorVisible).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(530);
    });
    expect(result.current.cursorVisible).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(530);
    });
    expect(result.current.cursorVisible).toBe(true);
  });

  it("cursor does NOT toggle when not in view", async () => {
    const { result } = renderHook(() => useTyper(["Hi", "Go"]));

    act(() => {
      result.current.ref(document.createElement("div"));
    });

    // Advance well past several toggle cycles without triggering in-view
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.cursorVisible).toBe(true);
  });
});
