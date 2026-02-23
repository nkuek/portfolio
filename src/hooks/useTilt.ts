import { useCallback, useEffect, useRef } from "react";

/* ── Tilt constants ── */
const MAX_TILT = 6;
const LERP_ATTACK = 0.08;
const LERP_DECAY = 0.04;
const TILT_DEAD = 0.01;

/** Compute resting sheen from camera offset (normalized ~-1..1 per axis).
 *  Gradient center shifts toward the camera to simulate a view-dependent gloss. */
function computeRestingSheen(offset: [number, number]): string {
  const [nx, ny] = offset;
  const cx = 50 + nx * 20;
  const cy = 50 + ny * 20;
  const mag = Math.sqrt(nx * nx + ny * ny);
  const peak = 0.09 * (1 + mag * 0.5);
  return (
    `radial-gradient(circle at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, ` +
    `rgba(255,255,255,${peak.toFixed(3)}) 0%, ` +
    `rgba(255,255,255,${(peak * 0.6).toFixed(3)}) 15%, ` +
    `rgba(255,255,255,${(peak * 0.24).toFixed(3)}) 35%, ` +
    `rgba(0,0,0,${(peak * 0.3).toFixed(3)}) 55%, ` +
    `rgba(0,0,0,${(peak * 0.1).toFixed(3)}) 70%, ` +
    `transparent 85%)`
  );
}

export const TILT_INNER_TRANSITION =
  'scale 200ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 200ms cubic-bezier(0.2, 0.8, 0.2, 1)';

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
    sheenRef.current.style.background = computeRestingSheen(
      cameraOffsetRef.current,
    );
  }

  // Set resting sheen on mount
  useEffect(() => {
    if (sheenRef.current && !reducedMotion) {
      sheenRef.current.style.background = computeRestingSheen(
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
        if (innerRef.current) innerRef.current.style.transform = '';
        if (sheenRef.current)
          sheenRef.current.style.background = computeRestingSheen(
            cameraOffsetRef.current,
          );
        rafRef.current = 0;
        return;
      }

      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
      }

      // Sheen — front-on spotlight reflection (slides opposite to cursor)
      if (sheenRef.current) {
        const mag = Math.sqrt(c.rx * c.rx + c.ry * c.ry) / MAX_TILT;
        const sx = 50 - (c.ry / MAX_TILT) * 30;
        const sy = 50 + (c.rx / MAX_TILT) * 30;
        const peak = mag * 0.18;

        sheenRef.current.style.background =
          `radial-gradient(circle at ${sx}% ${sy}%, ` +
            `rgba(255,255,255,${peak}) 0%, ` +
            `rgba(255,255,255,${peak * 0.6}) 15%, ` +
            `rgba(255,255,255,${peak * 0.25}) 35%, ` +
            `rgba(0,0,0,${peak * 0.3}) 55%, ` +
            `rgba(0,0,0,${peak * 0.1}) 70%, ` +
            `transparent 85%)`;
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
    perspective: reducedMotion ? undefined : ('1200px' as const),
  };
}
