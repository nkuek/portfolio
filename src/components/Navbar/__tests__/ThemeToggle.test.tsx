import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import ThemeToggle from "../ThemeToggle";

// Mock the SunAndMoon SVG component
vi.mock("../SunAndMoon", () => ({
  default: () => <span data-testid="sun-and-moon" />,
}));

// Helper to build a controllable matchMedia mock
function createMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  const mql: MediaQueryList = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addEventListener: (
      _event: string,
      cb: EventListenerOrEventListenerObject,
    ) => {
      listeners.push(cb as (e: MediaQueryListEvent) => void);
    },
    removeEventListener: vi.fn(),
  };

  function fireChange(nowDark: boolean) {
    mql.matches = nowDark;
    for (const cb of listeners) {
      cb({ matches: nowDark } as MediaQueryListEvent);
    }
  }

  window.matchMedia = vi.fn().mockReturnValue(mql);

  return { mql, fireChange };
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-color-scheme");
    vi.restoreAllMocks();
    createMatchMedia(false); // default: OS prefers light
  });

  it("restores saved 'dark' from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "dark",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("restores saved 'light' from localStorage on mount", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "light",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("falls back to OS preference when no saved value", () => {
    createMatchMedia(true); // OS prefers dark
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "dark",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggle persists choice to localStorage", async () => {
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);

    const toggle = screen.getByRole("switch");
    await userEvent.click(toggle);

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "dark",
    );
  });

  it("OS preference change is ignored when user has saved preference", () => {
    localStorage.setItem("theme", "light");
    const { fireChange } = createMatchMedia(false);
    render(<ThemeToggle />);

    act(() => fireChange(true));

    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "light",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("OS preference change applies when no saved preference", () => {
    const { fireChange } = createMatchMedia(false);
    render(<ThemeToggle />);

    // Starts light (OS default)
    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "light",
    );

    act(() => fireChange(true));

    expect(document.documentElement.getAttribute("data-color-scheme")).toBe(
      "dark",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
