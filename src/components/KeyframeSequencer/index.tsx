"use client";

import { Suspense, useCallback, useEffect, useReducer, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ToolGuide, {
  GuideGrid,
  GuideSection,
  GuideList,
  GuideItem,
  Kbd,
} from "~/components/ToolGuide";
import { initialState, historyReducer, createHistoryState } from "./state";
import type { KeyframeSequencerState, HistoryAction } from "./state";
import { encodeState, decodeState } from "./url";
import cn from "~/utils/cn";
import Timeline from "./Timeline";
import PropertyEditor from "./PropertyEditor";
import AnimationPreview from "./AnimationPreview";
import PresetLibrary from "./PresetLibrary";
import ExportPanel from "./ExportPanel";

function KeyframeSequencerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitRef = useRef(false);
  const progressRef = useRef(0);
  const seekRef = useRef<((progress: number) => void) | null>(null);

  const handleProgress = useCallback((progress: number) => {
    progressRef.current = progress;
  }, []);

  const getInitialHistory = useCallback(() => {
    const encoded = searchParams.get("s");
    if (encoded) {
      const decoded = decodeState(encoded);
      if (decoded) {
        const present: KeyframeSequencerState = {
          ...initialState,
          keyframes: decoded.keyframes,
          segmentEasings: decoded.segmentEasings,
          animationName: decoded.animationName,
          duration: decoded.duration,
          iterationCount: decoded.iterationCount,
          direction: decoded.direction,
          fillMode: decoded.fillMode,
          activePreset: decoded.activePreset,
          selectedKeyframeId: decoded.keyframes[0]?.id ?? null,
        };
        return createHistoryState(present);
      }
    }
    return createHistoryState(initialState);
    // Only run on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    getInitialHistory,
  );

  const state = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      // Don't capture when focused on an input/textarea
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
  }, []);

  // Pause when tab is hidden, resume when visible
  const playbackRef = useRef(state.playback);
  playbackRef.current = state.playback;
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        wasPlayingRef.current = playbackRef.current === "playing";
        if (wasPlayingRef.current) {
          dispatch({ type: "SET_PLAYBACK", playback: "paused" });
        }
      } else if (wasPlayingRef.current) {
        dispatch({ type: "SET_PLAYBACK", playback: "playing" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Sync state to URL (debounced 300ms)
  useEffect(() => {
    if (!isInitRef.current) {
      isInitRef.current = true;
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const encoded = encodeState({
        keyframes: state.keyframes,
        segmentEasings: state.segmentEasings,
        animationName: state.animationName,
        duration: state.duration,
        iterationCount: state.iterationCount,
        direction: state.direction,
        fillMode: state.fillMode,
        activePreset: state.activePreset,
      });

      const params = new URLSearchParams();
      params.set("s", encoded);
      const url = `?${params.toString()}`;
      router.replace(url, { scroll: false });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [
    state.keyframes,
    state.segmentEasings,
    state.animationName,
    state.duration,
    state.iterationCount,
    state.direction,
    state.fillMode,
    state.activePreset,
    router,
  ]);

  const selectedKeyframe =
    state.keyframes.find((kf) => kf.id === state.selectedKeyframeId) ?? null;

  const isEndpoint =
    selectedKeyframe?.offset === 0 || selectedKeyframe?.offset === 100;

  // Cast dispatch so child components only see KeyframeSequencerAction
  // (HistoryAction is a superset, so this is safe)
  const childDispatch = dispatch as React.Dispatch<HistoryAction>;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
      <header className="mb-8 sm:mb-12">
        <h1 className="title text-text mb-2">Keyframe Sequencer</h1>
        <p className="text-text-muted text-lg font-light">
          Design multi-step CSS keyframe animations with per-segment easing.
        </p>
      </header>

      {/* Toolbar: name + undo/redo/reset */}
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <label
          htmlFor="animation-name"
          className="text-text-muted font-mono text-xs"
        >
          Name
        </label>
        <input
          id="animation-name"
          type="text"
          value={state.animationName}
          onChange={(e) =>
            dispatch({ type: "SET_ANIMATION_NAME", name: e.target.value })
          }
          spellCheck={false}
          className="border-border-hairline bg-surface-card-alt text-text min-w-0 flex-1 rounded-md border px-3 py-1.5 font-mono text-sm outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 sm:max-w-48"
        />

        <div className="flex items-center gap-1.5">
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
          <button
            type="button"
            aria-label="Reset to default"
            onClick={() => dispatch({ type: "RESET" })}
            className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs outline-[var(--accent)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]"
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>

      <ToolGuide>
        <GuideGrid>
          <GuideSection title="Timeline">
            <GuideList>
              <GuideItem>Click + to add a keyframe</GuideItem>
              <GuideItem>Drag markers to reposition</GuideItem>
              <GuideItem>
                <Kbd>Arrow keys</Kbd> nudge by 1% (<Kbd>Shift</Kbd> for 5%)
              </GuideItem>
              <GuideItem>
                <Kbd>Delete</Kbd> / <Kbd>Backspace</Kbd> remove keyframe
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Properties">
            <GuideList>
              <GuideItem>Select a keyframe to edit its properties</GuideItem>
              <GuideItem>
                Toggle checkboxes to include/exclude from animation
              </GuideItem>
              <GuideItem>
                Duplicate or delete from the property editor
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Easing">
            <GuideList>
              <GuideItem>
                Click curve between markers to change easing
              </GuideItem>
              <GuideItem>
                Paste a custom{" "}
                <code className="text-accent font-mono text-[11px]">
                  cubic-bezier()
                </code>{" "}
                or use a preset
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Preview & Export">
            <GuideList>
              <GuideItem>Play/pause preview, scrub the timeline</GuideItem>
              <GuideItem>Choose shape, direction, and fill mode</GuideItem>
              <GuideItem>
                Export as CSS, Tailwind v4, or Framer Motion
              </GuideItem>
              <GuideItem>Click exported code to select all</GuideItem>
            </GuideList>
          </GuideSection>
        </GuideGrid>
        <div className="border-border-hairline mt-3 border-t pt-3">
          <GuideSection title="Shortcuts">
            <div className="text-text-muted flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
              <span>
                <Kbd>Cmd/Ctrl</Kbd> + <Kbd>Z</Kbd> Undo
              </span>
              <span>
                <Kbd>Cmd/Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>Z</Kbd> Redo
              </span>
            </div>
          </GuideSection>
        </div>
      </ToolGuide>

      {/* Timeline — full width */}
      <div className="mb-6">
        <Timeline
          keyframes={state.keyframes}
          segmentEasings={state.segmentEasings}
          selectedKeyframeId={state.selectedKeyframeId}
          progressRef={progressRef}
          seekRef={seekRef}
          playback={state.playback}
          dispatch={childDispatch}
        />
      </div>

      {/* Two-column layout: editor + preview/export */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Left column: Property editor + Presets */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PropertyEditor
              keyframe={selectedKeyframe}
              isEndpoint={isEndpoint}
              dispatch={childDispatch}
            />
          </div>
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PresetLibrary
              activePreset={state.activePreset}
              dispatch={childDispatch}
            />
          </div>
        </div>

        {/* Right column: Preview + Export */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <AnimationPreview
              keyframes={state.keyframes}
              segmentEasings={state.segmentEasings}
              duration={state.duration}
              iterationCount={state.iterationCount}
              direction={state.direction}
              fillMode={state.fillMode}
              previewShape={state.previewShape}
              playback={state.playback}
              dispatch={childDispatch}
              onProgress={handleProgress}
              seekRef={seekRef}
            />
          </div>
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <ExportPanel
              keyframes={state.keyframes}
              segmentEasings={state.segmentEasings}
              animationName={state.animationName}
              duration={state.duration}
              iterationCount={state.iterationCount}
              direction={state.direction}
              fillMode={state.fillMode}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function KeyframeSequencer() {
  return (
    <Suspense>
      <KeyframeSequencerInner />
    </Suspense>
  );
}
