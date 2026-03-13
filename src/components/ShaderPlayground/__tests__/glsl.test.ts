import { describe, it, expect } from "vitest";
import { parseCustomUniforms, parseShaderErrors } from "../glsl";

describe("parseCustomUniforms", () => {
  it("parses a single custom float uniform", () => {
    const code = "uniform float brightness;";
    const result = parseCustomUniforms(code);
    expect(result).toEqual([
      {
        name: "brightness",
        type: "float",
        components: 1,
        value: [5],
        min: 0,
        max: 10,
        step: 0.1,
      },
    ]);
  });

  it("parses multiple custom uniforms", () => {
    const code = `
uniform float brightness;
uniform float contrast;
`;
    const result = parseCustomUniforms(code);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("brightness");
    expect(result[1]?.name).toBe("contrast");
  });

  it("parses range comments", () => {
    const code = "uniform float scale; // range: 0.5, 3.0";
    const result = parseCustomUniforms(code);
    expect(result).toEqual([
      {
        name: "scale",
        type: "float",
        components: 1,
        value: [1.75],
        min: 0.5,
        max: 3.0,
        step: 0.1,
      },
    ]);
  });

  it("uses default range when no comment is present", () => {
    const code = "uniform float opacity;";
    const result = parseCustomUniforms(code);
    expect(result[0]?.min).toBe(0);
    expect(result[0]?.max).toBe(10);
  });

  it("skips built-in uniforms", () => {
    const code = `
uniform float u_time;
uniform vec2 u_resolution;
uniform float brightness;
`;
    const result = parseCustomUniforms(code);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("brightness");
  });

  it("returns empty array when no uniforms found", () => {
    const code = `
void main() {
  gl_FragColor = vec4(1.0);
}
`;
    const result = parseCustomUniforms(code);
    expect(result).toEqual([]);
  });

  it("parses vec2 uniforms", () => {
    const code = "uniform vec2 offset; // range: -1, 1";
    const result = parseCustomUniforms(code);
    expect(result).toEqual([
      {
        name: "offset",
        type: "vec2",
        components: 2,
        value: [0, 0],
        min: -1,
        max: 1,
        step: 0.01,
      },
    ]);
  });

  it("parses vec3 uniforms", () => {
    const code = "uniform vec3 color;";
    const result = parseCustomUniforms(code);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("vec3");
    expect(result[0]?.components).toBe(3);
    expect(result[0]?.value).toEqual([0.5, 0.5, 0.5]);
  });

  it("parses vec4 uniforms", () => {
    const code = "uniform vec4 tint;";
    const result = parseCustomUniforms(code);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("vec4");
    expect(result[0]?.components).toBe(4);
  });

  it("parses mixed float and vector uniforms", () => {
    const code = `
uniform float brightness;
uniform vec3 color;
`;
    const result = parseCustomUniforms(code);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("brightness");
    expect(result[0]?.type).toBe("float");
    expect(result[1]?.name).toBe("color");
    expect(result[1]?.type).toBe("vec3");
  });
});

describe("parseShaderErrors", () => {
  it("parses a single error", () => {
    const log = "ERROR: 0:5: 'foo' : undeclared identifier";
    const result = parseShaderErrors(log);
    expect(result).toEqual([
      { line: 5, message: "'foo' : undeclared identifier" },
    ]);
  });

  it("parses multiple errors", () => {
    const log = `ERROR: 0:3: 'x' : undeclared identifier
ERROR: 0:7: 'y' : syntax error`;
    const result = parseShaderErrors(log);
    expect(result).toHaveLength(2);
    expect(result[0]?.line).toBe(3);
    expect(result[1]?.line).toBe(7);
  });

  it("applies lineOffset", () => {
    const log = "ERROR: 0:10: 'foo' : undeclared identifier";
    const result = parseShaderErrors(log, 3);
    expect(result[0]?.line).toBe(7);
  });

  it("returns empty array when no errors found", () => {
    const log = "Compilation successful";
    const result = parseShaderErrors(log);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const result = parseShaderErrors("");
    expect(result).toEqual([]);
  });

  it("handles errors with different shader column format", () => {
    const log = "ERROR: 1:12: 'return' : wrong operand types";
    const result = parseShaderErrors(log);
    expect(result).toEqual([
      { line: 12, message: "'return' : wrong operand types" },
    ]);
  });
});
