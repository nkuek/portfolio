import type { KeyframeProperty, PropertyMask } from "./types";

export const DEFAULT_PROPERTIES: KeyframeProperty = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
  backgroundColor: "#6366f1",
};

export const DEFAULT_MASK: PropertyMask = {
  translateX: false,
  translateY: false,
  scale: false,
  rotate: false,
  opacity: true,
  backgroundColor: false,
};

export const PROPERTY_RANGES = {
  translateX: { min: -200, max: 200, step: 1, unit: "px" },
  translateY: { min: -200, max: 200, step: 1, unit: "px" },
  scale: { min: 0, max: 3, step: 0.01, unit: "" },
  rotate: { min: -360, max: 360, step: 1, unit: "deg" },
  opacity: { min: 0, max: 1, step: 0.01, unit: "" },
} as const;

export const EASING_PRESETS: Record<string, string> = {
  linear: "linear",
  ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
  "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)",
  spring: "cubic-bezier(0.16, 1, 0.3, 1)",
  smooth: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  "md-standard": "cubic-bezier(0.2, 0, 0, 1)",
  "md-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
  "md-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
  "apple-spring": "cubic-bezier(0.22, 1, 0.36, 1)",
  "back-in-out": "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  "back-out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
};

export const DEFAULT_EASING = "ease";
export const DEFAULT_EASING_VALUE =
  EASING_PRESETS[DEFAULT_EASING] ?? "cubic-bezier(0.25, 0.1, 0.25, 1)";

const CUBIC_BEZIER_RE =
  /cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/;

/** Parse a CSS cubic-bezier() string into 4 control-point numbers. Returns null for non-bezier values. */
export function parseCubicBezier(
  easing: string,
): [number, number, number, number] | null {
  const match = easing.match(CUBIC_BEZIER_RE);
  if (!match) return null;
  return [
    parseFloat(match[1] ?? "0"),
    parseFloat(match[2] ?? "0"),
    parseFloat(match[3] ?? "0"),
    parseFloat(match[4] ?? "0"),
  ];
}
