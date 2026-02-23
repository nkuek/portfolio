"use client";

import { useEffect, useRef, type RefObject } from "react";

export type CrosshairData = {
  label: string;
  focused: boolean;
  visible: boolean;
  /** Which section last claimed visibility — only that section may clear it */
  owner?: string;
};

/**
 * Fixed crosshair overlay — centered viewport lines with coordinate label.
 * Reads from a shared ref written by panning sections.
 */
export default function Crosshair({
  dataRef,
}: {
  dataRef: RefObject<CrosshairData>;
}) {
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    function tick() {
      const data = dataRef.current;
      const container = containerRef.current;
      const hLine = hLineRef.current;
      const vLine = vLineRef.current;
      const label = labelRef.current;

      if (container && hLine && vLine && label) {
        if (!data.visible) {
          container.style.opacity = "0";
        } else {
          container.style.opacity = "1";
          const lineOpacity = data.focused ? "0.25" : "0.12";
          hLine.style.opacity = lineOpacity;
          vLine.style.opacity = lineOpacity;
          label.style.opacity = data.focused ? "0.6" : "0.35";
          label.textContent = data.label;
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dataRef]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-1 hidden md:block"
      style={{ transition: "opacity 300ms" }}
      aria-hidden="true"
    >
      <div
        ref={hLineRef}
        className="absolute top-1/2 left-0 h-px w-full"
        style={{
          background: "var(--text-muted)",
          opacity: 0.12,
          transition: "opacity 300ms",
        }}
      />
      <div
        ref={vLineRef}
        className="absolute top-0 left-1/2 h-full w-px"
        style={{
          background: "var(--text-muted)",
          opacity: 0.12,
          transition: "opacity 300ms",
        }}
      />
      <div
        ref={labelRef}
        className="text-text-muted absolute top-1/2 left-1/2 translate-x-2 -translate-y-5 font-mono text-[10px]"
        style={{
          opacity: 0.35,
          transition: "opacity 300ms",
        }}
      />
    </div>
  );
}
