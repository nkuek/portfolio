"use client";

import WebGPUCanvas from "../WebGPUCanvas";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  color,
  float,
  Fn,
  mix,
  mx_noise_vec3,
  normalize,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";

function CanvasContent() {
  const { viewport } = useThree();
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight; // Flip Y to match UV
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const { colorNode, uniforms } = useMemo(() => {
    const time = uniform(0);
    const scrollProgress = uniform(0);
    const mouseUV = uniform(new THREE.Vector2(0.5, 0.5));
    const uniforms = { time, scrollProgress, mouseUV };

    const colorNode = Fn(() => {
      const warmColor = color("#c4636a").toVar();
      const coolColor = color("#2d7d9a").toVar();
      const neutralColor = color("#3a3a42").toVar();

      // Warm → Cool → Neutral as user scrolls
      const warmToCool = mix(
        warmColor,
        coolColor,
        smoothstep(0, 0.45, scrollProgress),
      );
      const baseColor = mix(
        warmToCool,
        neutralColor,
        smoothstep(0.55, 1, scrollProgress),
      ).toVar();

      // ── Mouse interaction ──
      const currentUV = uv();
      const distToMouse = currentUV.sub(mouseUV).length();
      const mouseInfluence = smoothstep(0.3, 0.0, distToMouse);

      // Distort noise sampling UVs — ripple outward from cursor
      const dirFromMouse = normalize(currentUV.sub(mouseUV).max(vec2(0.001)));
      const distortedUV = currentUV.add(
        dirFromMouse.mul(mouseInfluence.mul(0.06)),
      );

      // Sample noise with distorted coordinates
      const noise = mx_noise_vec3(
        vec3(
          distortedUV.x.mul(viewport.width * 0.12),
          distortedUV.y.mul(viewport.height * 0.12),
          time.mul(0.08),
        ),
      );

      baseColor.addAssign(noise.x.mul(0.22));

      // Proximity color bloom — brighten near cursor
      baseColor.addAssign(mouseInfluence.mul(0.15));

      // Scroll-dependent alpha: dramatic in Act I, subtle elsewhere
      const baseAlpha = mix(
        float(0.45),
        float(0.15),
        smoothstep(0.0, 0.12, scrollProgress),
      );
      const alpha = baseAlpha.sub(
        smoothstep(0.12, 0.35, noise.x).mul(baseAlpha.mul(0.4)),
      );

      return vec4(baseColor, alpha);
    })();

    return { colorNode, uniforms };
  }, [viewport.width, viewport.height]);

  useFrame((_, delta) => {
    uniforms.time.value += delta;
    // Smooth scroll interpolation
    uniforms.scrollProgress.value +=
      (scrollRef.current - uniforms.scrollProgress.value) * 0.04;
    // Smooth mouse interpolation
    uniforms.mouseUV.value.x +=
      (mouseRef.current.x - uniforms.mouseUV.value.x) * 0.08;
    uniforms.mouseUV.value.y +=
      (mouseRef.current.y - uniforms.mouseUV.value.y) * 0.08;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicNodeMaterial
        fragmentNode={colorNode}
        key={THREE.MathUtils.generateUUID()}
        transparent
      />
    </mesh>
  );
}

export default function PersistentCanvas() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-2] h-full w-full"
      aria-hidden="true"
    >
      <WebGPUCanvas>
        <Suspense fallback={null}>
          <CanvasContent />
        </Suspense>
      </WebGPUCanvas>
    </div>
  );
}
