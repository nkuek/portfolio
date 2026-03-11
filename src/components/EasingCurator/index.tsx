"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { easingReducer, initialState } from "./state";
import type { EditorMode } from "./state";
import type { BezierCurve, SpringConfig } from "./types";
import { DEFAULT_CURVE, DEFAULT_DURATION, PRESETS } from "./constants";
import {
  DEFAULT_SPRING_CONFIG,
  SPRING_PRESETS,
  simulateSpring,
  springToLinearEasing,
} from "./spring";
import BezierEditor from "./BezierEditor";
import SpringEditor from "./SpringEditor";
import AnimationPreview from "./AnimationPreview";
import PresetLibrary from "./PresetLibrary";
import ExportPanel from "./ExportPanel";

function curveLabel(curve: BezierCurve): string {
  return `cubic-bezier(${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2})`;
}

function springLabel(config: SpringConfig, settleMs: number): string {
  return `spring(m:${config.mass} k:${config.stiffness} c:${config.damping}) ${settleMs}ms`;
}

function curvesEqual(a: BezierCurve, b: BezierCurve): boolean {
  return a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2;
}

function findPresetName(curve: BezierCurve): string | null {
  const match = PRESETS.find((p) => curvesEqual(p.curve, curve));
  return match?.name ?? null;
}

function findSpringPresetName(config: SpringConfig): string | null {
  const match = SPRING_PRESETS.find(
    (p) =>
      p.config.mass === config.mass &&
      p.config.stiffness === config.stiffness &&
      p.config.damping === config.damping,
  );
  return match?.name ?? null;
}

