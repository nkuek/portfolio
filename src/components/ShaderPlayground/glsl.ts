import { BUILT_IN_UNIFORMS } from "./constants";
import type { CustomUniform, ShaderError } from "./types";

export function parseCustomUniforms(code: string): CustomUniform[] {
  const regex =
    /uniform\s+float\s+(\w+)\s*;(?:\s*\/\/\s*range:\s*([\d.]+)\s*,\s*([\d.]+))?/g;
  const uniforms: CustomUniform[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const name = match[1];
    if (name && !BUILT_IN_UNIFORMS.has(name)) {
      const min = match[2] !== undefined ? parseFloat(match[2]) : 0;
      const max = match[3] !== undefined ? parseFloat(match[3]) : 1;
      uniforms.push({ name, value: min, min, max, step: 0.01 });
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
