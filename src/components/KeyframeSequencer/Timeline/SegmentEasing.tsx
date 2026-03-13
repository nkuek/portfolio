"use client";

import cn from "~/utils/cn";
import { parseCubicBezier } from "../constants";
import type { SegmentEasing as SegmentEasingType } from "../types";

type SegmentEasingProps = {
  segment: SegmentEasingType;
  leftOffset: number;
  rightOffset: number;
  isEditing: boolean;
  onEditClick: () => void;
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
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const [x1, y1, x2, y2] = points;
  const sy1 = 1 - y1;
  const sy2 = 1 - y2;

  const minY = Math.min(0, sy1, sy2) - 0.05;
  const maxY = Math.max(1, sy1, sy2) + 0.05;

  return (
    <svg
      viewBox={`0 ${minY} 1 ${maxY - minY}`}
      className="h-5 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={`M 0 1 C ${x1} ${sy1} ${x2} ${sy2} 1 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function SegmentEasing({
  segment,
  leftOffset,
  rightOffset,
  isEditing,
  onEditClick,
}: SegmentEasingProps) {
  const width = rightOffset - leftOffset;
  if (width <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-y-0 flex flex-col items-stretch justify-center"
      style={{
        left: `${leftOffset}%`,
        width: `${width}%`,
      }}
    >
      {/* Clickable curve area — pointer-events restored on button only */}
      <button
        type="button"
        aria-label={`Easing: ${segment.easingName}. Click to change.`}
        className={cn(
          "text-text-muted hover:text-accent hover:bg-accent/5 pointer-events-auto flex w-full cursor-pointer flex-col items-center rounded outline-[var(--accent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 active:scale-[0.97]",
          isEditing && "text-accent",
        )}
        onClick={onEditClick}
      >
        <MiniEasingCurve easing={segment.easing} />
        <span className="mt-0.5 block truncate text-center font-mono text-[10px] leading-none">
          {segment.easingName}
        </span>
      </button>
    </div>
  );
}
