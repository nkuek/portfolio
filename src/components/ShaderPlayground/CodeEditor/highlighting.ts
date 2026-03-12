const KEYWORDS = new Set([
  "void",
  "return",
  "if",
  "else",
  "for",
  "while",
  "discard",
  "uniform",
  "varying",
  "precision",
  "in",
  "out",
  "const",
  "break",
  "continue",
  "do",
  "struct",
  "highp",
  "mediump",
  "lowp",
]);

const TYPES = new Set([
  "float",
  "vec2",
  "vec3",
  "vec4",
  "mat2",
  "mat3",
  "mat4",
  "int",
  "bool",
  "sampler2D",
  "ivec2",
  "ivec3",
  "ivec4",
  "bvec2",
  "bvec3",
  "bvec4",
]);

const BUILTINS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "pow",
  "exp",
  "log",
  "sqrt",
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
  "reflect",
  "refract",
  "texture2D",
  "dFdx",
  "dFdy",
  "fwidth",
]);

function escapeHtml(ch: string): string {
  switch (ch) {
    case "&":
      return "&amp;";
    case "<":
      return "&lt;";
    case ">":
      return "&gt;";
    default:
      return ch;
  }
}

function isWordChar(ch: string | undefined): boolean {
  if (ch === undefined) return false;
  return /[a-zA-Z0-9_]/.test(ch);
}

/**
 * Tokenize GLSL source code and return an HTML string with syntax highlighting
 * spans. The output is used as `dangerouslySetInnerHTML` in a `<pre>` overlay.
 */
export function tokenizeGLSL(code: string): string {
  const out: string[] = [];
  let i = 0;
  const len = code.length;

  while (i < len) {
    // --- Block comment ---
    if (code[i] === "/" && code[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < len && !(code[i] === "*" && code[i + 1] === "/")) {
        i++;
      }
      if (i < len) i += 2; // skip closing */
      const comment = code.slice(start, i);
      out.push(`<span class="glsl-comment">`);
      for (const ch of comment) {
        out.push(escapeHtml(ch));
      }
      out.push("</span>");
      continue;
    }

    // --- Line comment ---
    if (code[i] === "/" && code[i + 1] === "/") {
      const start = i;
      while (i < len && code[i] !== "\n") {
        i++;
      }
      const comment = code.slice(start, i);
      out.push(`<span class="glsl-comment">`);
      for (const ch of comment) {
        out.push(escapeHtml(ch));
      }
      out.push("</span>");
      continue;
    }

    // --- Preprocessor ---
    if (code[i] === "#") {
      // Only match at line start (first non-space character on the line)
      let lineStart = true;
      if (i > 0) {
        let j = i - 1;
        while (j >= 0 && code[j] !== "\n") {
          if (code[j] !== " " && code[j] !== "\t") {
            lineStart = false;
            break;
          }
          j--;
        }
      }
      if (lineStart) {
        const start = i;
        while (i < len && code[i] !== "\n") {
          i++;
        }
        const directive = code.slice(start, i);
        out.push(`<span class="glsl-preprocessor">`);
        for (const ch of directive) {
          out.push(escapeHtml(ch));
        }
        out.push("</span>");
        continue;
      }
    }

    // --- Numbers ---
    // A number must not be preceded by a word character.
    if (!isWordChar(code[i - 1])) {
      const numMatch = matchNumber(code, i);
      if (numMatch !== null) {
        out.push(`<span class="glsl-number">`);
        for (const ch of numMatch) {
          out.push(escapeHtml(ch));
        }
        out.push("</span>");
        i += numMatch.length;
        continue;
      }
    }

    // --- Identifiers (keywords, types, built-in functions) ---
    if (/[a-zA-Z_]/.test(code[i])) {
      const start = i;
      while (i < len && isWordChar(code[i])) {
        i++;
      }
      const word = code.slice(start, i);

      let className: string | null = null;
      if (KEYWORDS.has(word)) {
        className = "glsl-keyword";
      } else if (TYPES.has(word)) {
        className = "glsl-type";
      } else if (BUILTINS.has(word)) {
        className = "glsl-function";
      }

      if (className) {
        out.push(`<span class="${className}">`);
        // Identifiers are safe ASCII -- no HTML escaping needed
        out.push(word);
        out.push("</span>");
      } else {
        out.push(word);
      }
      continue;
    }

    // --- Everything else: single character ---
    out.push(escapeHtml(code[i]));
    i++;
  }

  return out.join("");
}

/**
 * Attempt to match a numeric literal at position `i` in `code`.
 * Returns the matched string or null.
 *
 * Matches: 1, 1.0, .5, 1e-3, 1.0e2, 0.5e+1
 */
function matchNumber(code: string, i: number): string | null {
  const len = code.length;
  const start = i;
  const ch = code[i];

  // Must start with a digit or a dot followed by a digit
  if (ch === ".") {
    if (i + 1 >= len || !/[0-9]/.test(code[i + 1])) return null;
  } else if (!/[0-9]/.test(ch)) {
    return null;
  }

  // Integer part
  while (i < len && /[0-9]/.test(code[i])) {
    i++;
  }

  // Fractional part
  if (i < len && code[i] === "." && (i + 1 >= len || code[i + 1] !== ".")) {
    i++;
    while (i < len && /[0-9]/.test(code[i])) {
      i++;
    }
  }

  // Exponent part
  if (i < len && (code[i] === "e" || code[i] === "E")) {
    const preExpI = i;
    i++;
    if (i < len && (code[i] === "+" || code[i] === "-")) {
      i++;
    }
    // Must have at least one digit after exponent
    const expStart = i;
    while (i < len && /[0-9]/.test(code[i])) {
      i++;
    }
    if (i === expStart) {
      // No digits after exponent -- backtrack to before the 'e'
      i = preExpI;
    }
  }

  if (i === start) return null;

  // Must not be followed by a word character (otherwise it's part of an identifier)
  if (isWordChar(code[i])) return null;

  return code.slice(start, i);
}
