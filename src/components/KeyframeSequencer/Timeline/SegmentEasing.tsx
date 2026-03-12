"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import cn from "~/utils/cn";
import { EASING_PRESETS, parseCubicBezier } from "../constants";
import type { SegmentEasing as SegmentEasingType } from "../types";
import type { KeyframeSequencerAction } from "../state";

type SegmentEasingProps = {
  segment: SegmentEasingType;
  leftOffset: number;
  rightOffset: number;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

function MiniEasingCurve({ easing }: { easing: string }) {
  const points = parseCubicBezier(easing);

  if (!points) {
    return (
      <svg
        viewBox="0 0 1 1"
        className="h-5 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1={0}
          y1={1}
          x2={1}
          y2={0}
          stroke="currentColor"
          strokeWidth={0.08}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const [x1, y1, x2, y2] = points;
  const sy1 = 1 - y1;
  const sy2 = 1 - y2;

  // Expand viewBox if overshoot
  const minY = Math.min(0, sy1, sy2) - 0.05;
  const maxY = Math.max(1, sy1, sy2) + 0.05;

  return (
    <svg
      viewBox={`-0.05 ${minY} 1.1 ${maxY - minY}`}
      className="h-5 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={`M 0 1 C ${x1} ${sy1} ${x2} ${sy2} 1 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.06}
        strokeLinecap="round"
      />
    </svg>
  );
}

function EasingPopover({
  triggerRef,
  popoverRef,
  segment,
  onSelect,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  segment: SegmentEasingType;
  onSelect: (name: string, value: string) => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8 + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, [triggerRef]);

  return createPortal(
    <div
      ref={popoverRef}
      role="listbox"
      aria-label="Select easing preset"
      data-lenis-prevent
      className="bg-surface-card border-border-hairline absolute z-50 max-h-52 w-44 -translate-x-1/2 overflow-y-auto rounded-lg border shadow-[var(--shadow-card)]"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="flex flex-col gap-px p-1">
        {Object.entries(EASING_PRESETS).map(([name, value]) => (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={name === segment.easingName}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-mono text-xs transition-colors duration-100",
              name === segment.easingName
                ? "bg-accent/10 text-accent"
                : "text-text-subtle hover:bg-surface-card-alt",
            )}
            onClick={() => onSelect(name, value)}
          >
            <span className="w-6 shrink-0">
              <MiniEasingCurve easing={value} />
            </span>
            <span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

export default function SegmentEasing({
  segment,
  leftOffset,
  rightOffset,
  dispatch,
}: SegmentEasingProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSelect = useCallback(
    (name: string, value: string) => {
      dispatch({
        type: "SET_SEGMENT_EASING",
        fromId: segment.fromId,
        toId: segment.toId,
        easing: value,
        easingName: name,
      });
      setOpen(false);
    },
    [dispatch, segment.fromId, segment.toId],
  );

  // Close on Escape or click outside
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [open]);

  const width = rightOffset - leftOffset;
  if (width <= 0) return null;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2"
      style={{
        left: `${leftOffset}%`,
        width: `${width}%`,
      }}
    >
      {/* Clickable curve area */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Easing: ${segment.easingName}. Click to change.`}
        className={cn(
          "text-text-muted hover:text-accent block w-full cursor-pointer px-1 transition-colors duration-150",
          open && "text-accent",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MiniEasingCurve easing={segment.easing} />
        <span className="mt-0.5 block truncate text-center font-mono text-[9px] leading-none">
          {segment.easingName}
        </span>
      </button>

      {/* Easing selector popover — portaled to body to escape stacking context */}
      {open && <EasingPopover
        triggerRef={triggerRef}
        popoverRef={popoverRef}
        segment={segment}
        onSelect={handleSelect}
      />}
    </div>
  );
}
