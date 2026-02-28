"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { generateTree, DEFAULT_SPINE_LENGTH, DEFAULT_SUB_BRANCH_LENGTH } from "./lsystem";
import { createBranchGeometry, createBranchMaterial, createLeafData, type ClearingConfig } from "./tree";
import {
  CAMERA_POSITION,
  LIGHT_POSITION,
  LIGHT_INTENSITY,
  LIGHT_INTENSITY_DARK,
  LIGHT_POSITION_DARK,
  LIGHT_SHADOW_CAMERA,
  AMBIENT_INTENSITY,
  GROUND_SIZE,
  GROUND_POSITION_Y,
  TREE_POSITION,
  TREE_SCALE,
  DIR_LIGHT_COLOR_LIGHT,
  DIR_LIGHT_COLOR_DARK,
  AMBIENT_COLOR_LIGHT,
  AMBIENT_COLOR_DARK,
  GROUND_COLOR_LIGHT,
  GROUND_COLOR_DARK,
  WIND_SPEED,
  WIND_AMPLITUDE,
  FRAME_INTERVAL,
  COLOR_LERP_SPEED_TO_DARK,
  COLOR_LERP_SPEED_TO_LIGHT,
  SHADOW_MAP_SIZE,
  SHADOW_MAP_SIZE_MOBILE,
  PCSS_SAMPLES,
  PCSS_SAMPLES_MOBILE,
  PCSS_SIZE,
  PCSS_SIZE_MOBILE,
  PCSS_FOCUS,
  SHADOW_BIAS,
  CLEARING_RADIUS_X,
  CLEARING_RADIUS_Z,
  CLEARING_STRENGTH,
  LEAF_COLOR_LIGHT,
  LEAF_COLOR_DARK,
  LEAF_STRETCH_X_DARK,
  LEAF_STRETCH_Z_DARK,
} from "./constants";

const _tempQuat = new THREE.Quaternion();
const _tempQuat2 = new THREE.Quaternion();
const _tempWindMatrix = new THREE.Matrix4();
const _windRotMatrix = new THREE.Matrix4();

