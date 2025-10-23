"use client";
import WebGPUCanvas from "../WebGPUCanvas";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import {
  blendColor,
  color,
  float,
  Fn,
  mx_noise_vec3,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
  viewportSharedTexture,
} from "three/tsl";
import * as THREE from "three/webgpu";

function CanvasContent() {
  const { viewport } = useThree();
  const { colorNode, uniforms } = useMemo(() => {
    const time = uniform(0);
    const uniforms = { time };
    const colorNode = Fn(() => {
      const baseColor = color("#ba6077").toVar();
      const noise = mx_noise_vec3(
        vec3(
          uv().x.mul(1 * viewport.width * 0.15),
          uv().y.mul(1 * viewport.height * 0.15),
          time.mul(0.1),
        ),
      );
      baseColor.addAssign(noise.x.mul(0.4));
      return blendColor(
        vec4(baseColor, float(0.5).sub(smoothstep(0.1, 0.3, noise.x))),
        viewportSharedTexture(),
      );
    })();

    return { colorNode, uniforms };
  }, [viewport.width, viewport.height]);

  useFrame((_, delta) => {
    uniforms.time.value += delta;
  });
  return (
    <>
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicNodeMaterial
          fragmentNode={colorNode}
          key={THREE.MathUtils.generateUUID()}
          transparent
        />
      </mesh>
      <OrbitControls />
    </>
  );
}

export default function HeroSectionCanvas() {
  return (
    <div className="animate-fade-in absolute inset-0 -top-19 z-[-1] h-screen w-full opacity-0">
      <WebGPUCanvas>
        <Suspense fallback={<div>Loading...</div>}>
          <CanvasContent />
        </Suspense>
      </WebGPUCanvas>
    </div>
  );
}
