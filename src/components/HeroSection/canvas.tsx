"use client";
import WebGPUCanvas from "../WebGPUCanvas";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import {
  color,
  float,
  Fn,
  mx_noise_vec3,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { gaussianBlur } from "three/examples/jsm/tsl/display/GaussianBlurNode.js";

function CanvasContent() {
  const { viewport } = useThree();
  const { colorNode, uniforms } = useMemo(() => {
    const time = uniform(0);
    const uniforms = { time };
    const colorNode = Fn(() => {
      const baseColor = color("#D98CA2").toVar();
      const noise = mx_noise_vec3(
        vec3(uv().x.mul(3), uv().y.mul(2), time.mul(0.3)),
      );
      baseColor.addAssign(noise.y.mul(0.4));
      // const c = baseColor
      //   .mul(0.5 + 0.5 * sin(noise.x.add(time)))
      //   .add(vec3(0.1, 0.2, 0.3).mul(sin(time * 2.0 + noise.y * 10.0)));
      // const blur = gaussianBlur(vec4(uv().mul(time), 0.0, 1.0), 0.01, 30);
      return vec4(baseColor, float(0.7).sub(smoothstep(0.1, 0.5, noise.y)));
    })();

    return { colorNode, uniforms };
  }, []);

  useFrame((_, delta) => {
    uniforms.time.value += delta;
  });
  return (
    <>
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicNodeMaterial
          // colorNode={colorNode}
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
    <div className="animate-fade-in absolute inset-0 z-[-1] h-dvh w-full opacity-0">
      <WebGPUCanvas>
        <Suspense fallback={<div>Loading...</div>}>
          <CanvasContent />
        </Suspense>
      </WebGPUCanvas>
    </div>
  );
}
