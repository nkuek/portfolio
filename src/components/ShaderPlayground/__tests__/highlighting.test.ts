import { describe, it, expect } from "vitest";
import { tokenizeGLSL } from "../CodeEditor/highlighting";

describe("tokenizeGLSL", () => {
  describe("keywords", () => {
    it.each(["void", "return", "if", "for"])("marks '%s' as keyword", (kw) => {
      const html = tokenizeGLSL(kw);
      expect(html).toContain(`<span class="glsl-keyword">${kw}</span>`);
    });
  });

  describe("types", () => {
    it.each(["float", "vec2", "vec3", "vec4", "mat4"])(
      "marks '%s' as type",
      (type) => {
        const html = tokenizeGLSL(type);
        expect(html).toContain(`<span class="glsl-type">${type}</span>`);
      },
    );
  });

  describe("built-in functions", () => {
    it.each(["sin", "cos", "mix", "smoothstep"])(
      "marks '%s' as function",
      (fn) => {
        const html = tokenizeGLSL(`${fn}(`);
        expect(html).toContain(`<span class="glsl-function">${fn}</span>`);
      },
    );
  });

  describe("numbers", () => {
    it.each(["1.0", "42", ".5"])("marks '%s' as number", (num) => {
      const html = tokenizeGLSL(num);
      expect(html).toContain(`<span class="glsl-number">${num}</span>`);
    });
  });

  describe("comments", () => {
    it("marks line comments as comment", () => {
      const html = tokenizeGLSL("// this is a comment");
      expect(html).toContain('<span class="glsl-comment">');
      expect(html).toContain("// this is a comment");
    });

    it("marks block comments as comment", () => {
      const html = tokenizeGLSL("/* block */");
      expect(html).toContain('<span class="glsl-comment">');
      expect(html).toContain("/* block */");
    });
  });

  describe("preprocessor", () => {
    it.each(["#define FOO 1", "#ifdef GL_ES"])(
      "marks '%s' as preprocessor",
      (directive) => {
        const html = tokenizeGLSL(directive);
        expect(html).toContain('<span class="glsl-preprocessor">');
      },
    );
  });

  it("does not highlight keywords inside comments", () => {
    const html = tokenizeGLSL("// void return");
    expect(html).not.toContain('class="glsl-keyword"');
    expect(html).toContain('class="glsl-comment"');
  });

  it("escapes HTML special characters", () => {
    const html = tokenizeGLSL("a < b && c > d");
    expect(html).toContain("&lt;");
    expect(html).toContain("&gt;");
    expect(html).toContain("&amp;&amp;");
  });
});
