import type { ShaderPreset } from "./types";

export const PRESETS: ShaderPreset[] = [
  // --- Basics ---
  {
    name: "Solid Color",
    category: "basics",
    description: "A simple solid teal color",
    code: `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec3 teal = vec3(0.0, 0.78, 0.75);
  gl_FragColor = vec4(teal, 1.0);
}
`,
  },
  {
    name: "UV Gradient",
    category: "basics",
    description: "Maps UV coordinates to RGB with time-animated blue channel",
    code: `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec3 color = vec3(vUv.x, vUv.y, 0.5 + 0.5 * sin(u_time));
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
  {
    name: "Radial Gradient",
    category: "basics",
    description: "Circular gradient from center that pulses with time",
    code: `uniform float u_time;
uniform vec2 u_resolution;
uniform float radius; // range: 0.1, 1.5
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
  float gradient = smoothstep(radius * pulse, 0.0, dist);
  vec3 color = mix(vec3(0.05, 0.05, 0.15), vec3(0.3, 0.6, 1.0), gradient);
  gl_FragColor = vec4(color, 1.0);
}
`,
  },

  // --- Patterns ---
  {
    name: "Checkerboard",
    category: "patterns",
    description: "Time-animated checkerboard pattern",
    code: `uniform float u_time;
uniform vec2 u_resolution;
uniform float scale; // range: 2.0, 20.0
varying vec2 vUv;

void main() {
  vec2 uv = vUv * scale + u_time * 0.5;
  float checker = mod(floor(uv.x) + floor(uv.y), 2.0);
  vec3 c1 = vec3(0.95, 0.95, 0.95);
  vec3 c2 = vec3(0.15, 0.15, 0.2);
  gl_FragColor = vec4(mix(c1, c2, checker), 1.0);
}
`,
  },
  {
    name: "Concentric Circles",
    category: "patterns",
    description: "Rings expanding outward from center",
    code: `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float rings = sin((dist - u_time * 0.1) * 40.0);
  float band = smoothstep(0.0, 0.05, rings);
  vec3 color = mix(vec3(0.1, 0.1, 0.3), vec3(0.4, 0.8, 1.0), band);
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
  {
    name: "Stripes",
    category: "patterns",
    description: "Diagonal animated stripes",
    code: `uniform float u_time;
uniform vec2 u_resolution;
uniform float thickness; // range: 0.02, 0.2
varying vec2 vUv;

void main() {
  float diag = vUv.x + vUv.y + u_time * 0.3;
  float stripe = step(thickness, mod(diag, 0.3));
  vec3 c1 = vec3(0.95, 0.4, 0.3);
  vec3 c2 = vec3(0.15, 0.1, 0.1);
  gl_FragColor = vec4(mix(c1, c2, stripe), 1.0);
}
`,
  },
  {
    name: "Noise",
    category: "patterns",
    description: "Pseudo-random noise using a simple hash function",
    code: `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv * 10.0;
  float t = floor(u_time * 4.0);
  float n = hash(floor(uv) + t);
  gl_FragColor = vec4(vec3(n), 1.0);
}
`,
  },

  // --- Effects ---
  {
    name: "Plasma",
    category: "effects",
    description: "Classic plasma effect with layered sine waves",
    code: `uniform float u_time;
uniform vec2 u_resolution;
uniform float intensity; // range: 0.5, 3.0
varying vec2 vUv;

void main() {
  vec2 uv = vUv * 4.0 - 2.0;
  float v1 = sin(uv.x * intensity + u_time);
  float v2 = sin(uv.y * intensity + u_time);
  float v3 = sin((uv.x + uv.y) * intensity + u_time);
  float v4 = sin(length(uv) * intensity * 1.5 + u_time);
  float v = (v1 + v2 + v3 + v4) * 0.25;
  vec3 color = vec3(
    0.5 + 0.5 * sin(v * 3.14159 + 0.0),
    0.5 + 0.5 * sin(v * 3.14159 + 2.094),
    0.5 + 0.5 * sin(v * 3.14159 + 4.189)
  );
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
  {
    name: "Ripples",
    category: "effects",
    description: "Water ripple effect emanating from center",
    code: `uniform float u_time;
uniform vec2 u_resolution;
uniform float frequency; // range: 5.0, 40.0
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float ripple = sin(dist * frequency - u_time * 4.0);
  float fade = 1.0 - smoothstep(0.0, 0.5, dist);
  float wave = ripple * fade;
  vec3 base = vec3(0.05, 0.1, 0.2);
  vec3 highlight = vec3(0.3, 0.7, 0.9);
  vec3 color = base + highlight * wave * 0.5;
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
  {
    name: "Tunnel",
    category: "effects",
    description: "Simple tunnel zoom effect using polar coordinates",
    code: `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float angle = atan(center.y, center.x);
  float dist = length(center);
  float safeDist = max(dist, 0.001);
  float tunnel = 1.0 / safeDist;
  float tx = angle / 3.14159;
  float ty = tunnel + u_time * 0.5;
  float pattern = sin(tx * 8.0) * sin(ty * 8.0);
  float fog = smoothstep(0.0, 2.0, tunnel);
  vec3 color = vec3(0.5 + 0.5 * pattern) * (1.0 - fog * 0.6);
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
];
