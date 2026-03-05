"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import useReducedMotion from "~/hooks/useReducedMotion";
import DappledLightScene from "./Scene";
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from "./constants";

export default function DappledLight() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // Defer Canvas mount until the main thread is idle so WebGL init
  // doesn't block FCP/LCP during hydration.
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMounted(true));
      return () => window.cancelIdleCallback(id);
    } else {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 1500ms",
      }}
    >
      {mounted && (
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
      )}
    </div>
  );
}
