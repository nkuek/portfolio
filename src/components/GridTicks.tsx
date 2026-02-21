"use client";

import { useEffect, useRef } from "react";

const TICK_INTERVAL = 200;

/**
 * Fixed Y-axis grid tick marks along the left edge of the viewport.
 * Labels update with scroll position. Hidden on mobile.
 */
export default function GridTicks() {
  const yContainerRef = useRef<HTMLDivElement>(null);

  // Y-axis ticks — imperatively update positions on scroll to avoid re-renders
  useEffect(() => {
    const container = yContainerRef.current;
    if (!container) return;

    function buildTicks() {
      const ct = yContainerRef.current;
      if (!ct) return;
      const h = window.innerHeight;
      const count = Math.ceil(h / TICK_INTERVAL) + 2;

      // Pre-build tick elements with inline styles (Tailwind can't scan innerHTML)
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

    function updatePositions() {
      const ct = yContainerRef.current;
      if (!ct) return;

      const sy = window.scrollY;
      const h = window.innerHeight;
      const centerY = h / 2;

      // Highlight-by-value (stable): choose nearest tick VALUE to center
      const centerVal = sy + centerY;
      const closestVal =
        Math.floor((centerVal + TICK_INTERVAL / 2) / TICK_INTERVAL) *
        TICK_INTERVAL;

      // Anchor the tick window around the highlighted value (prevents startVal snapping)
      const startVal =
        Math.floor(closestVal / TICK_INTERVAL - h / (2 * TICK_INTERVAL) - 1) *
        TICK_INTERVAL;

      const children = ct.children as HTMLCollectionOf<HTMLElement>;

      for (let i = 0; i < children.length; i++) {
        const val = startVal + i * TICK_INTERVAL;
        const screenY = val - sy;

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
    }

    buildTicks();
    updatePositions();

    // -----------------------------
    // rAF-throttled scheduler
    // -----------------------------
    let ticking = false;
    let needsRebuild = false;

    const requestUpdate = (rebuild: boolean) => {
      if (rebuild) needsRebuild = true;
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        if (needsRebuild) {
          needsRebuild = false;
          buildTicks();
        }

        updatePositions();
      });
    };

    const onScroll = () => requestUpdate(false);
    const onResize = () => requestUpdate(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
