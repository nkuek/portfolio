import { describe, it, expect } from "vitest";
import { encodeShaderUrl, decodeShaderUrl } from "../url";

describe("encodeShaderUrl / decodeShaderUrl", () => {
  it("round-trips simple shader code", async () => {
    const code = "void main() { gl_FragColor = vec4(1.0); }";
    const encoded = await encodeShaderUrl(code, 1, {});
    const decoded = await decodeShaderUrl(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.code).toBe(code);
    expect(decoded?.speed).toBe(1);
    expect(decoded?.uniforms).toEqual({});
  });

  it("round-trips speed and uniforms", async () => {
    const code = "precision mediump float;\nvoid main() {}";
    const uniforms = { u_brightness: [0.5], u_color: [1.0, 0.0, 0.5] };
    const encoded = await encodeShaderUrl(code, 2, uniforms);
    const decoded = await decodeShaderUrl(encoded);
    expect(decoded?.code).toBe(code);
    expect(decoded?.speed).toBe(2);
    expect(decoded?.uniforms).toEqual(uniforms);
  });

  it("round-trips multiline shader code", async () => {
    const code = [
      "precision mediump float;",
      "uniform float u_time;",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution;",
      "  gl_FragColor = vec4(uv, sin(u_time), 1.0);",
      "}",
    ].join("\n");
    const encoded = await encodeShaderUrl(code, 0.5, {});
    const decoded = await decodeShaderUrl(encoded);
    expect(decoded?.code).toBe(code);
    expect(decoded?.speed).toBe(0.5);
  });

  it("returns null for invalid encoded string", async () => {
    expect(await decodeShaderUrl("not-valid-base64!!!")).toBeNull();
    expect(await decodeShaderUrl("")).toBeNull();
  });

  it("produces URL-safe output (no +, /, or =)", async () => {
    const code = "void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }";
    const encoded = await encodeShaderUrl(code, 1, {});
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
