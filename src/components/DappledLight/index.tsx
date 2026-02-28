"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import useReducedMotion from "~/hooks/useReducedMotion";
import DappledLightScene from "./Scene";
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from "./constants";

export default function DappledLight() {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 1500ms",
      }}
    >
      <Canvas
        frameloop="demand"
        shadows
        gl={{
          antialias: false,
          powerPreference: "low-power",
        }}
        dpr={[1, 1.5]}
        camera={{ fov: CAMERA_FOV, near: CAMERA_NEAR, far: CAMERA_FAR }}
        style={{ position: "absolute", inset: 0 }}
      >
        <DappledLightScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
