"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  AnimationDirection,
  FillMode,
  KeyframeStop,
  PlaybackState,
  PreviewShape,
  SegmentEasing,
} from "../types";
import type { KeyframeSequencerAction } from "../state";
import useReducedMotion from "~/hooks/useReducedMotion";
import cn from "~/utils/cn";

type AnimationPreviewProps = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasing[];
  duration: number;
  iterationCount: number | "infinite";
  direction: AnimationDirection;
  fillMode: FillMode;
  previewShape: PreviewShape;
  playback: PlaybackState;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stateToWaapiKeyframes(
  keyframes: KeyframeStop[],
  segmentEasings: SegmentEasing[],
): Keyframe[] {
  return keyframes.map((kf, i) => {
    const frame: Keyframe = { offset: kf.offset / 100 };

    // Only include masked-on properties
    if (
      kf.mask.translateX ||
      kf.mask.translateY ||
      kf.mask.scale ||
      kf.mask.rotate
    ) {
      const parts: string[] = [];
      if (kf.mask.translateX)
        parts.push(`translateX(${kf.properties.translateX}px)`);
      if (kf.mask.translateY)
        parts.push(`translateY(${kf.properties.translateY}px)`);
      if (kf.mask.scale) parts.push(`scale(${kf.properties.scale})`);
      if (kf.mask.rotate) parts.push(`rotate(${kf.properties.rotate}deg)`);
      frame.transform = parts.join(" ");
    }
    if (kf.mask.opacity) frame.opacity = kf.properties.opacity;
    if (kf.mask.backgroundColor)
      frame.backgroundColor = kf.properties.backgroundColor;

    // Per-keyframe easing: segment easing defines easing FROM this keyframe TO the next
    if (i < segmentEasings.length) {
      const segment = segmentEasings[i];
      if (segment) {
        frame.easing = segment.easing;
      }
    }

    return frame;
  });
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const CARD_BUTTON =
  "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer rounded-md border px-1.5 py-1 font-mono text-[11px] sm:px-2 sm:text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]";

const ACTIVE_BUTTON = "border-accent bg-accent text-white";

const NUMBER_INPUT =
  "border-border-hairline bg-surface-card-alt text-text w-14 shrink-0 rounded-md border px-1.5 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2";

const RANGE_INPUT =
  "w-full cursor-pointer rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2";

const LABEL_SECTION = "text-text-subtle text-sm font-medium";

const LABEL_SMALL = "text-text-muted font-mono text-xs";

// ---------------------------------------------------------------------------
// Direction / Fill mode options
// ---------------------------------------------------------------------------

const DIRECTION_OPTIONS: AnimationDirection[] = [
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
];

const FILL_OPTIONS: FillMode[] = ["none", "forwards", "backwards", "both"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnimationPreview({
  keyframes,
  segmentEasings,
  duration,
  iterationCount,
  direction,
  fillMode,
  previewShape,
  playback,
  dispatch,
}: AnimationPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const seekerRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const wasPausedRef = useRef(false);

  const reducedMotion = useReducedMotion();

  // -------------------------------------------------------------------------
  // WAAPI animation lifecycle
  // -------------------------------------------------------------------------

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const waapiKeyframes = stateToWaapiKeyframes(keyframes, segmentEasings);
    if (waapiKeyframes.length < 2) return;

    const anim = el.animate(waapiKeyframes, {
      duration,
      iterations: iterationCount === "infinite" ? Infinity : iterationCount,
      direction,
      fill: fillMode,
    });

    if (playback === "paused") anim.pause();
    animRef.current = anim;

    return () => {
      anim.cancel();
      animRef.current = null;
    };
  }, [
    keyframes,
    segmentEasings,
    duration,
    iterationCount,
    direction,
    fillMode,
    playback,
  ]);

  // -------------------------------------------------------------------------
  // Reduced motion: auto-pause
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (reducedMotion && animRef.current) {
      animRef.current.pause();
    }
  }, [reducedMotion]);

  // -------------------------------------------------------------------------
  // Scrubber rAF loop (direct DOM writes)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const tick = () => {
      if (!draggingRef.current && animRef.current?.currentTime != null) {
        const ct = animRef.current.currentTime as number;
        // Use modulo so the scrubber loops within a single iteration
        const progress = duration > 0 ? (ct % duration) / duration : 0;
        if (seekerRef.current)
          seekerRef.current.value = String(Math.min(1, progress));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration]);

  // -------------------------------------------------------------------------
  // Playback handlers
  // -------------------------------------------------------------------------

  const handlePlayPause = useCallback(() => {
    const next: PlaybackState = playback === "playing" ? "paused" : "playing";
    dispatch({ type: "SET_PLAYBACK", playback: next });
    if (animRef.current) {
      if (next === "paused") animRef.current.pause();
      else animRef.current.play();
    }
  }, [playback, dispatch]);

  const handleSeekStart = useCallback(() => {
    draggingRef.current = true;
    wasPausedRef.current = playback === "paused";
    if (animRef.current) animRef.current.pause();
  }, [playback]);

  const handleSeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      const time = val * duration;
      if (animRef.current) {
        animRef.current.currentTime = time;
      }
    },
    [duration],
  );

  const handleSeekEnd = useCallback(() => {
    draggingRef.current = false;
    if (!wasPausedRef.current && animRef.current) {
      animRef.current.play();
    }
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isPaused = playback === "paused";

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <h3 className={LABEL_SECTION}>Preview</h3>

      {/* Preview stage */}
      <div className="border-border-hairline bg-surface-card flex h-40 items-center justify-center overflow-hidden rounded-lg border">
        <div ref={previewRef}>
          {previewShape === "box" && (
            <div className="size-16 rounded-lg bg-[var(--accent)]" />
          )}
          {previewShape === "circle" && (
            <div className="size-16 rounded-full bg-[var(--accent)]" />
          )}
          {previewShape === "text" && (
            <span className="text-4xl font-bold text-[var(--accent)]">Aa</span>
          )}
        </div>
      </div>

      {/* Shape selector */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_SMALL}>Shape</span>
        <div className="flex gap-1.5">
          {(["box", "circle", "text"] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={previewShape === shape}
              onClick={() => dispatch({ type: "SET_PREVIEW_SHAPE", shape })}
              className={cn(
                CARD_BUTTON,
                previewShape === shape && ACTIVE_BUTTON,
              )}
            >
              {shape.charAt(0).toUpperCase() + shape.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={isPaused ? "Play" : "Pause"}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent hover:bg-accent flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]"
        >
          {isPaused ? (
            <svg
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M4 2l10 6-10 6V2z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 1h3v14H3zM10 1h3v14h-3z" />
            </svg>
          )}
        </button>
        <input
          ref={seekerRef}
          type="range"
          min={0}
          max={1}
          step={0.001}
          defaultValue={0}
          onPointerDown={handleSeekStart}
          onChange={handleSeekInput}
          onPointerUp={handleSeekEnd}
          className="h-1.5 flex-1 cursor-pointer rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Animation timeline"
        />
      </div>

      {/* Animation settings */}
      <div className="flex flex-col gap-3">
        {/* Duration */}
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={LABEL_SMALL}>Duration</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={duration}
                onChange={(e) =>
                  dispatch({
                    type: "SET_DURATION",
                    duration: Math.max(
                      100,
                      Math.min(5000, parseInt(e.target.value) || 500),
                    ),
                  })
                }
                className={NUMBER_INPUT}
              />
              <span className={LABEL_SMALL}>ms</span>
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={duration}
            onChange={(e) =>
              dispatch({
                type: "SET_DURATION",
                duration: parseInt(e.target.value),
              })
            }
            className={RANGE_INPUT}
          />
        </label>

        {/* Iteration count */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_SMALL}>Iterations</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={iterationCount === "infinite" ? "" : iterationCount}
              disabled={iterationCount === "infinite"}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1)
                  dispatch({ type: "SET_ITERATION_COUNT", count: val });
              }}
              className={cn(
                NUMBER_INPUT,
                iterationCount === "infinite" && "opacity-40",
              )}
              aria-label="Iteration count"
            />
            <button
              type="button"
              aria-pressed={iterationCount === "infinite"}
              onClick={() =>
                dispatch({
                  type: "SET_ITERATION_COUNT",
                  count: iterationCount === "infinite" ? 1 : "infinite",
                })
              }
              className={cn(
                CARD_BUTTON,
                iterationCount === "infinite" && ACTIVE_BUTTON,
              )}
            >
              Infinite
            </button>
          </div>
        </div>

        {/* Direction */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_SMALL}>Direction</span>
          <div className="flex flex-wrap gap-1.5">
            {DIRECTION_OPTIONS.map((dir) => (
              <button
                key={dir}
                type="button"
                aria-pressed={direction === dir}
                onClick={() =>
                  dispatch({ type: "SET_DIRECTION", direction: dir })
                }
                className={cn(CARD_BUTTON, direction === dir && ACTIVE_BUTTON)}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        {/* Fill mode */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_SMALL}>Fill Mode</span>
          <div className="flex flex-wrap gap-1.5">
            {FILL_OPTIONS.map((fm) => (
              <button
                key={fm}
                type="button"
                aria-pressed={fillMode === fm}
                onClick={() =>
                  dispatch({ type: "SET_FILL_MODE", fillMode: fm })
                }
                className={cn(CARD_BUTTON, fillMode === fm && ACTIVE_BUTTON)}
              >
                {fm}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
