"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  KeyframeStop,
  PlaybackState,
  SegmentEasing as SegmentEasingType,
} from "../types";
import type { KeyframeSequencerAction } from "../state";
import KeyframeMarker from "./KeyframeMarker";
import SegmentEasing from "./SegmentEasing";

type TimelineProps = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasingType[];
  selectedKeyframeId: string | null;
  progressRef: React.RefObject<number>;
  seekRef: React.RefObject<((progress: number) => void) | null>;
  playback: PlaybackState;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const TICK_MARKS = [0, 25, 50, 75, 100] as const;

/** Zebra stripe bands between tick marks (very low opacity) */
const ZEBRA_BANDS = [
  { left: 0, width: 25 },
  { left: 50, width: 25 },
] as const;

export default function Timeline({
  keyframes,
  segmentEasings,
  selectedKeyframeId,
  progressRef,
  seekRef,
  playback,
  dispatch,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);
  const wasPausedBeforeScrubRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Track scrubbing — click or drag on the track to seek the animation
  // ---------------------------------------------------------------------------

  const getProgressFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't scrub when clicking interactive children (markers or easing buttons)
      const target = e.target as HTMLElement;
      if (target.closest("[role=slider], button")) return;

      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;

      track.setPointerCapture(e.pointerId);
      scrubbingRef.current = true;
      wasPausedBeforeScrubRef.current = playback === "paused";

      // Pause during scrub
      dispatch({ type: "SET_PLAYBACK", playback: "paused" });

      const progress = getProgressFromPointer(e.clientX);
      seekRef.current?.(progress);
    },
    [playback, dispatch, seekRef, getProgressFromPointer],
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbingRef.current) return;
      const progress = getProgressFromPointer(e.clientX);
      seekRef.current?.(progress);
    },
    [seekRef, getProgressFromPointer],
  );

  const handleTrackPointerUp = useCallback(() => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;

    // Resume playback if it was playing before scrub
    if (!wasPausedBeforeScrubRef.current) {
      dispatch({ type: "SET_PLAYBACK", playback: "playing" });
    }
  }, [dispatch]);

  // Add keyframe at the midpoint of the largest gap
  const handleAddKeyframe = useCallback(() => {
    const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);
    let maxGap = 0;
    let gapMid = 50;

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].offset - sorted[i].offset;
      if (gap > maxGap) {
        maxGap = gap;
        gapMid = Math.round((sorted[i].offset + sorted[i + 1].offset) / 2);
      }
    }

    const clamped = Math.max(1, Math.min(99, gapMid));
    dispatch({ type: "ADD_KEYFRAME", offset: clamped });
  }, [keyframes, dispatch]);

  // Playhead rAF loop — reads progressRef and writes DOM directly
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (playheadRef.current) {
        playheadRef.current.style.left = `${progressRef.current * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);

  return (
    <div className="bg-surface-card border-border-hairline overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
      {/* Track header: label + add button */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-text-muted font-mono text-xs tracking-wide uppercase">
          Timeline
        </span>
        <button
          type="button"
          aria-label="Add keyframe"
          onClick={handleAddKeyframe}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent hover:text-accent flex size-6 cursor-pointer items-center justify-center rounded-md border font-mono text-sm leading-none outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
        >
          +
        </button>
      </div>

      {/* Track container */}
      <div className="relative px-2">
        {/* The draggable track area */}
        <div
          ref={trackRef}
          className="border-border-hairline relative h-20 cursor-ew-resize rounded-lg border bg-gradient-to-b from-transparent to-black/[0.02]"
          style={{ touchAction: "none" }}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
        >
          {/* Zebra stripe bands */}
          {ZEBRA_BANDS.map((band) => (
            <div
              key={band.left}
              className="bg-surface-card-alt/40 pointer-events-none absolute top-0 h-full"
              style={{ left: `${band.left}%`, width: `${band.width}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Tick marks */}
          {TICK_MARKS.map((tick) => (
            <div
              key={tick}
              className="pointer-events-none absolute top-0 h-full"
              style={{ left: `${tick}%` }}
              aria-hidden="true"
            >
              <div className="bg-border-hairline absolute top-0 left-0 h-full w-px" />
            </div>
          ))}

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="pointer-events-none absolute top-0 z-20 h-full"
            style={{ left: "0%" }}
            aria-hidden="true"
          >
            {/* Head */}
            <div className="bg-accent absolute top-0 left-1/2 size-2 -translate-x-1/2 rounded-full shadow-sm" />
            {/* Stem */}
            <div className="bg-accent/70 absolute top-2 bottom-0 left-1/2 w-0.5 -translate-x-1/2" />
          </div>

          {/* Segment easings between markers */}
          {segmentEasings.map((segment) => {
            const fromKf = sorted.find((kf) => kf.id === segment.fromId);
            const toKf = sorted.find((kf) => kf.id === segment.toId);
            if (!fromKf || !toKf) return null;

            return (
              <SegmentEasing
                key={`${segment.fromId}-${segment.toId}`}
                segment={segment}
                leftOffset={fromKf.offset}
                rightOffset={toKf.offset}
                dispatch={dispatch}
              />
            );
          })}

          {/* Keyframe markers */}
          {sorted.map((kf) => (
            <KeyframeMarker
              key={kf.id}
              keyframe={kf}
              isSelected={kf.id === selectedKeyframeId}
              isEndpoint={kf.offset === 0 || kf.offset === 100}
              trackRef={trackRef}
              onSelect={() => dispatch({ type: "SELECT_KEYFRAME", id: kf.id })}
              onDrag={(offset) =>
                dispatch({ type: "UPDATE_KEYFRAME_OFFSET", id: kf.id, offset })
              }
              onDelete={() => dispatch({ type: "REMOVE_KEYFRAME", id: kf.id })}
            />
          ))}
        </div>

        {/* Tick labels below the track */}
        <div className="relative mt-1 h-4" aria-hidden="true">
          {TICK_MARKS.map((tick) => (
            <span
              key={tick}
              className="text-text-muted absolute -translate-x-1/2 font-mono text-xs leading-none"
              style={{ left: `${tick}%` }}
            >
              {tick}%
            </span>
          ))}
        </div>
      </div>

      {/* Hint text */}
      <p className="text-text-muted mt-2 text-center font-mono text-[10px]">
        Click + to add keyframe. Drag markers to reposition. Click track to
        scrub.
      </p>
    </div>
  );
}
