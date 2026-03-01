/** Snap threshold — below this focus value, elements are fully scattered */
export const FOCUS_SNAP = 0.5;

/** Shared transition for scatter/converge animations */
export const SCATTER_TRANSITION = "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)";

const SCATTER_SCALE = 1.5;

/** Format a single offset axis for use inside calc(). */
function fmtOffset(
  value: number | string,
  scale: number,
): string {
  if (typeof value === "number") return `${value * scale}px`;
  return scale === 1 ? value : `(${value}) * ${scale}`;
}

/**
 * Computes a CSS transform for a fragment that converges toward its
 * resting offset when `focus` exceeds FOCUS_SNAP, and scatters away
 * when below.
 *
 * Offsets can be numbers (px) or CSS length expressions (e.g.
 * `"min(400px, 28vw)"`) for responsive positioning.
 */
export function fragmentTransform(
  offsetX: number | string,
  offsetY: number | string,
  rotate: number,
  focus: number,
  /** Extra spread multiplier when hovered (1 = none). */
  hoverSpread = 1,
) {
  const landed = focus > FOCUS_SNAP;
  const scatterMul = SCATTER_SCALE;
  const spreadMul = hoverSpread !== 1 && landed ? hoverSpread : 1;
  const mul = landed ? spreadMul : scatterMul;
  const ox = fmtOffset(offsetX, mul);
  const oy = fmtOffset(offsetY, mul);
  const r = landed ? rotate * 0.35 : rotate;
  return `translate(calc(-50% + ${ox}), calc(-50% + ${oy})) rotate(${r}deg)`;
}

/**
 * Scatter transform for child elements (tape, pin, play button).
 * Returns identity when focused/landed.
 */
export function childScatter(
  scatterOffset: [number, number],
  scatterRotate: number,
  focus: number,
  scaleRange?: [number, number],
) {
  const landed = focus > FOCUS_SNAP;
  const ox = landed ? 0 : scatterOffset[0];
  const oy = landed ? 0 : scatterOffset[1];
  const r = landed ? 0 : scatterRotate;
  const s = landed ? 1 : scaleRange ? scaleRange[0] : 1;
  return `translate(${ox}px, ${oy}px) rotate(${r}deg) scale(${s})`;
}
