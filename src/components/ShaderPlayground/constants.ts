import type { ShaderPresetCategory } from "./types";

export const BUILT_IN_UNIFORMS = new Set(["u_time", "u_resolution", "u_mouse"]);

export const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/** Guide comment prepended to all shader code in the editor. */
export const SHADER_GUIDE_COMMENT = `// Built-in uniforms (do not remove):
//   u_time       — elapsed time in seconds
//   u_resolution — canvas size in pixels
//   u_mouse      — normalized mouse position (0–1)
//
// Add your own uniforms for interactive sliders:
//   uniform float speed;            — float slider (0–10)
//   uniform vec3 color;             — vec3 with x/y/z sliders (0–1)
//   uniform float amp; // range: 0, 5  — custom range
`;

/** Strip the guide comment block from shader code (for exports). */
export function stripGuideComment(code: string): string {
  return code.replace(SHADER_GUIDE_COMMENT, "").replace(/^\n+/, "");
}

export const DEFAULT_FRAGMENT_SHADER = `${SHADER_GUIDE_COMMENT}
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec3 color = vec3(vUv.x, vUv.y, 0.5 + 0.5 * sin(u_time));
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Preamble prepended for raw WebGL test-compile (ShaderMaterial provides this) */
export const FRAGMENT_TEST_PREAMBLE = "precision mediump float;\n";

export const CATEGORY_LABELS: Record<ShaderPresetCategory, string> = {
  basics: "Basics",
  patterns: "Patterns",
  effects: "Effects",
};

export const SPEED_OPTIONS = [0.25, 0.5, 1, 2] as const;
