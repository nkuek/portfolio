"use client";
import styles from "./GridTicks.module.css";
import { useEffect, useRef, type RefObject } from "react";
import { type MouseOffset } from "~/components/GridTicks";

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
  mouseOffsetRef,
}: {
  dataRef: RefObject<XAxisData>;
  mouseOffsetRef: RefObject<MouseOffset>;
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
      line.className = styles.tick;
      line.style.cssText = "height:8px;width:1px";

      const label = document.createElement("span");
      label.className = styles.label;
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
        return;
      }

      ct.style.opacity = "1";

      ct.style.transform = `translateX(${-mouseOffsetRef.current.x}px)`;

      const w = window.innerWidth;
      const centerX = w / 2;
      const { translateX } = data;

      const centerVal = centerX - translateX;

      const closestVal =
        Math.floor((centerVal + TICK_INTERVAL / 2) / TICK_INTERVAL) *
        TICK_INTERVAL;

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
          children[i].classList.add(styles.highlight, styles.highlightX);
        } else {
          children[i].classList.remove(styles.highlight, styles.highlightX);
        }

        const label = children[i].lastElementChild;
        if (label) label.textContent = String(val);
      }
    }

    let raf = 0;

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [dataRef, mouseOffsetRef]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-2 hidden md:block"
      style={{ transition: "opacity 300ms" }}
      aria-hidden="true"
    />
  );
}
