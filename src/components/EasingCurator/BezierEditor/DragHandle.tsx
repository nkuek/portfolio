"use client";

import { useCallback, useRef, useState } from "react";

type DragHandleProps = {
  cx: number;
  cy: number;
  label: string;
  color: string;
  onDrag: (x: number, y: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
};

function svgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: pt.x, y: pt.y };
}

export default function DragHandle({
  cx,
  cy,
  label,
  color,
  onDrag,
  onDragStart,
  onDragEnd,
  svgRef,
}: DragHandleProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const circle = circleRef.current;
      const svg = svgRef.current;
      if (!circle || !svg) return;

      circle.setPointerCapture(e.pointerId);
      onDragStart?.();

      const onMove = (ev: PointerEvent) => {
        const pt = svgPoint(svg, ev.clientX, ev.clientY);
        const x = Math.max(0, Math.min(1, pt.x));
        const y = Math.max(-1, Math.min(2, 1 - pt.y));
        onDrag(x, y);
      };

      const cleanup = () => {
        circle.removeEventListener("pointermove", onMove);
        circle.removeEventListener("pointerup", cleanup);
        circle.removeEventListener("pointercancel", cleanup);
        onDragEnd?.();
      };

      circle.addEventListener("pointermove", onMove);
      circle.addEventListener("pointerup", cleanup);
      circle.addEventListener("pointercancel", cleanup);
    },
    [onDrag, svgRef],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      const curveX = cx;
      const curveY = 1 - cy;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          onDrag(Math.min(1, curveX + step), curveY);
          break;
        case "ArrowLeft":
          e.preventDefault();
          onDrag(Math.max(0, curveX - step), curveY);
          break;
        case "ArrowUp":
          e.preventDefault();
          onDrag(curveX, Math.min(2, curveY + step));
          break;
        case "ArrowDown":
          e.preventDefault();
          onDrag(curveX, Math.max(-1, curveY - step));
          break;
      }
    },
    [cx, cy, onDrag],
  );

  return (
    <g>
      {(focused || hovered) && (
        <circle
          cx={cx}
          cy={cy}
          r={0.055}
          fill="none"
          stroke={color}
          strokeWidth={0.008}
          opacity={focused ? 0.6 : 0.35}
        />
      )}
      <circle
        ref={circleRef}
        cx={cx}
        cy={cy}
        r={0.035}
        fill={color}
        stroke="white"
        strokeWidth={0.01}
        tabIndex={0}
        role="slider"
        aria-label={label}
        aria-valuenow={Math.round(cx * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`x: ${cx.toFixed(2)}, y: ${(1 - cy).toFixed(2)}`}
        className="cursor-grab outline-none active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </g>
  );
}
