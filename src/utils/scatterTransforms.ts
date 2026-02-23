/** Snap threshold — below this focus value, elements are fully scattered */
export const FOCUS_SNAP = 0.5;

const SCATTER_SCALE = 1.5;

/**
 * Computes a CSS transform for a fragment that converges toward its
 * resting offset when `focus` exceeds FOCUS_SNAP, and scatters away
 * when below.
 */
export function fragmentTransform(
  offsetX: number,
  offsetY: number,
  rotate: number,
  focus: number,
  /** Extra spread multiplier when hovered (1 = none). */
  hoverSpread = 1,
) {
  const landed = focus > FOCUS_SNAP;
  let ox = landed ? offsetX : offsetX * SCATTER_SCALE;
  let oy = landed ? offsetY : offsetY * SCATTER_SCALE;
  const r = landed ? rotate * 0.35 : rotate;
  if (hoverSpread !== 1 && landed) {
    ox *= hoverSpread;
    oy *= hoverSpread;
  }
  return `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${r}deg)`;
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

/** Label size classes shared between ProjectSection and InTheWild */
export const LABEL_SIZES = {
  sm: "text-[16px] tracking-[0.1em]",
  md: "text-[24px] tracking-[0.06em]",
  lg: "text-[34px] tracking-[0.04em] font-light",
} as const;
