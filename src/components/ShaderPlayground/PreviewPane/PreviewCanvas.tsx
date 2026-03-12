"use client";

import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import ShaderQuad from "./ShaderQuad";
import type { ShaderAction } from "../state";
import type { CustomUniform } from "../types";

type PreviewCanvasProps = {
  code: string;
  lastValidCode: string;
  customUniformDefs: CustomUniform[];
  customUniforms: Record<string, number>;
  playback: "playing" | "paused";
  speed: number;
  resetCounter: number;
  dispatch: React.Dispatch<ShaderAction>;
  onTimeUpdate: (time: number) => void;
};

export default function PreviewCanvas({
  code,
  lastValidCode,
  customUniformDefs,
  customUniforms,
  playback,
  speed,
  resetCounter,
  dispatch,
  onTimeUpdate,
}: PreviewCanvasProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      });
    },
    [],
  );

  return (
    <div
      className="aspect-square w-full max-h-[min(100vw,600px)] overflow-hidden"
      role="img"
      aria-label="Shader preview"
      onPointerMove={handlePointerMove}
    >
      <Canvas
        frameloop={playback === "playing" ? "always" : "demand"}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          powerPreference: "default",
        }}
        orthographic
        camera={{
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
          near: 0.1,
          far: 10,
          position: [0, 0, 1] as [number, number, number],
        }}
      >
        <ShaderQuad
          code={code}
          lastValidCode={lastValidCode}
          customUniformDefs={customUniformDefs}
          customUniforms={customUniforms}
          playback={playback}
          speed={speed}
          resetCounter={resetCounter}
          mouse={mouse}
          dispatch={dispatch}
          onTimeUpdate={onTimeUpdate}
        />
      </Canvas>
    </div>
  );
}
