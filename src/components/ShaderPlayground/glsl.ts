import { BUILT_IN_UNIFORMS } from "./constants";
import type { CustomUniform, ShaderError, UniformType } from "./types";

const COMPONENT_COUNT: Record<UniformType, number> = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
};

export function parseCustomUniforms(code: string): CustomUniform[] {
  // Strip comment-only lines so example uniforms in comments don't create sliders
  const strippedCode = code
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");

  const regex =
    /uniform\s+(float|vec[234])\s+(\w+)\s*;(?:\s*\/\/\s*range:\s*(-?[\d.]+)\s*,\s*(-?[\d.]+))?/g;
  const uniforms: CustomUniform[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(strippedCode)) !== null) {
    const type = match[1] as UniformType;
    const name = match[2];
    if (name && !BUILT_IN_UNIFORMS.has(name)) {
      const components = COMPONENT_COUNT[type];
      const hasRange = match[3] !== undefined && match[4] !== undefined;
      const min = hasRange ? parseFloat(match[3]) : 0;
      const max = hasRange ? parseFloat(match[4]) : type === "float" ? 10 : 1;
      const step = type === "float" && max > 1 ? 0.1 : 0.01;
      const defaultValue = Math.round(((min + max) / 2) * 100) / 100;
      uniforms.push({
        name,
        type,
        components,
        value: Array(components).fill(defaultValue) as number[],
        min,
        max,
        step,
      });
    }
  }

  return uniforms;
}

export function parseShaderErrors(
  errorLog: string,
  lineOffset = 0,
): ShaderError[] {
  const regex = /ERROR:\s*\d+:(\d+):\s*(.+)$/gm;
  const errors: ShaderError[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(errorLog)) !== null) {
    const lineStr = match[1];
    const message = match[2];
    if (!message) continue;

    const parsedLine = lineStr ? parseInt(lineStr, 10) : NaN;
    const line = Number.isNaN(parsedLine) ? null : parsedLine - lineOffset;

    errors.push({ line, message: message.trim() });
  }

  return errors;
}
