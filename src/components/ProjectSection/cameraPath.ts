export type Point = { x: number; y: number };

/**
 * Catmull-Rom spline interpolation between waypoints.
 * Produces smooth curves through every point (unlike bezier which approximates).
 * @param waypoints - array of {x, y} points the camera visits
 * @param t - global progress 0–1 across all waypoints
 * @returns interpolated {x, y} position
 */
export function interpolatePath(waypoints: Point[], t: number): Point {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1) return waypoints[0];

  const n = waypoints.length - 1;
  const scaledT = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(Math.floor(scaledT), n - 1);
  const localT = scaledT - i;

  // Catmull-Rom needs 4 points: p0, p1, p2, p3
  // Clamp at edges
  const p0 = waypoints[Math.max(0, i - 1)];
  const p1 = waypoints[i];
  const p2 = waypoints[Math.min(n, i + 1)];
  const p3 = waypoints[Math.min(n, i + 2)];

  const tt = localT * localT;
  const ttt = tt * localT;

  // Catmull-Rom matrix (tension 0.5)
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt);

  return { x, y };
}

/**
 * Given progress 0–1, returns which waypoint index is closest
 * and the local progress within that segment (0–1).
 */
export function getSegmentInfo(
  waypointCount: number,
  t: number,
): { index: number; localProgress: number } {
  const n = waypointCount - 1;
  const scaledT = Math.max(0, Math.min(1, t)) * n;
  const index = Math.min(Math.round(scaledT), n);
  const localProgress = 1 - Math.abs(scaledT - index);
  return { index, localProgress };
}
