import type { BezierCurve } from "./types";

/**
 * Evaluate parametric cubic bezier at parameter t ∈ [0, 1].
 * P0 = (0,0), P1 = (x1,y1), P2 = (x2,y2), P3 = (1,1).
 */
function evalBezier(curve: BezierCurve, t: number): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 3 * mt2 * t * curve.x1 + 3 * mt * t2 * curve.x2 + t3,
    y: 3 * mt2 * t * curve.y1 + 3 * mt * t2 * curve.y2 + t3,
  };
}

/**
 * Sample a cubic-bezier easing at evenly-spaced time values and compute
 * velocity (dy/dx) and acceleration (d²y/dx²) via central finite differences.
 */
export function sampleBezierDerivatives(
  curve: BezierCurve,
  numSamples = 101,
): { velocities: number[]; accelerations: number[] } {
  // Sample parametric bezier at high resolution
  const resolution = 1000;
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i <= resolution; i++) {
    raw.push(evalBezier(curve, i / resolution));
  }

  // Resample to evenly-spaced x (time) values
  const resampled: number[] = [];
  let rawIdx = 0;
  for (let i = 0; i < numSamples; i++) {
    const targetX = i / (numSamples - 1);
    while (rawIdx < raw.length - 1 && raw[rawIdx + 1]!.x < targetX) {
      rawIdx++;
    }
    if (rawIdx >= raw.length - 1) {
      resampled.push(raw[raw.length - 1]!.y);
    } else {
      const a = raw[rawIdx]!;
      const b = raw[rawIdx + 1]!;
      const frac = b.x === a.x ? 0 : (targetX - a.x) / (b.x - a.x);
      resampled.push(a.y + frac * (b.y - a.y));
    }
  }

  // Velocity via central differences (forward/backward at endpoints)
  const dt = 1 / (numSamples - 1);
  const velocities: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    if (i === 0) {
      velocities.push((resampled[1]! - resampled[0]!) / dt);
    } else if (i === numSamples - 1) {
      velocities.push(
        (resampled[numSamples - 1]! - resampled[numSamples - 2]!) / dt,
      );
    } else {
      velocities.push((resampled[i + 1]! - resampled[i - 1]!) / (2 * dt));
    }
  }

  // Acceleration via central differences on velocity
  const accelerations: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    if (i === 0) {
      accelerations.push((velocities[1]! - velocities[0]!) / dt);
    } else if (i === numSamples - 1) {
      accelerations.push(
        (velocities[numSamples - 1]! - velocities[numSamples - 2]!) / dt,
      );
    } else {
      accelerations.push((velocities[i + 1]! - velocities[i - 1]!) / (2 * dt));
    }
  }

  return { velocities, accelerations };
}
