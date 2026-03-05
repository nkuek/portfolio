import { useEffect, type RefObject } from "react";

const PROXIMITY_RADIUS = 280;
const IDLE_THRESHOLD = 2000;
const FADE_DURATION = 800;

/**
 * Imperatively updates `--cursor-boost` on each child of `containerRef`
 * based on cursor proximity. No React re-renders.
 */
export default function useCursorProximity(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    let mouseX = -9999;
    let mouseY = -9999;
    let lastMoveTime = 0;
    let raf = 0;
    let hasInteracted = false;

    let labelCenters: { cx: number; cy: number }[] = [];
    let cachedElements: HTMLElement[] = [];

    function measureLabels() {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const labels = container.children as HTMLCollectionOf<HTMLElement>;
      labelCenters = [];
      cachedElements = [];
      for (let i = 0; i < labels.length; i++) {
        const el = labels[i];
        cachedElements.push(el);
        labelCenters.push({
          cx: containerRect.left + el.offsetLeft + el.offsetWidth / 2,
          cy: containerRect.top + el.offsetTop + el.offsetHeight / 2,
        });
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!hasInteracted) {
        hasInteracted = true;
        if (isVisible) raf = requestAnimationFrame(tick);
      }
      if (e.clientX !== mouseX || e.clientY !== mouseY) {
        lastMoveTime = performance.now();
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    let lastScrollY = -1;
    let isVisible = false;

    function tick() {
      if (!isVisible) return;

      const sy = window.scrollY;
      if (sy !== lastScrollY || labelCenters.length === 0) {
        measureLabels();
        lastScrollY = sy;
      }

      const idle = performance.now() - lastMoveTime;
      const fadeFactor =
        idle < IDLE_THRESHOLD
          ? 1
          : Math.max(0, 1 - (idle - IDLE_THRESHOLD) / FADE_DURATION);

      for (let i = 0; i < cachedElements.length; i++) {
        const { cx, cy } = labelCenters[i];
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const boost = Math.max(0, 1 - dist / PROXIMITY_RADIUS) * fadeFactor;
        cachedElements[i].style.setProperty("--cursor-boost", String(boost));
      }

      raf = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible && hasInteracted) {
          raf = requestAnimationFrame(tick);
        }
      },
      { rootMargin: "200px" },
    );

    const container = containerRef.current;
    if (container) observer.observe(container);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", measureLabels);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", measureLabels);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);
}
