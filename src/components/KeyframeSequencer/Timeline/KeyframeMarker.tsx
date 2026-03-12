"use client";

import { useCallback, useRef, useState } from "react";
import cn from "~/utils/cn";
import type { KeyframeStop } from "../types";

type KeyframeMarkerProps = {
  keyframe: KeyframeStop;
  isSelected: boolean;
  isEndpoint: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onDrag: (offset: number) => void;
};

export default function KeyframeMarker({
  keyframe,
  isSelected,
  isEndpoint,
  trackRef,
  onSelect,
  onDrag,
}: KeyframeMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEndpoint) {
        onSelect();
        return;
      }

      e.preventDefault();
      onSelect();

      const marker = markerRef.current;
      const track = trackRef.current;
      if (!marker || !track) return;

      marker.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const rect = track.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = Math.round((x / rect.width) * 100);
        const clamped = Math.max(1, Math.min(99, pct));
        onDrag(clamped);
      };

      const cleanup = () => {
        marker.removeEventListener("pointermove", onMove);
        marker.removeEventListener("pointerup", cleanup);
        marker.removeEventListener("pointercancel", cleanup);
      };

      marker.addEventListener("pointermove", onMove);
      marker.addEventListener("pointerup", cleanup);
      marker.addEventListener("pointercancel", cleanup);
    },
    [isEndpoint, onSelect, onDrag, trackRef],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEndpoint) return;

      const step = e.shiftKey ? 5 : 1;
      let newOffset = keyframe.offset;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newOffset = Math.max(1, keyframe.offset - step);
          break;
        case "ArrowRight":
          e.preventDefault();
          newOffset = Math.min(99, keyframe.offset + step);
          break;
        default:
          return;
      }

      onDrag(newOffset);
    },
    [isEndpoint, keyframe.offset, onDrag],
  );

  const showLabel = isSelected || hovered;

  return (
    <div
      ref={markerRef}
      role="slider"
      tabIndex={0}
      aria-label={`Keyframe at ${keyframe.offset}%`}
      aria-valuenow={keyframe.offset}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${keyframe.offset}%`}
      className={cn(
        "absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 outline-none",
        !isEndpoint && "cursor-grab active:cursor-grabbing",
        isEndpoint && "cursor-default",
      )}
      style={{
        left: `${keyframe.offset}%`,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Hit target for WCAG 2.5.8 */}
      <span className="before:absolute before:-inset-3" aria-hidden="true" />

      {/* Marker dot */}
      <div
        className={cn(
          "size-4 rounded-full border-2 transition-all duration-150",
          isSelected &&
            !isEndpoint &&
            "border-accent bg-accent scale-125 shadow-[0_0_0_3px_var(--accent)/0.25]",
          !isSelected &&
            !isEndpoint &&
            "border-accent bg-surface-card hover:border-accent hover:scale-110",
          isEndpoint &&
            isSelected &&
            "border-text-muted bg-text-muted scale-110",
          isEndpoint && !isSelected && "border-text-muted bg-surface-card",
        )}
      />

      {/* Focus ring */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full outline-2 outline-offset-2 outline-[var(--accent)]",
          "opacity-0 [:focus-visible>&]:opacity-100",
        )}
        aria-hidden="true"
      />

      {/* Offset label */}
      {showLabel && (
        <span
          className="text-text-subtle absolute top-full left-1/2 mt-1.5 -translate-x-1/2 font-mono text-[10px] leading-none whitespace-nowrap"
          aria-hidden="true"
        >
          {keyframe.offset}%
        </span>
      )}
    </div>
  );
}
