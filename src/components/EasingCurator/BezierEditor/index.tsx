"use client";

import { useCallback } from "react";
import type { BezierCurve } from "../types";
import type { EasingAction } from "../state";

type BezierEditorProps = {
  curve: BezierCurve;
  dispatch: React.Dispatch<EasingAction>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function BezierEditor({
  curve,
  dispatch,
  onDragStart,
  onDragEnd,
}: BezierEditorProps) {
  const handleInputChange = useCallback(
    (field: keyof BezierCurve, value: string) => {
      const num = parseFloat(value);
      if (isNaN(num)) return;
      dispatch({
        type: "SET_CURVE",
        curve: { ...curve, [field]: round(num) },
      });
    },
    [curve, dispatch],
  );

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {(["x1", "y1", "x2", "y2"] as const).map((field) => {
        const isX = field.startsWith("x");
        const min = isX ? 0 : -1;
        const max = isX ? 1 : 2;
        return (
          <label key={field} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-mono text-xs">{field}</span>
              <input
                type="number"
                step={0.01}
                value={curve[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="border-border-hairline bg-surface-card-alt text-text w-16 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={0.01}
              value={curve[field]}
              onPointerDown={onDragStart}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </label>
        );
      })}
    </div>
  );
}
