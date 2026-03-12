import type {
  AnimationPreset,
  AnimationPresetCategory,
  KeyframeStop,
  SegmentEasing,
  KeyframeProperty,
  PropertyMask,
} from "./types";
import { DEFAULT_PROPERTIES, EASING_PRESETS } from "./constants";

let presetCounter = 0;
function presetId(): string {
  return `preset-${presetCounter++}`;
}

const allOff: PropertyMask = {
  translateX: false,
  translateY: false,
  scale: false,
  rotate: false,
  opacity: false,
  backgroundColor: false,
};

function mask(keys: Array<keyof KeyframeProperty>): PropertyMask {
  const m = { ...allOff };
  for (const k of keys) {
    m[k] = true;
  }
  return m;
}

function props(overrides: Partial<KeyframeProperty>): KeyframeProperty {
  return { ...DEFAULT_PROPERTIES, ...overrides };
}

function kf(
  offset: number,
  properties: KeyframeProperty,
  propertyMask: PropertyMask,
): KeyframeStop {
  return { id: presetId(), offset, properties, mask: propertyMask };
}

function easings(
  keyframes: KeyframeStop[],
  easingNames: string[],
): SegmentEasing[] {
  const result: SegmentEasing[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (!from || !to) continue;
    const name = easingNames[i] ?? "ease";
    result.push({
      fromId: from.id,
      toId: to.id,
      easing: EASING_PRESETS[name] ?? name,
      easingName: name,
    });
  }
  return result;
}

// ── Entrance presets ──────────────────────────────────────────────────

const fadeInKf = [
  kf(0, props({ opacity: 0 }), mask(["opacity"])),
  kf(100, props({ opacity: 1 }), mask(["opacity"])),
];
const fadeIn: AnimationPreset = {
  name: "fadeIn",
  category: "entrance",
  keyframes: fadeInKf,
  segmentEasings: easings(fadeInKf, ["ease-out"]),
  duration: 800,
};

const fadeInUpKf = [
  kf(0, props({ opacity: 0, translateY: 20 }), mask(["opacity", "translateY"])),
  kf(100, props({ opacity: 1, translateY: 0 }), mask(["opacity", "translateY"])),
];
const fadeInUp: AnimationPreset = {
  name: "fadeInUp",
  category: "entrance",
  keyframes: fadeInUpKf,
  segmentEasings: easings(fadeInUpKf, ["spring"]),
  duration: 800,
};

const fadeInDownKf = [
  kf(0, props({ opacity: 0, translateY: -20 }), mask(["opacity", "translateY"])),
  kf(100, props({ opacity: 1, translateY: 0 }), mask(["opacity", "translateY"])),
];
const fadeInDown: AnimationPreset = {
  name: "fadeInDown",
  category: "entrance",
  keyframes: fadeInDownKf,
  segmentEasings: easings(fadeInDownKf, ["spring"]),
  duration: 800,
};

const slideInLeftKf = [
  kf(0, props({ translateX: -100 }), mask(["translateX"])),
  kf(100, props({ translateX: 0 }), mask(["translateX"])),
];
const slideInLeft: AnimationPreset = {
  name: "slideInLeft",
  category: "entrance",
  keyframes: slideInLeftKf,
  segmentEasings: easings(slideInLeftKf, ["spring"]),
  duration: 600,
};

const slideInRightKf = [
  kf(0, props({ translateX: 100 }), mask(["translateX"])),
  kf(100, props({ translateX: 0 }), mask(["translateX"])),
];
const slideInRight: AnimationPreset = {
  name: "slideInRight",
  category: "entrance",
  keyframes: slideInRightKf,
  segmentEasings: easings(slideInRightKf, ["spring"]),
  duration: 600,
};

const scaleInKf = [
  kf(0, props({ scale: 0, opacity: 0 }), mask(["scale", "opacity"])),
  kf(100, props({ scale: 1, opacity: 1 }), mask(["scale", "opacity"])),
];
const scaleIn: AnimationPreset = {
  name: "scaleIn",
  category: "entrance",
  keyframes: scaleInKf,
  segmentEasings: easings(scaleInKf, ["back-out"]),
  duration: 500,
};

// ── Exit presets ──────────────────────────────────────────────────────

const fadeOutKf = [
  kf(0, props({ opacity: 1 }), mask(["opacity"])),
  kf(100, props({ opacity: 0 }), mask(["opacity"])),
];
const fadeOut: AnimationPreset = {
  name: "fadeOut",
  category: "exit",
  keyframes: fadeOutKf,
  segmentEasings: easings(fadeOutKf, ["ease-in"]),
  duration: 600,
};

const fadeOutDownKf = [
  kf(0, props({ opacity: 1, translateY: 0 }), mask(["opacity", "translateY"])),
  kf(100, props({ opacity: 0, translateY: 20 }), mask(["opacity", "translateY"])),
];
const fadeOutDown: AnimationPreset = {
  name: "fadeOutDown",
  category: "exit",
  keyframes: fadeOutDownKf,
  segmentEasings: easings(fadeOutDownKf, ["ease-in"]),
  duration: 600,
};

