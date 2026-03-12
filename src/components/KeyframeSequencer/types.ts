export type KeyframeProperty = {
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
  opacity: number;
  backgroundColor: string;
};

export type PropertyMask = Record<keyof KeyframeProperty, boolean>;

export type KeyframeStop = {
  id: string;
  offset: number; // 0–100
  properties: KeyframeProperty;
  mask: PropertyMask;
};

export type SegmentEasing = {
  fromId: string;
  toId: string;
  easing: string; // CSS value like "cubic-bezier(0.25, 0.1, 0.25, 1)"
  easingName: string; // display name like "ease"
};

export type PreviewShape = "box" | "circle" | "text";
export type PlaybackState = "playing" | "paused";
export type AnimationDirection =
  | "normal"
  | "reverse"
  | "alternate"
  | "alternate-reverse";
export type FillMode = "none" | "forwards" | "backwards" | "both";
export type ExportFormat =
  | "css-keyframes"
  | "css-animation"
  | "tailwind"
  | "framer-motion";

export type AnimationPresetCategory =
  | "entrance"
  | "exit"
  | "emphasis"
  | "motion";

export type AnimationPreset = {
  name: string;
  category: AnimationPresetCategory;
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasing[];
  duration: number;
};
