import type { Preset, PresetCategory } from "./types";

export const PRESETS: Preset[] = [
  // Standard CSS
  {
    name: "linear",
    curve: { x1: 0, y1: 0, x2: 1, y2: 1 },
    category: "standard",
  },
  {
    name: "ease",
    curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    category: "standard",
  },
  {
    name: "ease-in",
    curve: { x1: 0.42, y1: 0, x2: 1, y2: 1 },
    category: "standard",
  },
  {
    name: "ease-out",
    curve: { x1: 0, y1: 0, x2: 0.58, y2: 1 },
    category: "standard",
  },
  {
    name: "ease-in-out",
    curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
    category: "standard",
  },

  // Site (from globals.css)
  {
    name: "spring",
    curve: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
    category: "site",
  },
  {
    name: "smooth",
    curve: { x1: 0.2, y1: 0.8, x2: 0.2, y2: 1 },
    category: "site",
  },
  {
    name: "elastic",
    curve: { x1: 0.5, y1: 1.25, x2: 0.75, y2: 1.25 },
    category: "site",
  },
  {
    name: "elastic-strong",
    curve: { x1: 0.5, y1: 1.5, x2: 0.75, y2: 1.25 },
    category: "site",
  },
  {
    name: "out-strong",
    curve: { x1: 0, y1: 0, x2: 0, y2: 1 },
    category: "site",
  },
  {
    name: "standard",
    curve: { x1: 0.25, y1: 0, x2: 0.3, y2: 1 },
    category: "site",
  },

  // Material Design
  {
    name: "md-standard",
    curve: { x1: 0.2, y1: 0, x2: 0, y2: 1 },
    category: "material",
  },
  {
    name: "md-decelerate",
    curve: { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 },
    category: "material",
  },
  {
    name: "md-accelerate",
    curve: { x1: 0.3, y1: 0, x2: 0.8, y2: 0.15 },
    category: "material",
  },

  // Apple
  {
    name: "apple-default",
    curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    category: "apple",
  },
  {
    name: "apple-spring",
    curve: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
    category: "apple",
  },
  {
    name: "apple-bounce",
    curve: { x1: 0.5, y1: 1.8, x2: 0.8, y2: 0.8 },
    category: "apple",
  },

  // Common
  {
    name: "back-in-out",
    curve: { x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6 },
    category: "common",
  },
  {
    name: "circ-out",
    curve: { x1: 0, y1: 0.55, x2: 0.45, y2: 1 },
    category: "common",
  },
  {
    name: "expo-out",
    curve: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
    category: "common",
  },
  {
    name: "quint-out",
    curve: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
    category: "common",
  },
  {
    name: "quart-out",
    curve: { x1: 0.25, y1: 1, x2: 0.5, y2: 1 },
    category: "common",
  },
  {
    name: "back-out",
    curve: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
    category: "common",
  },
];

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  standard: "Standard CSS",
  site: "Site Easings",
  material: "Material Design",
  apple: "Apple",
  common: "Common",
  spring: "Spring Physics",
};

export const DEFAULT_CURVE =
  PRESETS.find((p) => p.name === "spring")?.curve ?? {
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
  };
export const DEFAULT_DURATION = 1000;