function parseFloat2(val: string | null): number | null {
  if (val == null) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function EasingCuratorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitRef = useRef(false);

  // Build initial state from URL params
  const getInitialState = useCallback(() => {
    const modeParam = searchParams.get("mode");
    const mode: EditorMode = modeParam === "spring" ? "spring" : "bezier";

    // Bezier params
    const x1 = parseFloat2(searchParams.get("x1"));
    const y1 = parseFloat2(searchParams.get("y1"));
    const x2 = parseFloat2(searchParams.get("x2"));
    const y2 = parseFloat2(searchParams.get("y2"));
    const d = parseFloat2(searchParams.get("d"));
    const pin = searchParams.get("pin");

    // Spring params
    const m = parseFloat2(searchParams.get("m"));
    const k = parseFloat2(searchParams.get("k"));
    const c = parseFloat2(searchParams.get("c"));
    const pspring = searchParams.get("pspring");

    const hasCoords = x1 != null || y1 != null || x2 != null || y2 != null;
    const curve: BezierCurve = hasCoords
      ? {
          x1: x1 ?? DEFAULT_CURVE.x1,
          y1: y1 ?? DEFAULT_CURVE.y1,
          x2: x2 ?? DEFAULT_CURVE.x2,
          y2: y2 ?? DEFAULT_CURVE.y2,
        }
      : initialState.curve;

    const hasSpring = m != null || k != null || c != null;
    const springConfig: SpringConfig = hasSpring
      ? {
          mass: m ?? DEFAULT_SPRING_CONFIG.mass,
          stiffness: k ?? DEFAULT_SPRING_CONFIG.stiffness,
          damping: c ?? DEFAULT_SPRING_CONFIG.damping,
        }
      : DEFAULT_SPRING_CONFIG;

    // Pinned bezier
    let pinnedCurve: BezierCurve | null = null;
    let pinnedPresetName: string | null = null;
    if (pin) {
      const parts = pin.split(",").map(parseFloat);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        pinnedCurve = {
          x1: parts[0]!,
          y1: parts[1]!,
          x2: parts[2]!,
          y2: parts[3]!,
        };
        pinnedPresetName = findPresetName(pinnedCurve);
      }
    }

    // Pinned spring
    let pinnedSpringConfig: SpringConfig | null = null;
    let pinnedSpringPresetName: string | null = null;
    if (pspring) {
      const parts = pspring.split(",").map(parseFloat);
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        pinnedSpringConfig = {
          mass: parts[0]!,
          stiffness: parts[1]!,
          damping: parts[2]!,
        };
        pinnedSpringPresetName = findSpringPresetName(pinnedSpringConfig);
      }
    }

    let activePreset: string | null;
    if (mode === "spring") {
      activePreset = hasSpring ? findSpringPresetName(springConfig) : "default";
    } else {
      activePreset = hasCoords
        ? findPresetName(curve)
        : initialState.activePreset;
    }

    return {
      mode,
      curve,
      activePreset,
      duration: d != null && d >= 100 && d <= 5000 ? d : initialState.duration,
      pinnedCurve,
      pinnedPresetName,
      springConfig,
      pinnedSpringConfig,
      pinnedSpringPresetName,
    };
    // Only run on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch] = useReducer(
    easingReducer,
    undefined,
    getInitialState,
  );

  // Sync state to URL params (debounced)
  useEffect(() => {
    if (!isInitRef.current) {
      isInitRef.current = true;
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      const {
        mode,
        curve,
        duration,
        pinnedCurve,
        springConfig,
        pinnedSpringConfig,
      } = state;

      if (mode === "spring") {
        params.set("mode", "spring");
      }

      if (mode === "bezier" && !curvesEqual(curve, DEFAULT_CURVE)) {
        params.set("x1", String(curve.x1));
        params.set("y1", String(curve.y1));
        params.set("x2", String(curve.x2));
        params.set("y2", String(curve.y2));
      }

      if (
        mode === "spring" &&
        (springConfig.mass !== DEFAULT_SPRING_CONFIG.mass ||
          springConfig.stiffness !== DEFAULT_SPRING_CONFIG.stiffness ||
          springConfig.damping !== DEFAULT_SPRING_CONFIG.damping)
      ) {
        params.set("m", String(springConfig.mass));
        params.set("k", String(springConfig.stiffness));
        params.set("c", String(springConfig.damping));
      }

      if (duration !== DEFAULT_DURATION) {
        params.set("d", String(duration));
      }

      if (pinnedCurve) {
        params.set(
          "pin",
          `${pinnedCurve.x1},${pinnedCurve.y1},${pinnedCurve.x2},${pinnedCurve.y2}`,
        );
      }

      if (pinnedSpringConfig) {
        params.set(
          "pspring",
          `${pinnedSpringConfig.mass},${pinnedSpringConfig.stiffness},${pinnedSpringConfig.damping}`,
        );
      }

      const qs = params.toString();
      const url = qs ? `?${qs}` : window.location.pathname;
      router.replace(url, { scroll: false });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [state, router]);

  // Compute spring result
  const springResult = useMemo(
    () => simulateSpring(state.springConfig),
    [state.springConfig],
  );

  const pinnedSpringResult = useMemo(
    () =>
      state.pinnedSpringConfig
        ? simulateSpring(state.pinnedSpringConfig)
        : null,
    [state.pinnedSpringConfig],
  );

  // Compute easing strings for AnimationPreview
  const easing = useMemo(() => {
    if (state.mode === "spring") {
      return springToLinearEasing(springResult.samples);
    }
    return `cubic-bezier(${state.curve.x1}, ${state.curve.y1}, ${state.curve.x2}, ${state.curve.y2})`;
  }, [state.mode, state.curve, springResult.samples]);

  const pinnedEasing = useMemo(() => {
    if (state.pinnedCurve) {
      return `cubic-bezier(${state.pinnedCurve.x1}, ${state.pinnedCurve.y1}, ${state.pinnedCurve.x2}, ${state.pinnedCurve.y2})`;
    }
    if (pinnedSpringResult) {
      return springToLinearEasing(pinnedSpringResult.samples);
    }
    return null;
  }, [state.pinnedCurve, pinnedSpringResult]);

  const isPinned =
    state.pinnedCurve != null || state.pinnedSpringConfig != null;

  // Readout label
  const readout = useMemo(() => {
    if (state.mode === "spring") {
      return springLabel(state.springConfig, springResult.settleMs);
    }
    return curveLabel(state.curve);
  }, [state.mode, state.curve, state.springConfig, springResult.settleMs]);

  // Pinned readout label
  const pinnedReadout = useMemo(() => {
    if (state.pinnedCurve) {
      return state.pinnedPresetName ?? curveLabel(state.pinnedCurve);
    }
    if (state.pinnedSpringConfig) {
      const result = simulateSpring(state.pinnedSpringConfig);
      return (
        state.pinnedSpringPresetName ??
        springLabel(state.pinnedSpringConfig, result.settleMs)
      );
    }
    return "";
  }, [
    state.pinnedCurve,
    state.pinnedPresetName,
    state.pinnedSpringConfig,
    state.pinnedSpringPresetName,
  ]);

  const handlePin = useCallback(() => {
    if (state.mode === "spring") {
      dispatch({ type: "PIN_SPRING" });
    } else {
      dispatch({ type: "PIN_CURVE" });
    }
  }, [state.mode]);

  const handleUnpin = useCallback(() => {
    if (state.pinnedCurve) {
      dispatch({ type: "UNPIN_CURVE" });
    } else {
      dispatch({ type: "UNPIN_SPRING" });
    }
  }, [state.pinnedCurve]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="title text-text mb-2">Easing Curator</h1>
        <p className="text-text-muted text-lg font-light">
          Craft, compare, and export easing curves.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr_320px]">
        {/* Left -- Presets + Comparison */}
        <aside className="order-2 flex flex-col gap-4 lg:order-1">
          <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PresetLibrary
              mode={state.mode}
              activePreset={state.activePreset}
              pinnedPresetName={state.pinnedPresetName}
              pinnedSpringPresetName={state.pinnedSpringPresetName}
              dispatch={dispatch}
            />
          </div>

          {/* Pin / comparison controls */}
          {isPinned ? (
            <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="text-text-subtle text-xs font-medium">
                  Comparing
                </span>
                <button
                  type="button"
                  onClick={handleUnpin}
                  className="text-text-muted hover:text-text cursor-pointer font-mono text-xs transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="bg-accent/10 text-accent w-fit rounded px-1 py-0.5 font-mono text-[10px] leading-none">
                      {state.mode === "spring" ? "spring" : "bezier"}
                    </span>
                    <span className="text-text-muted truncate font-mono text-xs">
                      {state.activePreset ?? readout}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--accent-rose)]" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="w-fit rounded bg-[var(--accent-rose)]/10 px-1 py-0.5 font-mono text-[10px] leading-none text-[var(--accent-rose)]">
                      {state.pinnedSpringConfig ? "spring" : "bezier"}
                    </span>
                    <span className="text-text-muted truncate font-mono text-xs">
                      {pinnedReadout}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePin}
              className="border-border-hairline text-text-muted hover:border-accent hover:text-text-subtle flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
                <path d="M9.828 1.515a.5.5 0 0 1 .707 0l3.95 3.95a.5.5 0 0 1-.122.796l-2.678 1.339-.507.507 1.165 3.494a.5.5 0 0 1-.129.512L11.16 13.16a.5.5 0 0 1-.707 0L7.05 9.757l-3.464 3.464a.5.5 0 0 1-.707-.707L6.343 9.05 2.94 5.647a.5.5 0 0 1 0-.707l1.047-1.053a.5.5 0 0 1 .512-.129l3.494 1.165.507-.507L9.839 2.34l-.01-.118a.5.5 0 0 1 0-.707z" />
              </svg>
              Pin {state.mode === "spring" ? "spring" : "curve"} to compare
            </button>
          )}
        </aside>

        {/* Center -- Editor */}
        <section className="order-1 lg:order-2">
          <div className="bg-surface-card border-border-hairline rounded-xl border p-6 shadow-[var(--shadow-card)]">
            {/* Mode toggle */}
            <div className="mb-6 flex justify-center">
              <div className="border-border-hairline relative grid grid-cols-2 rounded-lg border p-1">
                <div
                  className="bg-accent absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md transition-transform duration-200 ease-[var(--ease-spring)]"
                  style={{
                    transform:
                      state.mode === "spring"
                        ? "translateX(100%)"
                        : "translateX(0)",
                  }}
                />
                {(["bezier", "spring"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => dispatch({ type: "SET_MODE", mode: m })}
                    className={`relative z-1 cursor-pointer px-4 py-1.5 text-center font-mono text-sm transition-colors duration-200 ${
                      state.mode === m
                        ? "text-white"
                        : "text-text-muted hover:text-text-subtle"
                    }`}
                  >
                    {m === "bezier" ? "Bezier" : "Spring"}
                  </button>
                ))}
              </div>
            </div>

            {state.mode === "bezier" ? (
              <BezierEditor
                curve={state.curve}
                pinnedCurve={state.pinnedCurve}
                pinnedSamples={pinnedSpringResult?.samples ?? null}
                dispatch={dispatch}
              />
            ) : (
              <SpringEditor
                springConfig={state.springConfig}
                pinnedSamples={pinnedSpringResult?.samples ?? null}
                pinnedCurve={state.pinnedCurve}
                dispatch={dispatch}
              />
            )}
          </div>

          {/* Curve readout */}
          <p
            className="text-text-muted mt-3 text-center font-mono text-sm"
            aria-live="polite"
          >
            {readout}
          </p>
        </section>

        {/* Right -- Preview + Export */}
        <aside className="order-3 flex flex-col gap-6">
          <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <AnimationPreview
              easing={easing}
              pinnedEasing={pinnedEasing}
              state={state}
              dispatch={dispatch}
            />
          </div>
          <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <ExportPanel
              mode={state.mode}
              curve={state.curve}
              duration={state.duration}
              springConfig={state.springConfig}
              springSamples={springResult.samples}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function EasingCurator() {
  return (
    <Suspense>
      <EasingCuratorInner />
    </Suspense>
  );
}
