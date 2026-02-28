import * as THREE from "three";
import {
  LSYSTEM_RADIUS_START,
  LSYSTEM_RADIUS_DECAY,
  LSYSTEM_SEED,
  LEAVES_PER_TIP,
  LEAF_SIZE,
} from "./constants";

export type BranchSegment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  level: number;
};

export type LeafPosition = {
  position: THREE.Vector3;
  normal: THREE.Vector3;
};

export type TreeData = {
  branches: BranchSegment[];
  leaves: LeafPosition[];
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Spine defaults ── */
export const DEFAULT_SPINE_LENGTH = 50;
export const DEFAULT_SUB_BRANCH_LENGTH = 6;

const SPINE_SEGMENTS = 12;
const SUB_BRANCH_DECAY = 0.55;
const SUB_BRANCH_MAX_LEVEL = 3;

const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3(1, 0, 0);

export type TreeOptions = {
  seed?: number;
  spineLength?: number;
  subBranchLength?: number;
};

/**
 * Spine-based tree: long main branches run left across the viewport,
 * with smaller sub-branches and leaves growing off them at intervals.
 */
export function generateTree(opts?: TreeOptions): TreeData {
  const rand = seededRandom(opts?.seed ?? LSYSTEM_SEED);
  const spineLength = opts?.spineLength ?? DEFAULT_SPINE_LENGTH;
  const subBranchLen = opts?.subBranchLength ?? DEFAULT_SUB_BRANCH_LENGTH;
  const branches: BranchSegment[] = [];
  const leaves: LeafPosition[] = [];

  const spines = [
    new THREE.Vector3(-0.96, 0.05, 0.02),
    new THREE.Vector3(-0.92, 0.04, 0.30),
    new THREE.Vector3(-0.94, 0.06, -0.24),
  ];

  for (const dir of spines) {
    dir.normalize();
    generateSpine(new THREE.Vector3(0, 0, 0), dir, spineLength, subBranchLen, rand, branches, leaves);
  }

  return { branches, leaves };
}

/**
 * Generate a single long spine branch with sub-branches growing off it.
 * The spine gently curves as it extends across the viewport.
 */
function generateSpine(
  origin: THREE.Vector3,
  baseDir: THREE.Vector3,
  spineLength: number,
  subBranchLen: number,
  rand: () => number,
  branches: BranchSegment[],
  leaves: LeafPosition[],
) {
  const segLen = spineLength / SPINE_SEGMENTS;
  let pos = origin.clone();
  let dir = baseDir.clone();

  for (let s = 0; s < SPINE_SEGMENTS; s++) {
    const t = s / SPINE_SEGMENTS;
    const radius = LSYSTEM_RADIUS_START * (1 - t * 0.6);
    const end = pos.clone().addScaledVector(dir, segLen);

    branches.push({ start: pos.clone(), end: end.clone(), radius, level: 0 });

    // Spawn sub-branches at each joint (skip first — too close to off-screen origin)
    if (s >= 1) {
      const numSub = s % 3 === 0 ? 3 : 2;
      for (let b = 0; b < numSub; b++) {
        const subDir = randomBranchDir(dir, rand);
        growSubBranch(
          end, subDir,
          subBranchLen * (0.8 + rand() * 0.4),
          radius * 0.5,
          1, rand, branches, leaves,
        );
      }
    }

    // Gentle spine curvature — keep nearly horizontal (minimal Y drift)
    dir = dir.clone();
    dir.x += (rand() - 0.5) * 0.06;
    dir.y += (rand() - 0.5) * 0.005;
    dir.z += (rand() - 0.5) * 0.06;
    dir.normalize();

    pos = end;
  }
}

/**
 * Recursive sub-branch growing off a spine or parent sub-branch.
 */
function growSubBranch(
  start: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  radius: number,
  level: number,
  rand: () => number,
  branches: BranchSegment[],
  leaves: LeafPosition[],
) {
  const end = start.clone().addScaledVector(direction, length);
  branches.push({ start: start.clone(), end: end.clone(), radius, level });

  // Terminal — spawn leaves
  if (level >= SUB_BRANCH_MAX_LEVEL) {
    for (let i = 0; i < LEAVES_PER_TIP; i++) {
      const spread = LEAF_SIZE * 3;
      leaves.push({
        position: end.clone().add(new THREE.Vector3(
          (rand() - 0.5) * spread,
          (rand() - 0.5) * spread * 0.5,
          (rand() - 0.5) * spread,
        )),
        normal: direction.clone(),
      });
    }
    return;
  }

  // Penultimate level — also spawn a leaf for varied shadow depth
  if (level >= SUB_BRANCH_MAX_LEVEL - 1) {
    const spread = LEAF_SIZE * 2.5;
    leaves.push({
      position: end.clone().add(new THREE.Vector3(
        (rand() - 0.5) * spread,
        (rand() - 0.5) * spread * 0.3,
        (rand() - 0.5) * spread,
      )),
      normal: direction.clone(),
    });
  }

  // Spawn children
  const numChildren = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < numChildren; i++) {
    const childDir = randomBranchDir(direction, rand);
    growSubBranch(
      end, childDir,
      length * SUB_BRANCH_DECAY,
      radius * LSYSTEM_RADIUS_DECAY,
      level + 1,
      rand, branches, leaves,
    );
  }
}

/**
 * Generate a random child direction that deviates from the parent.
 */
function randomBranchDir(
  parentDir: THREE.Vector3,
  rand: () => number,
): THREE.Vector3 {
  const perp = new THREE.Vector3();
  if (Math.abs(parentDir.y) < 0.9) {
    perp.crossVectors(parentDir, _up).normalize();
  } else {
    perp.crossVectors(parentDir, _right).normalize();
  }

  const baseAngle = rand() * Math.PI * 2;
  const rotQuat = new THREE.Quaternion().setFromAxisAngle(parentDir, baseAngle);
  perp.applyQuaternion(rotQuat);

  const spreadAngle = 0.4 + rand() * 0.6;
  const tiltQuat = new THREE.Quaternion().setFromAxisAngle(perp, spreadAngle);
  const dir = parentDir.clone().applyQuaternion(tiltQuat).normalize();

  dir.x += (rand() - 0.5) * 0.15;
  dir.y += (rand() - 0.5) * 0.1;
  dir.z += (rand() - 0.5) * 0.15;
  dir.normalize();

  return dir;
}
