"use client";

import { useCallback, useRef } from "react";
import type { BezierCurve } from "../types";
import type { EasingAction } from "../state";
import CurveCanvas, { CURVE_VIEW_BOX } from "../CurveCanvas";
import DragHandle from "./DragHandle";

type BezierEditorProps = {
  curve: BezierCurve;
  pinnedCurve?: BezierCurve | null;
  pinnedSamples?: number[] | null;
  dispatch: React.Dispatch<EasingAction>;
};

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export default function BezierEditor({
  curve,
  pinnedCurve,
  pinnedSamples,
  dispatch,
}: BezierEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const sy1 = 1 - curve.y1;
  const sy2 = 1 - curve.y2;

  const handleP1Drag = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_HANDLE", handle: "p1", x: round(x), y: round(y) });
    },
    [dispatch],
  );

  const handleP2Drag = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_HANDLE", handle: "p2", x: round(x), y: round(y) });
    },
    [dispatch],
  );

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
    <div className="flex flex-col gap-4">
      <svg
        ref={svgRef}
        viewBox={CURVE_VIEW_BOX}
        className="w-full overflow-visible"
        style={{ touchAction: "none" }}
      >
        <CurveCanvas
          curve={curve}
          pinnedCurve={pinnedCurve}
          pinnedSamples={pinnedSamples}
        />
        <DragHandle
          cx={curve.x1}
          cy={sy1}
          label="Control point 1"
          color="var(--accent)"
          onDrag={handleP1Drag}
          svgRef={svgRef}
        />
        <DragHandle
          cx={curve.x2}
          cy={sy2}
          label="Control point 2"
          color="var(--accent-rose)"
          onDrag={handleP2Drag}
          svgRef={svgRef}
        />
      </svg>

      {/* Numeric inputs with sliders */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {(["x1", "y1", "x2", "y2"] as const).map((field) => {
          const isX = field.startsWith("x");
          const min = isX ? 0 : -1;
          const max = isX ? 1 : 2;
          return (
            <label key={field} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-mono text-xs">
                  {field}
                </span>
                <input
                  type="number"
                  step={0.01}
                  value={curve[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="border-border-hairline bg-surface-card-alt text-text w-16 rounded-md border px-2 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                />
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={0.01}
                value={curve[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full accent-[var(--accent)]"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
