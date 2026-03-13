"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  DEFAULT_VERTEX_SHADER,
  FRAGMENT_TEST_PREAMBLE,
  MAX_TIME,
} from "../constants";
import { parseShaderErrors } from "../glsl";
import type { ShaderAction } from "../state";
import type { CustomUniform } from "../types";

type ShaderQuadProps = {
  code: string;
  lastValidCode: string;
  customUniformDefs: CustomUniform[];
  customUniforms: Record<string, number[]>;
  playback: "playing" | "paused";
  speed: number;
  resetCounter: number;
  mouse: { x: number; y: number };
  seekTimeRef: React.RefObject<number | null>;
  invalidateRef: React.RefObject<(() => void) | null>;
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

/** Create the initial THREE uniform value from a CustomUniform definition. */
function defaultUniformValue(def: CustomUniform) {
  const v = def.value;
  switch (def.type) {
    case "vec2":
      return new THREE.Vector2(v[0], v[1]);
    case "vec3":
      return new THREE.Vector3(v[0], v[1], v[2]);
    case "vec4":
      return new THREE.Vector4(v[0], v[1], v[2], v[3]);
    default:
      return v[0] ?? 0;
  }
}

/** Write current values into an existing THREE uniform (avoids allocation). */
function syncUniformValue(
  uniform: THREE.IUniform,
  values: number[],
  def: CustomUniform,
) {
  const v = values.length > 0 ? values : def.value;
  switch (def.type) {
    case "vec2":
      (uniform.value as THREE.Vector2).set(v[0] ?? 0, v[1] ?? 0);
      break;
    case "vec3":
      (uniform.value as THREE.Vector3).set(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
      break;
    case "vec4":
      (uniform.value as THREE.Vector4).set(
        v[0] ?? 0,
        v[1] ?? 0,
        v[2] ?? 0,
        v[3] ?? 0,
      );
      break;
    default:
      uniform.value = v[0] ?? 0;
  }
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
  seekTimeRef,
  invalidateRef,
  dispatch,
  onTimeUpdate,
}: ShaderQuadProps) {
  const { gl, invalidate } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const prevResetRef = useRef(resetCounter);

  // Expose R3F's invalidate so PlaybackControls can trigger frames during scrub
  useEffect(() => {
    (invalidateRef as React.MutableRefObject<(() => void) | null>).current =
      invalidate;
    return () => {
      (invalidateRef as React.MutableRefObject<(() => void) | null>).current =
        null;
    };
  }, [invalidate, invalidateRef]);

  // Stable key based on uniform structure — forces a clean remount of the
  // <shaderMaterial> only when custom uniform names/ranges actually change,
  // rather than on every code edit.
  const uniformStructureKey = customUniformDefs
    .map((d) => `${d.name}:${d.type}:${d.min}:${d.max}`)
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
      u[def.name] = { value: defaultUniformValue(def) };
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

    // Handle seek
    const seekTime = seekTimeRef.current;
    if (seekTime !== null) {
      timeRef.current = seekTime;
      (seekTimeRef as React.MutableRefObject<number | null>).current = null;
      if (playback === "paused") {
        invalidate();
      }
    } else if (playback === "playing") {
      timeRef.current += delta * speed;
      if (timeRef.current >= MAX_TIME) {
        timeRef.current %= MAX_TIME;
      }
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
      const u = mat.uniforms[def.name];
      if (u) {
        syncUniformValue(u, customUniforms[def.name] ?? def.value, def);
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
