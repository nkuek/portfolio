import { useCallback, useEffect, useRef } from "react";

/* ── Tilt constants ── */
const MAX_TILT = 6;
const LERP_ATTACK = 0.08;
const LERP_DECAY = 0.04;
const TILT_DEAD = 0.01;

/** Unified sheen — blends camera-offset resting gloss with cursor-driven tilt highlight.
 *  As tilt decays toward zero the gradient slides back to the resting position
 *  with no discontinuity. */
function computeSheen(
  rx: number,
  ry: number,
  cameraOffset: [number, number],
): string {
  const tiltMag = Math.sqrt(rx * rx + ry * ry) / MAX_TILT; // 0‥1

  // Tilt-driven position (slides opposite to cursor)
  const tiltX = 50 - (ry / MAX_TILT) * 30;
  const tiltY = 50 + (rx / MAX_TILT) * 30;

  // Camera-offset resting position
  const [nx, ny] = cameraOffset;
  const restX = 50 + nx * 20;
  const restY = 50 + ny * 20;

  // Blend: tiltMag drives mix — zero tilt → resting position, full tilt → tilt position
  const sx = restX + (tiltX - restX) * tiltMag;
  const sy = restY + (tiltY - restY) * tiltMag;

  // Intensity ramps from subtle resting gloss to active tilt highlight
  const cameraMag = Math.sqrt(nx * nx + ny * ny);
  const restPeak = 0.09 * (1 + cameraMag * 0.5);
  const peak = restPeak + (0.18 - restPeak) * tiltMag;

  return (
    `radial-gradient(circle at ${sx.toFixed(1)}% ${sy.toFixed(1)}%, ` +
    `rgba(255,255,255,${peak.toFixed(3)}) 0%, ` +
    `rgba(255,255,255,${(peak * 0.55).toFixed(3)}) 20%, ` +
    `rgba(255,255,255,${(peak * 0.18).toFixed(3)}) 45%, ` +
    `transparent 75%)`
  );
}

export const TILT_INNER_TRANSITION =
  "scale var(--duration-fast) var(--ease-smooth), box-shadow var(--duration-fast) var(--ease-smooth)";

export default function useTilt(
  reducedMotion: boolean,
  cameraOffset?: [number, number],
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef(0);
  const activeRef = useRef(false);
  const cameraOffsetRef = useRef<[number, number]>([0, 0]);

  // Keep camera offset in sync with caller
  cameraOffsetRef.current = cameraOffset ?? [0, 0];

  // Update resting sheen continuously when not actively tilting
  if (sheenRef.current && !reducedMotion && !rafRef.current) {
    sheenRef.current.style.background = computeSheen(
      0,
      0,
      cameraOffsetRef.current,
    );
  }

  // Set resting sheen on mount
  useEffect(() => {
    if (sheenRef.current && !reducedMotion) {
      sheenRef.current.style.background = computeSheen(
        0,
        0,
        cameraOffsetRef.current,
      );
    }
  }, [reducedMotion]);

  const startLoop = useCallback(() => {
    if (rafRef.current) return;
    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      const lerp = activeRef.current ? LERP_ATTACK : LERP_DECAY;

      c.rx += (t.rx - c.rx) * lerp;
      c.ry += (t.ry - c.ry) * lerp;

      const done =
        !activeRef.current &&
        Math.abs(c.rx) < TILT_DEAD &&
        Math.abs(c.ry) < TILT_DEAD;

      if (done) {
        c.rx = 0;
        c.ry = 0;
        if (innerRef.current) innerRef.current.style.transform = "";
        if (sheenRef.current)
          sheenRef.current.style.background = computeSheen(
            0,
            0,
            cameraOffsetRef.current,
          );
        rafRef.current = 0;
        return;
      }

      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
      }

      if (sheenRef.current) {
        sheenRef.current.style.background = computeSheen(
          c.rx,
          c.ry,
          cameraOffsetRef.current,
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const onPointerEnter = useCallback(() => {
    if (reducedMotion) return;
    activeRef.current = true;
    startLoop();
  }, [reducedMotion, startLoop]);

  const onPointerLeave = useCallback(() => {
    activeRef.current = false;
    targetRef.current = { rx: 0, ry: 0 };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current || reducedMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRef.current = { rx: -ny * MAX_TILT, ry: nx * MAX_TILT };
    },
    [reducedMotion],
  );

  return {
    tiltRef: innerRef,
    sheenRef,
    tiltHandlers: { onPointerEnter, onPointerLeave, onPointerMove },
    perspective: reducedMotion ? undefined : ("1200px" as const),
  };
}