function isMobile() {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

/** Reads dark mode from DOM attribute — no React re-renders */
function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  const scheme = document.documentElement.getAttribute("data-color-scheme");
  if (scheme) return scheme === "dark";
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Sets camera to look straight down at ground */
function CameraSetup() {
  const { camera, scene, gl, invalidate } = useThree();

  useEffect(() => {
    camera.position.set(
      CAMERA_POSITION[0],
      CAMERA_POSITION[1],
      CAMERA_POSITION[2],
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    gl.render(scene, camera);
    invalidate();
  }, [camera, scene, gl, invalidate]);

  return null;
}

/** 24fps throttle — invalidates the demand-mode canvas at a fixed interval */
function FrameThrottle({ reducedMotion }: { reducedMotion: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (reducedMotion) {
      invalidate();
      return;
    }
    const id = setInterval(() => invalidate(), FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [invalidate, reducedMotion]);

  useEffect(() => {
    const observer = new MutationObserver(() => invalidate());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-scheme"],
    });
    return () => observer.disconnect();
  }, [invalidate]);

  return null;
}

/**
 * Ground plane — receives shadows.
 * White in light mode, dark in dark mode.
 */
function Ground({ lerpToDark, lerpToLight }: { lerpToDark: number; lerpToLight: number }) {
  const dark = isDarkMode();
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const initialColor = dark ? GROUND_COLOR_DARK : GROUND_COLOR_LIGHT;

  useFrame(() => {
    if (!materialRef.current) return;
    const d = isDarkMode();
    const lerpSpeed = d ? lerpToDark : lerpToLight;
    const target = d ? GROUND_COLOR_DARK : GROUND_COLOR_LIGHT;
    materialRef.current.color.lerp(new THREE.Color(target), lerpSpeed);
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={GROUND_POSITION_Y} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial ref={materialRef} color={initialColor} />
    </mesh>
  );
}

/**
 * Single tree — branches + instanced leaves with wind.
 * Branches use colorWrite:false (invisible but opaque for shadow depth pass).
 * Leaves use opacity:0 + alphaMap for shaped shadow silhouettes.
 */
function TreeCanopy({
  reducedMotion,
  position,
  spineLength,
  subBranchLength,
  clearing,
}: {
  reducedMotion: boolean;
  position: [number, number, number];
  spineLength: number;
  subBranchLength: number;
  clearing?: ClearingConfig;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dark = isDarkMode();
  const stretchX = useRef(dark ? LEAF_STRETCH_X_DARK : 1);
  const stretchZ = useRef(dark ? LEAF_STRETCH_Z_DARK : 1);
  const leafColor = useRef(new THREE.Color(dark ? LEAF_COLOR_DARK : LEAF_COLOR_LIGHT));

  const tree = useMemo(() => {
    const treeData = generateTree({ spineLength, subBranchLength });
    const canopyBranchGeo = createBranchGeometry(treeData.branches);
    const branchMat = createBranchMaterial();
    const { mesh, baseMatrices } = createLeafData(treeData.leaves, clearing);
    return { canopyBranchGeo, branchMat, leafMesh: mesh, leafBaseMatrices: baseMatrices };
  }, [spineLength, subBranchLength, clearing]);

  // Wind blows from bottom to top in viewport (positive Z in world space)
  const windDir = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  // Leaf flutter axis — perpendicular to wind for a tilting motion
  const flutterAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  useFrame(({ clock }) => {
    const dark = isDarkMode();
    const lerpSpeed = dark ? COLOR_LERP_SPEED_TO_DARK : COLOR_LERP_SPEED_TO_LIGHT;

    // Stretch leaf silhouettes along shadow direction in dark mode
    const targetX = dark ? LEAF_STRETCH_X_DARK : 1;
    const targetZ = dark ? LEAF_STRETCH_Z_DARK : 1;
    stretchX.current += (targetX - stretchX.current) * lerpSpeed;
    stretchZ.current += (targetZ - stretchZ.current) * lerpSpeed;

    // Darken leaf silhouettes
    const targetColor = dark ? LEAF_COLOR_DARK : LEAF_COLOR_LIGHT;
    leafColor.current.lerp(new THREE.Color(targetColor), lerpSpeed);
    (tree.leafMesh.material as THREE.MeshBasicMaterial).color.copy(leafColor.current);

    if (groupRef.current) {
      groupRef.current.scale.set(stretchX.current, TREE_SCALE, stretchZ.current);
    }

    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    const speed = WIND_SPEED / 10;

    // Whole canopy leans in wind direction with slow oscillation
    if (groupRef.current) {
      const sway = Math.sin(t * speed * 0.4) * WIND_AMPLITUDE;
      groupRef.current.rotation.x = sway * THREE.MathUtils.degToRad(0.6);
      groupRef.current.rotation.y = sway * THREE.MathUtils.degToRad(0.15);
    }

    // Per-leaf wind — coherent breeze + individual flutter
    for (let i = 0; i < tree.leafBaseMatrices.length; i++) {
      const phase = i * 0.05;
      // Coherent breeze — all leaves move in the same direction with slight phase delay
      const breeze = Math.sin(t * speed * 0.6 + phase) * 0.06;
      // Small individual flutter layered on top
      const flutter = Math.sin(t * speed * 2 + i * 1.7) * 0.02;

      // Rotate mainly around wind direction (lean with the breeze)
      _tempQuat.setFromAxisAngle(windDir, breeze);
      // Add subtle cross-axis flutter
      _tempQuat2.setFromAxisAngle(flutterAxis, flutter);
      _tempQuat.multiply(_tempQuat2);

      _windRotMatrix.makeRotationFromQuaternion(_tempQuat);
      _tempWindMatrix.copy(tree.leafBaseMatrices[i]);
      _tempWindMatrix.multiply(_windRotMatrix);
      tree.leafMesh.setMatrixAt(i, _tempWindMatrix);
    }
    tree.leafMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={TREE_SCALE}
    >
      <mesh geometry={tree.canopyBranchGeo} material={tree.branchMat} castShadow />
      <primitive object={tree.leafMesh} />
    </group>
  );
}

/** Directional light with dark-mode color lerping */
function SunLight({
  intensity,
  intensityDark,
  lightY,
  lightYDark,
  shadowFrustum,
  shadowBias,
  lerpToDark,
  lerpToLight,
}: {
  intensity: number;
  intensityDark: number;
  lightY: number;
  lightYDark: number;
  shadowFrustum: number;
  shadowBias: number;
  lerpToDark: number;
  lerpToLight: number;
}) {
  const dark = isDarkMode();
  const initColor = dark ? DIR_LIGHT_COLOR_DARK : DIR_LIGHT_COLOR_LIGHT;
  const initIntensity = dark ? intensityDark : intensity;
  const initY = dark ? lightYDark : lightY;
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetColor = useRef(new THREE.Color(initColor));
  const currentColor = useRef(new THREE.Color(initColor));
  const currentIntensity = useRef(initIntensity);
  const currentPos = useRef(new THREE.Vector3(LIGHT_POSITION[0], initY, LIGHT_POSITION[2]));
  const targetPos = useRef(new THREE.Vector3(LIGHT_POSITION[0], initY, LIGHT_POSITION[2]));
  const mobile = useMemo(() => isMobile(), []);
  const mapSize = mobile ? SHADOW_MAP_SIZE_MOBILE : SHADOW_MAP_SIZE;

  useFrame(() => {
    const dark = isDarkMode();
    targetColor.current.set(
      dark ? DIR_LIGHT_COLOR_DARK : DIR_LIGHT_COLOR_LIGHT,
    );
    const lerpSpeed = dark ? lerpToDark : lerpToLight;
    currentColor.current.lerp(targetColor.current, lerpSpeed);
    const targetIntensity = dark ? intensityDark : intensity;
    currentIntensity.current += (targetIntensity - currentIntensity.current) * lerpSpeed;
    targetPos.current.set(LIGHT_POSITION[0], dark ? lightYDark : lightY, LIGHT_POSITION[2]);
    currentPos.current.lerp(targetPos.current, lerpSpeed);
    if (lightRef.current) {
      lightRef.current.color.copy(currentColor.current);
      lightRef.current.intensity = currentIntensity.current;
      lightRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[LIGHT_POSITION[0], initY, LIGHT_POSITION[2]]}
      intensity={initIntensity}
      castShadow
      shadow-mapSize-width={mapSize}
      shadow-mapSize-height={mapSize}
      shadow-camera-left={-shadowFrustum}
      shadow-camera-right={shadowFrustum}
      shadow-camera-top={shadowFrustum}
      shadow-camera-bottom={-shadowFrustum}
      shadow-camera-near={LIGHT_SHADOW_CAMERA.near}
      shadow-camera-far={LIGHT_SHADOW_CAMERA.far}
      shadow-bias={shadowBias}
    />
  );
}

function AmbientLightColor({ intensity, lerpToDark, lerpToLight }: { intensity: number; lerpToDark: number; lerpToLight: number }) {
  const dark = isDarkMode();
  const initColor = dark ? AMBIENT_COLOR_DARK : AMBIENT_COLOR_LIGHT;
  const lightRef = useRef<THREE.AmbientLight>(null);
  const targetColor = useRef(new THREE.Color(initColor));
  const currentColor = useRef(new THREE.Color(initColor));

  useFrame(() => {
    const dark = isDarkMode();
    targetColor.current.set(dark ? AMBIENT_COLOR_DARK : AMBIENT_COLOR_LIGHT);
    const lerpSpeed = dark ? lerpToDark : lerpToLight;
    currentColor.current.lerp(targetColor.current, lerpSpeed);
    if (lightRef.current) {
      lightRef.current.color.copy(currentColor.current);
    }
  });

  return <ambientLight ref={lightRef} intensity={intensity} />;
}

export default function DappledLightScene({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const mobile = useMemo(() => isMobile(), []);

  const pcssSamples = mobile ? PCSS_SAMPLES_MOBILE : PCSS_SAMPLES;
  const pcssSize = mobile ? PCSS_SIZE_MOBILE : PCSS_SIZE;

  const clearing = useMemo<ClearingConfig>(() => ({
    center: [0, 0],
    radiusX: CLEARING_RADIUS_X,
    radiusZ: CLEARING_RADIUS_Z,
    strength: CLEARING_STRENGTH,
    treePosition: TREE_POSITION,
    lightPosition: LIGHT_POSITION,
  }), []);

  return (
    <>
      <CameraSetup />
      <SoftShadows focus={PCSS_FOCUS} samples={pcssSamples} size={pcssSize} />
      <AmbientLightColor intensity={AMBIENT_INTENSITY} lerpToDark={COLOR_LERP_SPEED_TO_DARK} lerpToLight={COLOR_LERP_SPEED_TO_LIGHT} />
      <SunLight
        intensity={LIGHT_INTENSITY}
        intensityDark={LIGHT_INTENSITY_DARK}
        lightY={LIGHT_POSITION[1]}
        lightYDark={LIGHT_POSITION_DARK[1]}
        shadowFrustum={LIGHT_SHADOW_CAMERA.right}
        shadowBias={SHADOW_BIAS}
        lerpToDark={COLOR_LERP_SPEED_TO_DARK}
        lerpToLight={COLOR_LERP_SPEED_TO_LIGHT}
      />
      <Ground lerpToDark={COLOR_LERP_SPEED_TO_DARK} lerpToLight={COLOR_LERP_SPEED_TO_LIGHT} />
      <TreeCanopy
        reducedMotion={reducedMotion}
        position={TREE_POSITION}
        spineLength={DEFAULT_SPINE_LENGTH}
        subBranchLength={DEFAULT_SUB_BRANCH_LENGTH}
        clearing={clearing}
      />
      <FrameThrottle reducedMotion={reducedMotion} />
    </>
  );
}
