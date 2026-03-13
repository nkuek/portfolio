/**
 * Lightweight GLSL formatter.
 *
 * Handles:
 * - Consistent 2-space indentation based on brace depth
 * - Trimming trailing whitespace
 * - Single blank line max between blocks (no consecutive blanks)
 * - Preserving preprocessor directives at column 0
 * - Preserving comments
 */

/** Split trailing line comment from code: [code, comment]. */
function splitLineComment(line: string): [string, string] {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "/" && line[i + 1] === "/") {
      return [line.slice(0, i), line.slice(i)];
    }
  }
  return [line, ""];
}

export function formatGLSL(source: string): string {
  const lines = source.split("\n");
  const result: string[] = [];
  let depth = 0;
  let inBlockComment = false;
  let prevWasBlank = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // --- Block comments: preserve content, indent to current depth ---
    if (inBlockComment) {
      result.push("  ".repeat(depth) + trimmed);
      if (trimmed.includes("*/")) inBlockComment = false;
      prevWasBlank = false;
      continue;
    }

    if (trimmed.startsWith("/*")) {
      result.push("  ".repeat(depth) + trimmed);
      if (!trimmed.includes("*/")) inBlockComment = true;
      prevWasBlank = false;
      continue;
    }

    // --- Blank lines: collapse consecutive ---
    if (trimmed === "") {
      if (!prevWasBlank && result.length > 0) result.push("");
      prevWasBlank = true;
      continue;
    }
    prevWasBlank = false;

    // --- Preprocessor: always column 0 ---
    if (trimmed.startsWith("#")) {
      result.push(trimmed);
      continue;
    }

    // Split off trailing line comment
    const [codePart, commentPart] = splitLineComment(trimmed);
    const code = codePart.trimEnd();

    // Dedent before printing lines that start with }
    const leadingClose = code.startsWith("}");
    if (leadingClose) depth = Math.max(0, depth - 1);

    // Build formatted line
    const indent = "  ".repeat(depth);
    if (commentPart) {
      result.push(
        code ? `${indent}${code} ${commentPart}` : `${indent}${commentPart}`,
      );
    } else {
      result.push(`${indent}${code}`);
    }

    // Indent after lines that end with {
    // (but not if line is just "}" or "} else {" which already adjusted)
    const opens = (code.match(/{/g) ?? []).length;
    const closes = (code.match(/}/g) ?? []).length;
    const net = opens - closes;

    if (leadingClose) {
      // We already decremented for the leading }. Now apply the net from the
      // rest of the line (e.g. "} else {" has net=0 but we need +1 for the {)
      depth += net + 1;
    } else {
      depth += net;
    }
    depth = Math.max(0, depth);
  }

  // Remove trailing blank lines
  while (result.length > 0 && result[result.length - 1]?.trim() === "") {
    result.pop();
  }

  return result.join("\n") + "\n";
}
