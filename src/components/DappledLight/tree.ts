import * as THREE from "three";
import { type TreeData } from "./lsystem";
import { LEAF_SIZE, LEAF_SUBDIVISIONS, LEAF_COLOR_LIGHT } from "./constants";
import { createLeafTexture } from "./leafTexture";

const _tempMatrix = new THREE.Matrix4();
const _tempQuat = new THREE.Quaternion();
const _tempVec = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Merge all branch segments into a single BufferGeometry.
 * Branches are invisible (opacity: 0) but cast shadows.
 */
export function createBranchGeometry(
  branches: TreeData["branches"],
  minLevel = 0,
  maxLevel = Infinity,
): THREE.BufferGeometry {
  const radialSegments = 8;
  const geos: THREE.BufferGeometry[] = [];

  for (const { start, end, radius, level } of branches) {
    if (level < minLevel || level > maxLevel) continue;
    const length = start.distanceTo(end);
    if (length < 0.001) continue;

    const geo = new THREE.CylinderGeometry(
      radius * 0.6,
      radius,
      length,
      radialSegments,
      1,
      true,
    );

    const mid = _tempVec.lerpVectors(start, end, 0.5);
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    _tempQuat.setFromUnitVectors(_up, dir);
    _tempMatrix.compose(mid, _tempQuat, new THREE.Vector3(1, 1, 1));
    geo.applyMatrix4(_tempMatrix);
    geos.push(geo);
  }

  if (geos.length === 0) return new THREE.BufferGeometry();

  const merged = mergeGeometries(geos);
  for (const g of geos) g.dispose();
  return merged;
}

/**
 * Create branch material — invisible in color pass but opaque in shadow depth pass.
 * colorWrite: false prevents any pixels in the main render.
 * NOT transparent, so Three.js shadow map treats it as opaque → casts shadows.
 */
export function createBranchMaterial(): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    colorWrite: false,
  });
  // Also hide from depth buffer in main render so it doesn't occlude ground
  mat.depthWrite = false;
  return mat;
}

export type ClearingConfig = {
  center: [number, number];
  radiusX: number;
  radiusZ: number;
  strength: number;
  treePosition: readonly [number, number, number];
  lightPosition: readonly [number, number, number];
};

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Create InstancedMesh of large leaf planes with alpha-mapped texture.
 * opacity: 0 makes them invisible; alphaMap controls shadow silhouette.
 *
 * When a clearing is provided, leaves whose projected shadow falls near the
 * clearing center are scaled down — thinning the canopy so light naturally
 * floods through where text lives.
 */
export function createLeafData(
  leaves: TreeData["leaves"],
  clearing?: ClearingConfig,
): { mesh: THREE.InstancedMesh; baseMatrices: THREE.Matrix4[] } {
  const leafTexture = createLeafTexture(256);
  const geo = new THREE.PlaneGeometry(
    LEAF_SIZE,
    LEAF_SIZE,
    LEAF_SUBDIVISIONS,
    LEAF_SUBDIVISIONS,
  );

  // Apply slight parabolic curvature for 3D shadow depth
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y) / (LEAF_SIZE * 0.5);
    pos.setZ(i, r * r * 0.8);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    map: leafTexture,
    alphaMap: leafTexture,
    alphaTest: 0.001,
    transparent: true,
    opacity: 0.04,
    color: new THREE.Color(LEAF_COLOR_LIGHT),
    side: THREE.DoubleSide,
  });

  const count = leaves.length;
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.castShadow = true;

  const baseMatrices: THREE.Matrix4[] = [];
  const rand = seededRandom(137);
  const scale = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const { position, normal } = leaves[i];

    const randomAxis = new THREE.Vector3(
      rand() - 0.5,
      rand() - 0.5,
      rand() - 0.5,
    ).normalize();
    const tiltAngle = rand() * Math.PI * 0.5;
    const q = new THREE.Quaternion().setFromUnitVectors(_up, normal);
    const randomTilt = new THREE.Quaternion().setFromAxisAngle(randomAxis, tiltAngle);
    q.multiply(randomTilt);

    let s = 0.4 + rand() * 1.0;

    if (clearing) {
      const wx = position.x + clearing.treePosition[0];
      const wy = position.y + clearing.treePosition[1];
      const wz = position.z + clearing.treePosition[2];

      // Project shadow onto ground along light direction
      const t = wy / clearing.lightPosition[1];
      const sx = wx - clearing.lightPosition[0] * t;
      const sz = wz - clearing.lightPosition[2] * t;

      const dx = (sx - clearing.center[0]) / clearing.radiusX;
      const dz = (sz - clearing.center[1]) / clearing.radiusZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const factor = smoothstep(0.3, 1.0, dist);
      s *= clearing.strength + (1 - clearing.strength) * factor;
    }

    scale.set(s, s, s);

    const mat = new THREE.Matrix4();
    mat.compose(position, q, scale);
    mesh.setMatrixAt(i, mat);
    baseMatrices.push(mat.clone());
  }

  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, baseMatrices };
}

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;

  for (const g of geos) {
    totalVerts += g.getAttribute("position").count;
    totalIndices += g.index ? g.index.count : 0;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (const g of geos) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const norm = g.getAttribute("normal") as THREE.BufferAttribute;
    const idx = g.index;

    positions.set(pos.array as Float32Array, vertOffset * 3);
    normals.set(norm.array as Float32Array, vertOffset * 3);

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices[idxOffset + i] = idx.array[i] + vertOffset;
      }
      idxOffset += idx.count;
    }

    vertOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  if (totalIndices > 0) {
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  return merged;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