const slideOutLeftKf = [
  kf(0, props({ translateX: 0 }), mask(["translateX"])),
  kf(100, props({ translateX: -100 }), mask(["translateX"])),
];
const slideOutLeft: AnimationPreset = {
  name: "slideOutLeft",
  category: "exit",
  keyframes: slideOutLeftKf,
  segmentEasings: easings(slideOutLeftKf, ["ease-in"]),
  duration: 500,
};

const slideOutRightKf = [
  kf(0, props({ translateX: 0 }), mask(["translateX"])),
  kf(100, props({ translateX: 100 }), mask(["translateX"])),
];
const slideOutRight: AnimationPreset = {
  name: "slideOutRight",
  category: "exit",
  keyframes: slideOutRightKf,
  segmentEasings: easings(slideOutRightKf, ["ease-in"]),
  duration: 500,
};

// ── Emphasis presets ──────────────────────────────────────────────────

const pulseKf = [
  kf(0, props({ scale: 1 }), mask(["scale"])),
  kf(50, props({ scale: 1.05 }), mask(["scale"])),
  kf(100, props({ scale: 1 }), mask(["scale"])),
];
const pulse: AnimationPreset = {
  name: "pulse",
  category: "emphasis",
  keyframes: pulseKf,
  segmentEasings: easings(pulseKf, ["ease-in-out", "ease-in-out"]),
  duration: 600,
};

const shakeKf = [
  kf(0, props({ translateX: 0 }), mask(["translateX"])),
  kf(25, props({ translateX: -10 }), mask(["translateX"])),
  kf(50, props({ translateX: 10 }), mask(["translateX"])),
  kf(75, props({ translateX: -10 }), mask(["translateX"])),
  kf(100, props({ translateX: 0 }), mask(["translateX"])),
];
const shake: AnimationPreset = {
  name: "shake",
  category: "emphasis",
  keyframes: shakeKf,
  segmentEasings: easings(shakeKf, [
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
  ]),
  duration: 500,
};

const bounceKf = [
  kf(0, props({ translateY: 0 }), mask(["translateY"])),
  kf(30, props({ translateY: -30 }), mask(["translateY"])),
  kf(50, props({ translateY: 0 }), mask(["translateY"])),
  kf(70, props({ translateY: -15 }), mask(["translateY"])),
  kf(100, props({ translateY: 0 }), mask(["translateY"])),
];
const bounce: AnimationPreset = {
  name: "bounce",
  category: "emphasis",
  keyframes: bounceKf,
  segmentEasings: easings(bounceKf, [
    "ease-out",
    "ease-in",
    "ease-out",
    "ease-in",
  ]),
  duration: 800,
};

const heartbeatKf = [
  kf(0, props({ scale: 1 }), mask(["scale"])),
  kf(25, props({ scale: 1.3 }), mask(["scale"])),
  kf(50, props({ scale: 1 }), mask(["scale"])),
  kf(75, props({ scale: 1.3 }), mask(["scale"])),
  kf(100, props({ scale: 1 }), mask(["scale"])),
];
const heartbeat: AnimationPreset = {
  name: "heartbeat",
  category: "emphasis",
  keyframes: heartbeatKf,
  segmentEasings: easings(heartbeatKf, [
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
  ]),
  duration: 1000,
};

// ── Motion presets ────────────────────────────────────────────────────

const spinKf = [
  kf(0, props({ rotate: 0 }), mask(["rotate"])),
  kf(100, props({ rotate: 360 }), mask(["rotate"])),
];
const spin: AnimationPreset = {
  name: "spin",
  category: "motion",
  keyframes: spinKf,
  segmentEasings: easings(spinKf, ["linear"]),
  duration: 1000,
};

const wiggleKf = [
  kf(0, props({ rotate: 0 }), mask(["rotate"])),
  kf(25, props({ rotate: -15 }), mask(["rotate"])),
  kf(50, props({ rotate: 15 }), mask(["rotate"])),
  kf(75, props({ rotate: -7 }), mask(["rotate"])),
  kf(100, props({ rotate: 0 }), mask(["rotate"])),
];
const wiggle: AnimationPreset = {
  name: "wiggle",
  category: "motion",
  keyframes: wiggleKf,
  segmentEasings: easings(wiggleKf, [
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
    "ease-in-out",
  ]),
  duration: 500,
};

// ── Exports ───────────────────────────────────────────────────────────

export const PRESETS: AnimationPreset[] = [
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  fadeOut,
  fadeOutDown,
  slideOutLeft,
  slideOutRight,
  pulse,
  shake,
  bounce,
  heartbeat,
  spin,
  wiggle,
];

export const CATEGORY_LABELS: Record<AnimationPresetCategory, string> = {
  entrance: "Entrance",
  exit: "Exit",
  emphasis: "Emphasis",
  motion: "Motion",
};
