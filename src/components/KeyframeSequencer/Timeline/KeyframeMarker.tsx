"use client";

import { useCallback, useRef, useState } from "react";
import cn from "~/utils/cn";
import type { KeyframeStop, PropertyMask } from "../types";

/** Color based on number of active (masked) properties */
function markerColor(mask: PropertyMask): string {
  const count = Object.values(mask).filter(Boolean).length;
  if (count >= 5) return "var(--accent-rose)";
  if (count >= 3) return "#a855f7";
  return "var(--accent)";
}

type KeyframeMarkerProps = {
  keyframe: KeyframeStop;
  isSelected: boolean;
  isEndpoint: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onDrag: (offset: number) => void;
  onDelete: () => void;
  onCloneDrag?: (newId: string) => void;
};

export default function KeyframeMarker({
  keyframe,
  isSelected,
  isEndpoint,
  trackRef,
  onSelect,
  onDrag,
  onDelete,
  onCloneDrag,
}: KeyframeMarkerProps) {
  const color = isEndpoint ? undefined : markerColor(keyframe.mask);
  const markerRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Endpoints can't be dragged
      if (isEndpoint) return;

      e.preventDefault();
      markerRef.current?.focus();

      const marker = markerRef.current;
      const track = trackRef.current;
      if (!marker || !track) return;

      // Option/Alt-drag: clone the keyframe first, then drag the clone
      let dragId: string | undefined;
      if (e.altKey && onCloneDrag) {
        const newId = crypto.randomUUID();
        onCloneDrag(newId);
        dragId = newId;
      }

      marker.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const rect = track.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = Math.round((x / rect.width) * 100);
        const clamped = Math.max(1, Math.min(99, pct));
        // If we cloned, drag the clone; otherwise drag this keyframe
        if (dragId) {
          onDrag(clamped);
        } else {
          onDrag(clamped);
        }
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
    [isEndpoint, onDrag, onCloneDrag, trackRef],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!isEndpoint) {
          e.preventDefault();
          onDelete();
        }
        return;
      }

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
    [isEndpoint, keyframe.offset, onDrag, onDelete],
  );

  const showLabel = isSelected || hovered;

  return (
    <button
      ref={markerRef}
      type="button"
      aria-label={`Keyframe at ${keyframe.offset}%`}
      aria-pressed={isSelected}
      className={cn(
        "absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 outline-none",
        !isEndpoint && "cursor-grab active:cursor-grabbing",
        isEndpoint && "cursor-default",
      )}
      style={{
        left: `${keyframe.offset}%`,
        touchAction: "none",
      }}
      onClick={onSelect}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Hit target for WCAG 2.5.8 */}
      <span className="before:absolute before:-inset-3" aria-hidden="true" />

      {/* Marker dot — diamond for endpoints, circle for editable */}
      {isEndpoint ? (
        <div
          className={cn(
            "size-3.5 rotate-45 rounded-sm border-2 transition-all duration-150",
            isSelected
              ? "border-text-muted bg-text-muted scale-110"
              : "border-text-muted bg-surface-card",
          )}
        />
      ) : (
        <div
          className="size-5 rounded-full border-2 transition-all duration-150"
          style={{
            borderColor: color,
            backgroundColor: isSelected ? color : "var(--surface-card)",
            transform: isSelected ? "scale(1.25)" : undefined,
            boxShadow: isSelected
              ? `0 0 0 3px color-mix(in srgb, ${color ?? "var(--accent)"} 25%, transparent)`
              : undefined,
          }}
        />
      )}

      {/* Selected connector line — hints at property editor below */}
      {isSelected && !isEndpoint && (
        <div
          className="absolute top-full left-1/2 h-3 w-px -translate-x-1/2"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}

      {/* Focus ring */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 outline-2 outline-offset-2 outline-[var(--accent)]",
          isEndpoint ? "rounded-sm" : "rounded-full",
          "opacity-0 [:focus-visible>&]:opacity-100",
        )}
        aria-hidden="true"
      />

      {/* Offset label */}
      {showLabel && (
        <span
          className={cn(
            "text-text-subtle absolute top-full left-1/2 -translate-x-1/2 font-mono text-xs leading-none whitespace-nowrap",
            isSelected && !isEndpoint ? "mt-4.5" : "mt-1.5",
          )}
          aria-hidden="true"
        >
          {keyframe.offset}%
        </span>
      )}
    </button>
  );
}
