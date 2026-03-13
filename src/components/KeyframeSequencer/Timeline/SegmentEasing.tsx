"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8 + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, [triggerRef]);

  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState(false);

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;

    // Accept bare values like "0.4, 0, 0.2, 1" or full "cubic-bezier(0.4, 0, 0.2, 1)"
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

  return createPortal(
    <div
      ref={popoverRef}
      tabIndex={-1}
      aria-label="Select easing preset"
      data-lenis-prevent
      className="bg-surface-card border-border-hairline absolute z-50 flex max-h-64 w-52 -translate-x-1/2 flex-col rounded-lg border shadow-[var(--shadow-card)] outline-none"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Custom bezier input — sticky at top */}
      <div className="border-border-hairline shrink-0 border-b p-2">
        <label
          htmlFor="custom-bezier"
          className="text-text-muted mb-1 block font-mono text-[10px]"
        >
          Custom cubic-bezier
        </label>
        <div className="flex gap-1">
          <input
            id="custom-bezier"
            type="text"
            value={customDraft}
            onChange={(e) => {
              setCustomDraft(e.target.value);
              setCustomError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomSubmit();
            }}
            placeholder="0.4, 0, 0.2, 1"
            spellCheck={false}
            className={cn(
              "border-border-hairline bg-surface-card-alt text-text min-w-0 flex-1 rounded border px-1.5 py-1 font-mono text-[11px] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1",
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

      <div
        role="listbox"
        className="flex min-h-0 flex-col gap-px overflow-y-auto p-1"
      >
        {Object.entries(EASING_PRESETS).map(([name, value]) => (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={name === segment.easingName}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-mono text-xs outline-[var(--accent)] transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1 active:scale-[0.98]",
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
      className="pointer-events-none absolute inset-y-0 flex flex-col items-stretch justify-center"
      style={{
        left: `${leftOffset}%`,
        width: `${width}%`,
      }}
    >
      {/* Clickable curve area — pointer-events restored on button only */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Easing: ${segment.easingName}. Click to change.`}
        className={cn(
          "text-text-muted hover:text-accent hover:bg-accent/5 pointer-events-auto flex w-full cursor-pointer flex-col items-center rounded outline-[var(--accent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 active:scale-[0.97]",
          open && "text-accent",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MiniEasingCurve easing={segment.easing} />
        <span className="mt-0.5 block truncate text-center font-mono text-[10px] leading-none">
          {segment.easingName}
        </span>
      </button>

      {/* Easing selector popover — portaled to body to escape stacking context */}
      {open && (
        <EasingPopover
          triggerRef={triggerRef}
          popoverRef={popoverRef}
          segment={segment}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
