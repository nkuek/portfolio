"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import cn from "~/utils/cn";
import { EASING_PRESETS, parseCubicBezier } from "../constants";
import type { SegmentEasing as SegmentEasingType } from "../types";

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

type EasingPickerProps = {
  segment: SegmentEasingType;
  onSelect: (name: string, value: string) => void;
  onClose: () => void;
};

export default function EasingPicker({
  segment,
  onSelect,
  onClose,
}: EasingPickerProps) {
  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState(false);

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;

    const normalized = trimmed.startsWith("cubic-bezier")
      ? trimmed
      : `cubic-bezier(${trimmed})`;

    const parsed = parseCubicBezier(normalized);
    if (!parsed) {
      setCustomError(true);
      return;
    }

    setCustomError(false);
    setCustomDraft("");
    onSelect("custom", normalized);
  }, [customDraft, onSelect]);

  return (
    <div className="bg-surface-card-alt border-border-hairline rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-text-subtle font-mono text-xs font-medium">
          Segment Easing
        </span>
        <button
          type="button"
          aria-label="Close easing picker"
          onClick={onClose}
          className="text-text-muted hover:text-text cursor-pointer rounded p-0.5 outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 active:scale-95"
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
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Custom bezier input */}
      <div className="mb-3">
        <label
          htmlFor="custom-bezier-inline"
          className="text-text-muted mb-1 block font-mono text-[10px]"
        >
          Custom cubic-bezier
        </label>
        <div className="flex gap-1">
          <input
            id="custom-bezier-inline"
            type="text"
            value={customDraft}
            onChange={(e) => {
              setCustomDraft(e.target.value);
              setCustomError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="0.4, 0, 0.2, 1"
            spellCheck={false}
            className={cn(
              "border-border-hairline bg-surface-card text-text min-w-0 flex-1 rounded border px-1.5 py-1 font-mono text-[11px] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1",
              customError && "border-red-400",
            )}
          />
          <button
            type="button"
            disabled={!customDraft.trim()}
            onClick={handleCustomSubmit}
            className="border-border-hairline bg-surface-card text-text-subtle enabled:hover:border-accent enabled:hover:text-accent shrink-0 rounded border px-1.5 py-1 font-mono text-[11px] outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 enabled:cursor-pointer enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
        <Link
          href="/tools/easing"
          target="_blank"
          className="text-accent mt-1.5 flex items-center gap-1 font-mono text-[10px] hover:underline"
        >
          Craft in Easing Curator
          <svg
            viewBox="0 0 24 24"
            className="size-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      </div>

      {/* Preset listbox */}
      <div
        role="listbox"
        className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3"
      >
        {Object.entries(EASING_PRESETS).map(([name, value]) => (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={name === segment.easingName}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-mono text-[11px] outline-[var(--accent)] transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1 active:scale-[0.98]",
              name === segment.easingName
                ? "bg-accent/10 text-accent"
                : "text-text-subtle hover:bg-surface-card",
            )}
            onClick={() => onSelect(name, value)}
          >
            <span className="w-5 shrink-0">
              <MiniEasingCurve easing={value} />
            </span>
            <span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
