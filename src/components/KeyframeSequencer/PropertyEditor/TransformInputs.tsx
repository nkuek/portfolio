"use client";

import { useCallback } from "react";
import cn from "~/utils/cn";
import { PROPERTY_RANGES } from "../constants";
import type { KeyframeProperty, PropertyMask } from "../types";
import type { KeyframeSequencerAction } from "../state";

type TransformInputsProps = {
  keyframeId: string;
  properties: KeyframeProperty;
  mask: PropertyMask;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const TRANSFORM_KEYS = ["translateX", "translateY", "scale", "rotate"] as const;

const TRANSFORM_LABELS: Record<(typeof TRANSFORM_KEYS)[number], string> = {
  translateX: "X",
  translateY: "Y",
  scale: "Scale",
  rotate: "Rotate",
};

export default function TransformInputs({
  keyframeId,
  properties,
  mask,
  dispatch,
}: TransformInputsProps) {
  const handleValueChange = useCallback(
    (property: keyof KeyframeProperty, raw: string) => {
      const num = parseFloat(raw);
      if (isNaN(num)) return;
      const range = PROPERTY_RANGES[property as keyof typeof PROPERTY_RANGES];
      if (!range) return;
      const clamped = Math.min(range.max, Math.max(range.min, num));
      dispatch({ type: "SET_PROPERTY", keyframeId, property, value: clamped });
    },
    [keyframeId, dispatch],
  );

  const handleToggleMask = useCallback(
    (property: keyof KeyframeProperty) => {
      dispatch({ type: "TOGGLE_PROPERTY_MASK", keyframeId, property });
    },
    [keyframeId, dispatch],
  );

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-text-subtle text-xs font-medium">Transform</h4>
      {TRANSFORM_KEYS.map((key) => {
        const range = PROPERTY_RANGES[key];
        const active = mask[key];
        const value = properties[key] as number;
        const inputId = `transform-${keyframeId}-${key}`;

        return (
          <div
            key={key}
            className={cn("flex items-center gap-2", !active && "opacity-50")}
          >
            <input
              type="checkbox"
              id={`mask-${keyframeId}-${key}`}
              checked={active}
              onChange={() => handleToggleMask(key)}
              className="size-3.5 shrink-0 cursor-pointer rounded accent-[var(--accent)]"
            />
            <label
              htmlFor={inputId}
              className="text-text-muted w-10 shrink-0 font-mono text-xs"
            >
              {TRANSFORM_LABELS[key]}
            </label>
            <input
              type="range"
              id={inputId}
              min={range.min}
              max={range.max}
              step={range.step}
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className="min-w-0 flex-1 rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <input
              type="number"
              min={range.min}
              max={range.max}
              step={range.step}
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              aria-label={`${TRANSFORM_LABELS[key]} value`}
              className="border-border-hairline bg-surface-card-alt text-text hidden w-16 shrink-0 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 sm:block"
            />
          </div>
        );
      })}
    </div>
  );
}
