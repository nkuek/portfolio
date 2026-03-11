import type { BezierCurve } from "./types";
import type { OverlayType } from "./state";

type CurveCanvasProps = {
  curve?: BezierCurve;
  samples?: number[];
  pinnedCurve?: BezierCurve | null;
  pinnedSamples?: number[] | null;
  overlaySamples?: number[];
  overlayType?: OverlayType;
};

function samplesToPolyline(samples: number[]): string {
  return samples
    .map((v, i) => `${i / (samples.length - 1)},${1 - v}`)
    .join(" ");
}

export const OVERLAY_COLORS = {
  velocity: "#f59e0b",
  acceleration: "#8b5cf6",
} as const;

function overlayToPolyline(samples: number[]): {
  points: string;
  zeroY: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (const v of samples) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const TOP = 0.05;
  const BOTTOM = 0.95;
  const span = BOTTOM - TOP;
  const range = max - min;

  if (range < 1e-9) {
    const flatY = (TOP + BOTTOM) / 2;
    const points = samples
      .map((_, i) => `${i / (samples.length - 1)},${flatY}`)
      .join(" ");
    return { points, zeroY: flatY };
  }

  const points = samples
    .map((v, i) => {
      const x = i / (samples.length - 1);
      const y = BOTTOM - ((v - min) / range) * span;
      return `${x},${y}`;
    })
    .join(" ");

  const zeroY = BOTTOM - ((0 - min) / range) * span;

  return { points, zeroY };
}

// Fixed viewBox matching the [0,1] grid. Overshoot overflows visible.
export const CURVE_VIEW_BOX = "-0.12 -0.12 1.24 1.24";

export default function CurveCanvas({
  curve,
  samples,
  pinnedCurve,
  pinnedSamples,
  overlaySamples,
  overlayType,
}: CurveCanvasProps) {
  const overlay =
    overlaySamples && overlayType && overlayType !== "none"
      ? overlayToPolyline(overlaySamples)
      : null;
  const overlayColor =
    overlayType && overlayType !== "none"
      ? OVERLAY_COLORS[overlayType]
      : undefined;

  return (
    <>
      {/* Grid border */}
      <rect
        x={0}
        y={0}
        width={1}
        height={1}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={0.005}
        opacity={0.25}
      />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((v) => (
        <g key={v}>
          <line
            x1={v}
            y1={0}
            x2={v}
            y2={1}
            stroke="var(--text-muted)"
            strokeWidth={0.003}
            strokeDasharray="0.02 0.02"
            opacity={0.2}
          />
          <line
            x1={0}
            y1={v}
            x2={1}
            y2={v}
            stroke="var(--text-muted)"
            strokeWidth={0.003}
            strokeDasharray="0.02 0.02"
            opacity={0.2}
          />
        </g>
      ))}

      {/* Diagonal reference (linear) */}
      <line
        x1={0}
        y1={1}
        x2={1}
        y2={0}
        stroke="var(--text-muted)"
        strokeWidth={0.004}
        opacity={0.25}
      />

      {/* Derivative overlay (rendered behind main curves) */}
      {overlay && overlayColor && (
        <>
          {overlay.zeroY >= 0 && overlay.zeroY <= 1 && (
            <line
              x1={0}
              y1={overlay.zeroY}
              x2={1}
              y2={overlay.zeroY}
              stroke={overlayColor}
              strokeWidth={0.003}
              strokeDasharray="0.015 0.01"
              opacity={0.35}
            />
          )}
          <polyline
            points={overlay.points}
            fill="none"
            stroke={overlayColor}
            strokeWidth={0.01}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        </>
      )}

      {/* Pinned bezier overlay */}
      {pinnedCurve && (
        <path
          d={`M 0 1 C ${pinnedCurve.x1} ${1 - pinnedCurve.y1} ${pinnedCurve.x2} ${1 - pinnedCurve.y2} 1 0`}
          fill="none"
          stroke="var(--accent-rose)"
          strokeWidth={0.012}
          strokeLinecap="round"
          strokeDasharray="0.03 0.02"
          opacity={0.6}
        />
      )}

      {/* Pinned spring overlay */}
      {pinnedSamples && (
        <polyline
          points={samplesToPolyline(pinnedSamples)}
          fill="none"
          stroke="var(--accent-rose)"
          strokeWidth={0.012}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.03 0.02"
          opacity={0.6}
        />
      )}

      {/* Bezier control lines */}
      {curve && (
        <>
          <line
            x1={0}
            y1={1}
            x2={curve.x1}
            y2={1 - curve.y1}
            stroke="var(--accent)"
            strokeWidth={0.006}
            opacity={0.4}
          />
          <line
            x1={1}
            y1={0}
            x2={curve.x2}
            y2={1 - curve.y2}
            stroke="var(--accent-rose)"
            strokeWidth={0.006}
            opacity={0.4}
          />
          <path
            d={`M 0 1 C ${curve.x1} ${1 - curve.y1} ${curve.x2} ${1 - curve.y2} 1 0`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={0.015}
            strokeLinecap="round"
          />
        </>
      )}

      {/* Spring curve */}
      {samples && (
        <polyline
          points={samplesToPolyline(samples)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={0.015}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Axis labels */}
      <text
        x={0.5}
        y={1.1}
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize={0.055}
        fontFamily="var(--font-source-code-pro)"
      >
        time
      </text>
      <text
        x={-0.08}
        y={0.5}
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize={0.055}
        fontFamily="var(--font-source-code-pro)"
        transform="rotate(-90, -0.08, 0.5)"
      >
        progress
      </text>

      {/* Right axis label for overlay */}
      {overlay && overlayColor && overlayType && (
        <text
          x={1.08}
          y={0.5}
          textAnchor="middle"
          fill={overlayColor}
          fontSize={0.05}
          fontFamily="var(--font-source-code-pro)"
          transform="rotate(-90, 1.08, 0.5)"
          opacity={0.7}
        >
          {overlayType}
        </text>
      )}
    </>
  );
}
