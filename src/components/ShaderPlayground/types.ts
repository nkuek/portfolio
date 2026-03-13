export type ShaderPresetCategory = "basics" | "patterns" | "effects";

export type ShaderPreset = {
  name: string;
  category: ShaderPresetCategory;
  description: string;
  code: string;
};

export type UniformType = "float" | "vec2" | "vec3" | "vec4";

export type CustomUniform = {
  name: string;
  type: UniformType;
  /** Number of components: 1 for float, 2–4 for vectors */
  components: number;
  value: number[];
  min: number;
  max: number;
  step: number;
};

export type ShaderError = {
  line: number | null;
  message: string;
};
