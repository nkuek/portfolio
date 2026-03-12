import { describe, it, expect } from "vitest";
import {
  formatRawGLSL,
  formatThreeJS,
  formatTSL,
  formatShadertoy,
} from "../ExportPanel/formatters";

const SAMPLE_SHADER = `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec3 color = vec3(vUv.x, vUv.y, 0.5 + 0.5 * sin(u_time));
  gl_FragColor = vec4(color, 1.0);
}`;

describe("formatRawGLSL", () => {
  it("prepends precision declaration", () => {
    const result = formatRawGLSL(SAMPLE_SHADER);
    expect(result).toMatch(/^precision mediump float;/);
    expect(result).toContain(SAMPLE_SHADER);
  });

  it("prepends precision to empty string", () => {
    expect(formatRawGLSL("")).toBe("precision mediump float;\n");
  });
});

describe("formatThreeJS", () => {
  it("wraps code in ShaderMaterial constructor", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("new THREE.ShaderMaterial");
  });

  it("includes u_time uniform", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("u_time: { value: 0 }");
  });

  it("includes u_resolution uniform", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("u_resolution: { value: new THREE.Vector2() }");
  });

  it("includes u_mouse uniform", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("u_mouse: { value: new THREE.Vector2() }");
  });

  it("includes the fragment shader code", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("fragmentShader:");
    expect(result).toContain("gl_FragColor");
  });

  it("includes a vertex shader passthrough", () => {
    const result = formatThreeJS(SAMPLE_SHADER);
    expect(result).toContain("vertexShader:");
    expect(result).toContain("vUv = uv");
  });
});

describe("formatTSL", () => {
  it("wraps code in Fn() and MeshBasicNodeMaterial", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).toContain("const shader = Fn(() => {");
    expect(result).toContain("MeshBasicNodeMaterial");
    expect(result).toContain("material.colorNode = shader()");
  });

  it("imports from three/tsl", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).toContain('from "three/tsl"');
  });

  it("replaces u_time with timerLocal", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).toContain("timerLocal");
    expect(result).not.toContain("u_time");
  });

  it("replaces vUv with uv()", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).toContain("uv()");
    expect(result).not.toContain("vUv");
  });

  it("replaces gl_FragColor with return", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).toContain("return vec4(");
    expect(result).not.toContain("gl_FragColor");
  });

  it("removes uniform and varying declarations", () => {
    const result = formatTSL(SAMPLE_SHADER);
    expect(result).not.toMatch(/^uniform\s+/m);
    expect(result).not.toMatch(/^varying\s+/m);
  });
});

describe("formatShadertoy", () => {
  it("replaces u_time with iTime", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).toContain("iTime");
    expect(result).not.toContain("u_time");
  });

  it("replaces u_resolution with iResolution.xy", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).toContain("iResolution.xy");
    expect(result).not.toContain("u_resolution");
  });

  it("replaces gl_FragColor with fragColor", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).toContain("fragColor");
    expect(result).not.toContain("gl_FragColor");
  });

  it("replaces void main() with mainImage signature", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).toContain(
      "void mainImage(out vec4 fragColor, in vec2 fragCoord)",
    );
    expect(result).not.toMatch(/void\s+main\s*\(\s*\)/);
  });

  it("removes precision declaration", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).not.toContain("precision mediump float");
  });

  it("removes uniform declarations", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).not.toMatch(/uniform\s+/);
  });

  it("removes varying declarations", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).not.toMatch(/varying\s+/);
  });

  it("replaces vUv with fragCoord-based expression", () => {
    const result = formatShadertoy(SAMPLE_SHADER);
    expect(result).toContain("fragCoord.xy/iResolution.xy");
    expect(result).not.toContain("vUv");
  });

  it("handles u_mouse replacement", () => {
    const code = `uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 vUv;

void main() {
  vec2 m = u_mouse;
  gl_FragColor = vec4(m, 0.0, 1.0);
}`;
    const result = formatShadertoy(code);
    expect(result).toContain("iMouse.xy/iResolution.xy");
    expect(result).not.toContain("u_mouse");
  });
});
