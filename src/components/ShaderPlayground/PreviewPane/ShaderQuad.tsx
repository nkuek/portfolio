"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_VERTEX_SHADER, FRAGMENT_TEST_PREAMBLE } from "../constants";
import { parseShaderErrors } from "../glsl";
import type { ShaderAction } from "../state";
import type { CustomUniform } from "../types";

type ShaderQuadProps = {
  code: string;
  lastValidCode: string;
  customUniformDefs: CustomUniform[];
  customUniforms: Record<string, number>;
  playback: "playing" | "paused";
  speed: number;
  resetCounter: number;
  mouse: { x: number; y: number };
  dispatch: React.Dispatch<ShaderAction>;
  onTimeUpdate: (time: number) => void;
};

/**
 * Test-compile a fragment shader using raw WebGL to detect errors
 * without affecting the active ShaderMaterial.
 */
function testCompileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  source: string,
): { success: boolean; log: string } {
  const shader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!shader) return { success: false, log: "Failed to create shader" };

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
  const log = gl.getShaderInfoLog(shader) ?? "";

  gl.deleteShader(shader);
  return { success, log };
}

/** Reusable vector to avoid allocating in useFrame */
const _sizeVec = new THREE.Vector2();

export default function ShaderQuad({
  code,
  lastValidCode,
  customUniformDefs,
  customUniforms,
  playback,
  speed,
  resetCounter,
  mouse,
  dispatch,
  onTimeUpdate,
}: ShaderQuadProps) {
  const { gl } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const prevResetRef = useRef(resetCounter);

  // Stable key based on uniform structure — forces a clean remount of the
  // <shaderMaterial> only when custom uniform names/ranges actually change,
  // rather than on every code edit.
  const uniformStructureKey = customUniformDefs
    .map((d) => `${d.name}:${d.min}:${d.max}`)
    .join(",");

  // Build uniforms object — only recreate when the structure actually changes.
  // Values are synced every frame in useFrame to avoid recreating the material.
  const uniforms = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_mouse: { value: new THREE.Vector2(0, 0) },
    };

    for (const def of customUniformDefs) {
      u[def.name] = { value: def.value };
    }

    return u;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniformStructureKey]);

  // Test-compile fragment shader when code changes
  useEffect(() => {
    const context = gl.getContext();
    if (!context) return;

    // Prepend precision for raw WebGL test (ShaderMaterial provides this automatically)
    const { success, log } = testCompileShader(
      context,
      FRAGMENT_TEST_PREAMBLE + code,
    );

    if (success) {
      dispatch({ type: "COMPILATION_SUCCESS" });
      if (materialRef.current) {
        materialRef.current.fragmentShader = code;
        materialRef.current.needsUpdate = true;
      }
    } else {
      const errors = parseShaderErrors(log);
      dispatch({ type: "SET_ERRORS", errors });
    }
  }, [code, gl, dispatch]);

  // Reset time when resetCounter changes
  useEffect(() => {
    if (resetCounter !== prevResetRef.current) {
      prevResetRef.current = resetCounter;
      timeRef.current = 0;
    }
  }, [resetCounter]);

  // Per-frame uniform updates
  useFrame((_state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    // Advance time
    if (playback === "playing") {
      timeRef.current += delta * speed;
    }
    onTimeUpdate(timeRef.current);

    // Update built-in uniforms
    mat.uniforms.u_time.value = timeRef.current;
    mat.uniforms.u_mouse.value.set(mouse.x, mouse.y);

    // Update resolution from renderer
    const size = gl.getSize(_sizeVec);
    const dpr = gl.getPixelRatio();
    mat.uniforms.u_resolution.value.set(size.x * dpr, size.y * dpr);

    // Sync custom uniform values from props
    for (const def of customUniformDefs) {
      if (mat.uniforms[def.name]) {
        mat.uniforms[def.name].value = customUniforms[def.name] ?? def.value;
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={uniformStructureKey}
        ref={materialRef}
        vertexShader={DEFAULT_VERTEX_SHADER}
        fragmentShader={lastValidCode}
        uniforms={uniforms}
      />
    </mesh>
  );
}
