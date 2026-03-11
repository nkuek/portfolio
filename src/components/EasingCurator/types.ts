export type BezierCurve = { x1: number; y1: number; x2: number; y2: number };

export type SpringConfig = {
  mass: number;
  stiffness: number;
  damping: number;
};

export type PreviewType =
  | "translate"
  | "scale"
  | "opacity"
  | "rotate"
  | "combined";

export type PresetCategory =
  | "standard"
  | "site"
  | "material"
  | "apple"
  | "common"
  | "spring";

export type Preset = {
  name: string;
  curve: BezierCurve;
  category: PresetCategory;
};
