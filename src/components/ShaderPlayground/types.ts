export type ShaderPresetCategory = "basics" | "patterns" | "effects";

export type ShaderPreset = {
  name: string;
  category: ShaderPresetCategory;
  description: string;
  code: string;
};

export type CustomUniform = {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
};

export type ShaderError = {
  line: number | null;
  message: string;
};
