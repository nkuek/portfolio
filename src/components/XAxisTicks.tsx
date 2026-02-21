"use client";

import { useEffect, useRef, type RefObject } from "react";

const TICK_INTERVAL = 200;

export type XAxisData = {
  cameraX: number;
  translateX: number;
  visible: boolean;
};

/**
 * Fixed X-axis tick marks along the bottom edge of the viewport.
 * Reads camera data from a shared ref written by panning sections.
 */
export default function XAxisTicks({
  dataRef,
}: {
  dataRef: RefObject<XAxisData>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ct = containerRef.current;
    if (!ct) return;

    // Pre-build tick elements
    const maxTicks = Math.ceil(window.innerWidth / TICK_INTERVAL) + 3;
    for (let i = 0; i < maxTicks; i++) {
      const tick = document.createElement("div");
      tick.style.cssText = "position:absolute;bottom:0";

      const line = document.createElement("div");
      line.className = "grid-tick";
      line.style.cssText = "height:8px;width:1px";

      const label = document.createElement("span");
      label.className = "grid-tick-label";
      label.style.cssText =
        "position:absolute;bottom:10px;left:4px;font-size:9px";

      tick.appendChild(line);
      tick.appendChild(label);
      ct.appendChild(tick);
    }

    function update() {
      const data = dataRef.current;
      if (!ct) return;

      if (!data.visible) {
        ct.style.opacity = "0";
        raf = requestAnimationFrame(update);
        return;
      }

      ct.style.opacity = "1";
      const w = window.innerWidth;
      const centerX = w / 2;
      const { translateX } = data;

      // World-space value that sits at the center of the screen.
      const centerVal = centerX - translateX;

      // Stable highlight: pick the nearest tick VALUE (round-to-interval).
      const closestVal =
        Math.floor((centerVal + TICK_INTERVAL / 2) / TICK_INTERVAL) *
        TICK_INTERVAL;

      // Anchor tick generation around the highlighted value (stable window)
      const start =
        Math.floor(closestVal / TICK_INTERVAL - w / (2 * TICK_INTERVAL) - 1) *
        TICK_INTERVAL;

      const children = ct.children as HTMLCollectionOf<HTMLElement>;

      for (let i = 0; i < children.length; i++) {
        const val = start + i * TICK_INTERVAL;
        const screen = val + translateX;

        if (screen < -20 || screen > w + 20) {
          children[i].style.display = "none";
          continue;
        }

        children[i].style.display = "";
        children[i].style.left = `${screen}px`;

        if (val === closestVal) {
          children[i].classList.add(
            "grid-tick-highlight",
            "grid-tick-highlight-x",
          );
        } else {
          children[i].classList.remove(
            "grid-tick-highlight",
            "grid-tick-highlight-x",
          );
        }

        const label = children[i].lastElementChild;
        if (label) label.textContent = String(val);
      }

      raf = requestAnimationFrame(update);
    }

    let raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, [dataRef]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-2 hidden md:block"
      style={{ transition: "opacity 300ms" }}
      aria-hidden="true"
    />
  );
}
