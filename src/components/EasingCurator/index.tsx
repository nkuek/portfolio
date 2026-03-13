"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ToolGuide, {
  GuideGrid,
  GuideSection,
  GuideList,
  GuideItem,
  Kbd,
} from "~/components/ToolGuide";
import useHistoryReducer from "~/hooks/useHistoryReducer";
import { easingReducer, initialState, NON_UNDOABLE } from "./state";
import type { EditorMode } from "./state";
import cn from "~/utils/cn";
import type { BezierCurve, SpringConfig } from "./types";
import { DEFAULT_CURVE, DEFAULT_DURATION, PRESETS } from "./constants";
import { formatCSS } from "./ExportPanel/formatters";
import {
  DEFAULT_SPRING_CONFIG,
  SPRING_PRESETS,
  simulateSpring,
  springToLinearEasing,
} from "./spring";
import { sampleBezierDerivatives } from "./derivatives";
import CurveCanvas, { CURVE_VIEW_BOX, OVERLAY_COLORS } from "./CurveCanvas";
import DragHandle from "./BezierEditor/DragHandle";
import BezierEditor from "./BezierEditor";
import SpringEditor from "./SpringEditor";
import AnimationPreview from "./AnimationPreview";
import PresetLibrary from "./PresetLibrary";
import ExportPanel from "./ExportPanel";

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

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function EasingCuratorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
      editorPanel: mode,
      curve,
      activePreset,
      lastPreset: activePreset,
      duration: d != null && d >= 100 && d <= 5000 ? d : initialState.duration,
      pinnedCurve,
      pinnedPresetName,
      springConfig,
      pinnedSpringConfig,
      pinnedSpringPresetName,
      overlay: "none" as const,
    };
    // Only run on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch, { canUndo, canRedo }] = useHistoryReducer(
    easingReducer,
    getInitialState,
    { nonUndoable: NON_UNDOABLE },
  );

  // Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      if (e.shiftKey) {
        dispatch({ type: "REDO" });
      } else {
        dispatch({ type: "UNDO" });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch]);

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
    // Only re-run when URL-relevant state changes (not overlay, editorPanel, activePreset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.mode,
    state.curve,
    state.duration,
    state.pinnedCurve,
    state.springConfig,
    state.pinnedSpringConfig,
    router,
  ]);

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
    return formatCSS(state.curve);
  }, [state.mode, state.curve, springResult.samples]);

  const pinnedEasing = useMemo(() => {
    if (state.pinnedCurve) {
      return formatCSS(state.pinnedCurve);
    }
    if (pinnedSpringResult) {
      return springToLinearEasing(pinnedSpringResult.samples);
    }
    return null;
  }, [state.pinnedCurve, pinnedSpringResult]);

  // Compute derivative overlay samples
  const bezierDerivatives = useMemo(() => {
    if (state.mode !== "bezier" || state.overlay === "none") return null;
    return sampleBezierDerivatives(state.curve);
  }, [state.mode, state.curve, state.overlay]);

  const overlaySamples = useMemo(() => {
    if (state.overlay === "none") return undefined;
    if (state.mode === "spring") {
      return state.overlay === "velocity"
        ? springResult.velocities
        : springResult.accelerations;
    }
    if (bezierDerivatives) {
      return state.overlay === "velocity"
        ? bezierDerivatives.velocities
        : bezierDerivatives.accelerations;
    }
    return undefined;
  }, [state.mode, state.overlay, springResult, bezierDerivatives]);

  // Drag batch callbacks — collapse a full drag gesture into one undo step
  // and defer preview updates until the drag is complete
  const [isDragging, setIsDragging] = useState(false);

  // Deferred easing — freezes during drag so preview animations don't restart
  const previewEasingRef = useRef(easing);
  if (!isDragging) {
    previewEasingRef.current = easing;
  }
  const previewEasing = previewEasingRef.current;

  const isPinned =
    state.pinnedCurve != null || state.pinnedSpringConfig != null;

  // Drag-and-drop comparison
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-easing-preset")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-easing-preset")) {
      e.preventDefault();
      dragCounterRef.current++;
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const raw = e.dataTransfer.getData("application/x-easing-preset");
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        if (data.type === "bezier") {
          dispatch({ type: "PIN_CURVE", curve: data.curve, name: data.name });
        } else if (data.type === "spring") {
          dispatch({
            type: "PIN_SPRING",
            config: data.config,
            name: data.name,
          });
        }
      } catch {
        // invalid drag data
      }
    },
    [dispatch],
  );

  // Readout label
  const readout = useMemo(() => {
    if (state.mode === "spring") {
      return springLabel(state.springConfig, springResult.settleMs);
    }
    return formatCSS(state.curve);
  }, [state.mode, state.curve, state.springConfig, springResult.settleMs]);

  // Pinned readout label
  const pinnedReadout = useMemo(() => {
    if (state.pinnedCurve) {
      return state.pinnedPresetName ?? formatCSS(state.pinnedCurve);
    }
    if (state.pinnedSpringConfig && pinnedSpringResult) {
      return (
        state.pinnedSpringPresetName ??
        springLabel(state.pinnedSpringConfig, pinnedSpringResult.settleMs)
      );
    }
    return "";
  }, [
    state.pinnedCurve,
    state.pinnedPresetName,
    state.pinnedSpringConfig,
    state.pinnedSpringPresetName,
    pinnedSpringResult,
  ]);


  const handleUnpin = useCallback(() => {
    if (state.pinnedCurve) {
      dispatch({ type: "UNPIN_CURVE" });
    } else {
      dispatch({ type: "UNPIN_SPRING" });
    }
  }, [state.pinnedCurve]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    dispatch({ type: "BATCH_START" });
  }, [dispatch]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dispatch({ type: "BATCH_END" });
  }, [dispatch]);

  // Drag handle callbacks
  const handleP1Drag = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_HANDLE", handle: "p1", x: round(x), y: round(y) });
    },
    [dispatch],
  );

  const handleP2Drag = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_HANDLE", handle: "p2", x: round(x), y: round(y) });
    },
    [dispatch],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
      <header className="mb-8 sm:mb-12">
        <h1 className="title text-text mb-2">Easing Curator</h1>
        <p className="text-text-muted text-lg font-light">
          Craft, compare, and export easing curves.
        </p>
      </header>

      <ToolGuide>
        <GuideGrid>
          <GuideSection title="Editing">
            <GuideList>
              <GuideItem>Drag control points to shape the curve</GuideItem>
              <GuideItem>
                <Kbd>Arrow keys</Kbd> for fine-tuning (<Kbd>Shift</Kbd> for
                larger steps)
              </GuideItem>
              <GuideItem>Switch between Bezier and Spring modes</GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Comparing">
            <GuideList>
              <GuideItem>
                Pin or drag a preset to the sidebar to compare
              </GuideItem>
              <GuideItem>
                Velocity/acceleration overlays show derivatives
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Presets">
            <GuideList>
              <GuideItem>Click any preset to apply it instantly</GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Export">
            <GuideList>
              <GuideItem>Click exported code to select all</GuideItem>
            </GuideList>
          </GuideSection>
        </GuideGrid>
      </ToolGuide>

      {/* Undo / Redo toolbar */}
      <div className="mb-6 flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "UNDO" })}
          className={cn(
            "border-border-hairline bg-surface-card flex size-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]",
            canUndo
              ? "text-text-subtle hover:border-accent hover:bg-accent hover:text-white"
              : "text-text-muted cursor-not-allowed opacity-40",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "REDO" })}
          className={cn(
            "border-border-hairline bg-surface-card flex size-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]",
            canRedo
              ? "text-text-subtle hover:border-accent hover:bg-accent hover:text-white"
              : "text-text-muted cursor-not-allowed opacity-40",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13" />
          </svg>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px] md:gap-8 lg:grid-cols-[260px_1fr_320px]">
        {/* Left -- Presets + Comparison (entire column is drop zone) */}
        <aside
          className="order-2 flex min-w-0 flex-col gap-4 md:order-3 md:col-span-2 lg:order-1 lg:col-span-1"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PresetLibrary
              editorPanel={state.editorPanel}
              activePreset={state.activePreset}
              lastPreset={state.lastPreset}
              pinnedPresetName={state.pinnedPresetName}
              pinnedSpringPresetName={state.pinnedSpringPresetName}
              dispatch={dispatch}
            />
          </div>

          {/* Compare section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-text-subtle text-sm font-medium">Compare</h3>
            {isPinned ? (
              <div
                className={`bg-surface-card rounded-xl border p-4 shadow-[var(--shadow-card)] transition-colors ${isDragOver ? "border-accent" : "border-border-hairline"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-subtle text-xs font-medium">
                    Comparing
                  </span>
                  <button
                    type="button"
                    onClick={handleUnpin}
                    className="text-text-muted hover:text-text cursor-pointer rounded font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="bg-accent/10 text-accent w-fit truncate rounded px-1 py-0.5 font-mono text-xs leading-none">
                        {state.activePreset ?? readout}
                      </span>
                      <span className="text-text-muted font-mono text-[10px]">
                        {state.mode === "spring" ? "spring" : "bezier"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--accent-rose)]" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="w-fit truncate rounded bg-[var(--accent-rose)]/10 px-1 py-0.5 font-mono text-xs leading-none text-[var(--accent-rose)]">
                        {pinnedReadout}
                      </span>
                      <span className="text-text-muted font-mono text-[10px]">
                        {state.pinnedSpringConfig ? "spring" : "bezier"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  isDragOver
                    ? "border-accent bg-accent/5"
                    : "border-border-hairline border-dashed"
                }`}
              >
                <p
                  className={`text-center font-mono text-xs ${isDragOver ? "text-accent" : "text-text-muted"}`}
                >
                  {isDragOver
                    ? "Drop to compare"
                    : "Pin or drag a preset to compare"}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Center -- Editor */}
        <section className="order-1 min-w-0 md:order-1 lg:order-2">
          <div className="bg-surface-card border-border-hairline rounded-xl border p-6 shadow-[var(--shadow-card)]">
            {/* Mode toggle */}
            <div className="mb-6 flex justify-center">
              <div className="border-border-hairline relative grid grid-cols-2 rounded-lg border p-1">
                {(["bezier", "spring"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => dispatch({ type: "SET_MODE", mode: m })}
                    className={`text-text-muted cursor-pointer rounded-md px-4 py-1.5 text-center font-mono text-sm outline-[var(--accent)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
                      state.editorPanel !== m
                        ? "hover:bg-surface-card-alt hover:text-text-subtle"
                        : ""
                    }`}
                  >
                    {m === "bezier" ? "Bezier" : "Spring"}
                  </button>
                ))}
                <div
                  aria-hidden="true"
                  className="bg-accent pointer-events-none absolute inset-1 grid grid-cols-2 rounded-md transition-[clip-path] duration-200 ease-[var(--ease-spring)]"
                  style={{
                    clipPath:
                      state.editorPanel === "spring"
                        ? "inset(0 0 0 50%)"
                        : "inset(0 50% 0 0)",
                  }}
                >
                  <span className="flex items-center justify-center font-mono text-sm text-white">
                    Bezier
                  </span>
                  <span className="flex items-center justify-center font-mono text-sm text-white">
                    Spring
                  </span>
                </div>
              </div>
            </div>

            {/* Shared SVG canvas */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <svg
                  ref={svgRef}
                  viewBox={CURVE_VIEW_BOX}
                  className="relative z-10 w-full overflow-visible"
                  style={{ touchAction: "none" }}
                >
                  <CurveCanvas
                    curve={state.mode === "bezier" ? state.curve : undefined}
                    samples={
                      state.mode === "spring" ? springResult.samples : undefined
                    }
                    pinnedCurve={state.pinnedCurve}
                    pinnedSamples={pinnedSpringResult?.samples ?? null}
                    overlaySamples={overlaySamples}
                    overlayType={state.overlay}
                  />
                  <g
                    style={{
                      opacity: state.editorPanel === "bezier" ? 1 : 0,
                      transition: "opacity 150ms ease",
                      pointerEvents:
                        state.editorPanel === "bezier" ? "auto" : "none",
                    }}
                  >
                    <line
                      x1={0}
                      y1={1}
                      x2={state.curve.x1}
                      y2={1 - state.curve.y1}
                      stroke="var(--accent)"
                      strokeWidth={0.006}
                      opacity={0.4}
                    />
                    <line
                      x1={1}
                      y1={0}
                      x2={state.curve.x2}
                      y2={1 - state.curve.y2}
                      stroke="var(--accent-rose)"
                      strokeWidth={0.006}
                      opacity={0.4}
                    />
                    <DragHandle
                      cx={state.curve.x1}
                      cy={1 - state.curve.y1}
                      label="Control point 1"
                      color="var(--accent)"
                      onDrag={handleP1Drag}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      svgRef={svgRef}
                    />
                    <DragHandle
                      cx={state.curve.x2}
                      cy={1 - state.curve.y2}
                      label="Control point 2"
                      color="var(--accent-rose)"
                      onDrag={handleP2Drag}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      svgRef={svgRef}
                    />
                  </g>
                </svg>

                {/* Derivative overlay toggles — floating on canvas */}
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                  {(["velocity", "acceleration"] as const).map((ov) => {
                    const active = state.overlay === ov;
                    const color = OVERLAY_COLORS[ov];
                    return (
                      <button
                        key={ov}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "SET_OVERLAY",
                            overlay: active ? "none" : ov,
                          })
                        }
                        className={`cursor-pointer rounded-full px-2 py-0.5 font-mono text-[10px] leading-tight outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.95] ${
                          active
                            ? "font-medium"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: active
                            ? `${color}26`
                            : "var(--surface-card)",
                          color: active ? color : "var(--text-muted)",
                          border: `1px solid ${active ? color : "var(--border-hairline)"}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = color;
                            e.currentTarget.style.color = color;
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = "";
                            e.currentTarget.style.color = "";
                            e.currentTarget.style.opacity = "";
                          }
                        }}
                      >
                        {ov === "velocity" ? "vel" : "accel"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editor controls */}
              {state.editorPanel === "bezier" ? (
                <BezierEditor
                  curve={state.curve}
                  dispatch={dispatch}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ) : (
                <SpringEditor
                  springConfig={state.springConfig}
                  settleMs={springResult.settleMs}
                  dispatch={dispatch}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
            </div>
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
        <aside className="order-3 flex min-w-0 flex-col gap-6 md:order-2 lg:order-3">
          <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <AnimationPreview
              easing={previewEasing}
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
              activePreset={state.activePreset}
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
