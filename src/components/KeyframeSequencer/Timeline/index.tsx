"use client";

import { useCallback, useRef } from "react";
import type {
  KeyframeStop,
  SegmentEasing as SegmentEasingType,
} from "../types";
import type { KeyframeSequencerAction } from "../state";
import KeyframeMarker from "./KeyframeMarker";
import SegmentEasing from "./SegmentEasing";

type TimelineProps = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasingType[];
  selectedKeyframeId: string | null;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const TICK_MARKS = [0, 25, 50, 75, 100] as const;

export default function Timeline({
  keyframes,
  segmentEasings,
  selectedKeyframeId,
  dispatch,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only respond to clicks directly on the track, not on markers or segments
      if (e.target !== e.currentTarget) return;

      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.round((x / rect.width) * 100);
      const clamped = Math.max(1, Math.min(99, pct));

      dispatch({ type: "ADD_KEYFRAME", offset: clamped });
    },
    [dispatch],
  );

  const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);

  return (
    <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
      {/* Track label */}
      <div className="text-text-muted mb-2 font-mono text-xs tracking-wide uppercase">
        Timeline
      </div>

      {/* Track container */}
      <div className="relative px-2">
        {/* The draggable track area */}
        <div
          ref={trackRef}
          className="border-border-hairline relative h-12 cursor-crosshair rounded-lg border bg-gradient-to-b from-transparent to-black/[0.02]"
          onClick={handleTrackClick}
        >
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
            />
          ))}
        </div>

        {/* Tick labels below the track */}
        <div className="relative mt-1 h-4" aria-hidden="true">
          {TICK_MARKS.map((tick) => (
            <span
              key={tick}
              className="text-text-muted absolute -translate-x-1/2 font-mono text-[10px] leading-none"
              style={{ left: `${tick}%` }}
            >
              {tick}%
            </span>
          ))}
        </div>
      </div>

      {/* Hint text */}
      <p className="text-text-muted mt-2 text-center font-mono text-[10px]">
        Click track to add keyframe. Drag markers to reposition.
      </p>
    </div>
  );
}
