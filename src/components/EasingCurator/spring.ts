import type { SpringConfig } from "./types";

export type SpringResult = {
  samples: number[];
  velocities: number[];
  accelerations: number[];
  settleMs: number;
};

const TIMESTEP = 1 / 240;
const SETTLE_THRESHOLD = 0.001;
const MAX_SECONDS = 10;

export function simulateSpring(config: SpringConfig): SpringResult {
  const { mass, stiffness, damping } = config;

  let pos = 0;
  let vel = 0;
  let time = 0;
  let settleTime = 0;
  let settled = false;

  const initAccel = stiffness / mass; // F = -k*(0-1)/m at rest
  const raw: { t: number; v: number; vel: number; acc: number }[] = [
    { t: 0, v: 0, vel: 0, acc: initAccel },
  ];

  while (time < MAX_SECONDS) {
    const accel = (-stiffness * (pos - 1) - damping * vel) / mass;
    vel += accel * TIMESTEP;
    pos += vel * TIMESTEP;
    time += TIMESTEP;

    raw.push({ t: time, v: pos, vel, acc: accel });

    if (!settled) {
      if (
        Math.abs(pos - 1) < SETTLE_THRESHOLD &&
        Math.abs(vel) < SETTLE_THRESHOLD
      ) {
        settleTime = time;
        settled = true;
        break;
      }
    }
  }

  if (!settled) {
    settleTime = MAX_SECONDS;
  }

  // Downsample to 100 evenly-spaced points across [0, settleTime]
  const numSamples = 100;
  const samples: number[] = [];
  const velocities: number[] = [];
  const accelerations: number[] = [];
  let rawIdx = 0;

  for (let i = 0; i <= numSamples; i++) {
    const targetTime = (i / numSamples) * settleTime;

    while (rawIdx < raw.length - 1 && (raw[rawIdx + 1]?.t ?? Infinity) < targetTime) {
      rawIdx++;
    }

    const a = raw[rawIdx];
    const b = raw[rawIdx + 1];
    if (!a || !b) {
      const last = raw[raw.length - 1];
      samples.push(last?.v ?? 1);
      velocities.push(last?.vel ?? 0);
      accelerations.push(last?.acc ?? 0);
    } else {
      const frac = b.t === a.t ? 0 : (targetTime - a.t) / (b.t - a.t);
      samples.push(a.v + frac * (b.v - a.v));
      velocities.push(a.vel + frac * (b.vel - a.vel));
      accelerations.push(a.acc + frac * (b.acc - a.acc));
    }
  }

  return {
    samples,
    velocities,
    accelerations,
    settleMs: Math.round(settleTime * 1000),
  };
}

export function springToLinearEasing(samples: number[]): string {
  const values = samples.map((v) => Number(v.toFixed(3)));
  return `linear(${values.join(", ")})`;
}

export type SpringPresetEntry = {
  name: string;
  config: SpringConfig;
};

export const SPRING_PRESETS: SpringPresetEntry[] = [
  { name: "gentle", config: { mass: 1, stiffness: 100, damping: 15 } },
  { name: "default", config: { mass: 1, stiffness: 100, damping: 10 } },
  { name: "bouncy", config: { mass: 1, stiffness: 180, damping: 12 } },
  { name: "snappy", config: { mass: 1, stiffness: 300, damping: 20 } },
  { name: "slow", config: { mass: 1, stiffness: 60, damping: 10 } },
  { name: "stiff", config: { mass: 1, stiffness: 400, damping: 28 } },
  { name: "wobbly", config: { mass: 1, stiffness: 180, damping: 8 } },
  { name: "heavy", config: { mass: 3, stiffness: 200, damping: 18 } },
];

export const DEFAULT_SPRING_CONFIG: SpringConfig =
  SPRING_PRESETS.find((p) => p.name === "default")?.config ?? {
    mass: 1,
    stiffness: 100,
    damping: 10,
  };
