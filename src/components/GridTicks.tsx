"use client";
import "./GridTicks.css";
import { useEffect, useRef, type RefObject } from "react";

const TICK_INTERVAL = 200;

export type MouseOffset = { x: number; y: number };

export type YAxisData = {
  /** Scroll-position value to display at viewport center (0 = page top) */
  y: number;
  /** When true, use `y` instead of live scrollY (e.g. locked during horizontal scroll) */
  active: boolean;
};

/**
 * Fixed Y-axis grid tick marks along the left edge of the viewport.
 * Continuous rAF loop so ticks respond to both scroll and mouse parallax.
 * When a section locks the y-axis (horizontal scroll), reads from yAxisRef
 * instead of live scroll position.
 */
export default function GridTicks({
  mouseOffsetRef,
  yAxisRef,
}: {
  mouseOffsetRef: RefObject<MouseOffset>;
  yAxisRef: RefObject<YAxisData>;
}) {
  const yContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = yContainerRef.current;
    if (!container) return;

    let tickCount = 0;

    function buildTicks() {
      const ct = yContainerRef.current;
      if (!ct) return;
      const h = window.innerHeight;
      const count = Math.ceil(h / TICK_INTERVAL) + 3;
      if (count === tickCount) return;
      tickCount = count;

      ct.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const tick = document.createElement("div");
        tick.style.cssText = "position:absolute;left:0";

        const line = document.createElement("div");
        line.className = "grid-tick";
        line.style.cssText = "height:1px;width:8px";

        const label = document.createElement("span");
        label.className = "grid-tick-label";
        label.style.cssText =
          "position:absolute;top:2px;left:10px;font-size:9px";

        tick.appendChild(line);
        tick.appendChild(label);
        ct.appendChild(tick);
      }
    }

    buildTicks();

    let raf = 0;
    let prevW = window.innerWidth;

    function tick() {
      const ct = yContainerRef.current;
      if (!ct) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Rebuild if viewport width changed (resize)
      const w = window.innerWidth;
      if (w !== prevW) {
        prevW = w;
        buildTicks();
      }

      const sy = window.scrollY;
      const h = window.innerHeight;
      const centerY = h / 2;

      // Apply mouse offset as a container transform (decoupled from tick math
      // to avoid jitter from rAF timing differences with the parallax loop)
      ct.style.transform = `translateY(${-mouseOffsetRef.current.y}px)`;

      const yData = yAxisRef.current;
      const centerVal = yData.active ? yData.y : sy;
      const virtualSy = centerVal - centerY;
      const closestVal =
        Math.floor((centerVal + TICK_INTERVAL / 2) / TICK_INTERVAL) *
        TICK_INTERVAL;

      const startVal =
        Math.floor(closestVal / TICK_INTERVAL - h / (2 * TICK_INTERVAL) - 1) *
        TICK_INTERVAL;

      const children = ct.children as HTMLCollectionOf<HTMLElement>;

      for (let i = 0; i < children.length; i++) {
        const val = startVal + i * TICK_INTERVAL;
        const screenY = val - virtualSy;

        if (screenY < -20 || screenY > h + 20) {
          children[i].style.display = "none";
          continue;
        }

        children[i].style.display = "";
        children[i].style.top = `${screenY}px`;

        if (val === closestVal) {
          children[i].classList.add(
            "grid-tick-highlight",
            "grid-tick-highlight-y",
          );
        } else {
          children[i].classList.remove(
            "grid-tick-highlight",
            "grid-tick-highlight-y",
          );
        }

        const label = children[i].lastElementChild;
        if (label) label.textContent = String(val);
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [mouseOffsetRef, yAxisRef]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-2 hidden overflow-hidden md:block"
      aria-hidden="true"
    >
      {/* Left edge — Y axis ticks (imperatively updated on scroll) */}
      <div ref={yContainerRef} />
    </div>
  );
}
