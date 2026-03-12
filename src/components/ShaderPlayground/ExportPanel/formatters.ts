export function formatRawGLSL(code: string): string {
  return "precision mediump float;\n" + code;
}

export function formatThreeJS(code: string): string {
  return `const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2() },
    u_mouse: { value: new THREE.Vector2() },
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`${code}\`,
});`;
}

export function formatTSL(code: string): string {
  let body = code;

  // Strip declarations
  body = body.replace(/precision\s+\w+\s+float\s*;\s*/g, "");
  body = body.replace(/uniform\s+\w+\s+\w+\s*;[^\n]*\n?/g, "");
  body = body.replace(/varying\s+\w+\s+\w+\s*;\s*/g, "");

  // Replace built-in uniforms with TSL equivalents
  body = body.replace(/u_time/g, "time");
  body = body.replace(/u_resolution/g, "viewportResolution");
  body = body.replace(/u_mouse/g, "mouseUv");

  // Replace vUv with uv()
  body = body.replace(/vUv/g, "uv()");

  // Replace gl_FragColor assignment with return
  body = body.replace(/gl_FragColor\s*=\s*/g, "return ");

  // Extract main body (between void main() { ... })
  const mainMatch = body.match(/void\s+main\s*\(\s*\)\s*\{([\s\S]*)\}\s*$/);
  const mainBody = mainMatch ? mainMatch[1] : body;

  // Extract any helper functions before main()
  const beforeMain = mainMatch
    ? body.slice(0, body.indexOf("void main")).trim()
    : "";

  // Indent main body
  const indented = mainBody
    .split("\n")
    .map((line) => (line.trim() ? `    ${line.trimEnd()}` : ""))
    .join("\n")
    .trim();

  // Build TSL imports from usage
  const tslFunctions = [
    "Fn",
    "vec2",
    "vec3",
    "vec4",
    "float",
    "uv",
    "sin",
    "cos",
    "tan",
    "abs",
    "sign",
    "floor",
    "ceil",
    "fract",
    "mod",
    "min",
    "max",
    "clamp",
    "mix",
    "step",
    "smoothstep",
    "length",
    "distance",
    "dot",
    "cross",
    "normalize",
    "pow",
    "sqrt",
    "atan",
    "reflect",
    "refract",
  ];
  const fullBody = beforeMain + "\n" + indented;
  const usedImports = tslFunctions.filter((fn) => {
    if (fn === "Fn") return true;
    const re = new RegExp(`\\b${fn}\\b`);
    return re.test(fullBody);
  });

  // Add time/resolution/mouse imports if used
  if (/\btime\b/.test(fullBody)) usedImports.push("timerLocal");
  if (/\bviewportResolution\b/.test(fullBody))
    usedImports.push("viewportResolution");

  const importLine = `import { ${usedImports.join(", ")} } from "three/tsl";`;

  // Build helper functions if any
  const helpers = beforeMain
    ? `\n${beforeMain.replace(/float\b/g, "Fn").replace(/vec2\b/g, "Fn")}\n`
    : "";

  let result = `${importLine}
${helpers}
const shader = Fn(() => {
  const time = timerLocal();
    ${indented}
});

const material = new THREE.MeshBasicNodeMaterial();
material.colorNode = shader();`;

  // Clean up: remove duplicate time declarations if no u_time was used
  if (!/\btime\b/.test(indented)) {
    result = result.replace("  const time = timerLocal();\n", "");
  }

  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

export function formatShadertoy(code: string): string {
  let result = code;

  // Remove precision declarations
  result = result.replace(/precision\s+\w+\s+float\s*;\s*/g, "");

  // Remove uniform declarations
  result = result.replace(/uniform\s+\w+\s+\w+\s*;[^\n]*\n?/g, "");

  // Remove varying declarations
  result = result.replace(/varying\s+\w+\s+\w+\s*;\s*/g, "");

  // Replace built-in uniforms
  result = result.replace(/u_time/g, "iTime");
  result = result.replace(/u_resolution\.xy/g, "iResolution.xy");
  result = result.replace(/u_resolution/g, "iResolution.xy");
  result = result.replace(
    /u_mouse\.xy\s*\/\s*iResolution\.xy/g,
    "iMouse.xy/iResolution.xy",
  );
  result = result.replace(/u_mouse/g, "iMouse.xy/iResolution.xy");

  // Replace vUv with fragCoord.xy/iResolution.xy
  result = result.replace(/vUv/g, "fragCoord.xy/iResolution.xy");

  // Replace void main() with Shadertoy signature
  result = result.replace(
    /void\s+main\s*\(\s*\)/,
    "void mainImage(out vec4 fragColor, in vec2 fragCoord)",
  );

  // Replace gl_FragColor with fragColor
  result = result.replace(/gl_FragColor/g, "fragColor");

  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}
