"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { tokenizeGLSL } from "./highlighting";
import { formatGLSL } from "./formatting";
import type { ShaderError } from "../types";

type CodeEditorProps = {
  code: string;
  onChange: (code: string) => void;
  errors: ShaderError[];
  scrollToLineRef?: React.RefObject<((line: number) => void) | null>;
};

const GLSL_STYLES = `
.glsl-comment { color: var(--text-muted); font-style: italic; }
.glsl-keyword { color: var(--accent-rose); }
.glsl-preprocessor { color: var(--accent-rose); }
.glsl-type { color: var(--accent); }
.glsl-function { color: var(--primary); }
.glsl-number { color: #16a34a; }

html[data-color-scheme="dark"] .glsl-number { color: #4ade80; }
@media (prefers-color-scheme: dark) {
  html:not([data-color-scheme="light"]) .glsl-number { color: #4ade80; }
}
`;

/** Shared text styling applied to both the textarea and the highlight overlay. */
const SHARED_TEXT_CLASSES =
  "font-mono text-sm leading-6 whitespace-pre break-normal";

export default function CodeEditor({
  code,
  onChange,
  errors,
  scrollToLineRef,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const errorHighlightRef = useRef<HTMLDivElement>(null);

  const lineCount = code.split("\n").length;
  const gutterWidth = `${Math.max(String(lineCount).length, 2) + 1}ch`;

  const errorLines = useMemo(() => {
    const set = new Set<number>();
    for (const err of errors) {
      if (err.line !== null) set.add(err.line);
    }
    return set;
  }, [errors]);

  const highlighted = useMemo(() => tokenizeGLSL(code), [code]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    const gutter = gutterRef.current;
    if (!textarea) return;

    if (overlay) {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    }
    if (gutter) {
      gutter.scrollTop = textarea.scrollTop;
    }
    if (errorHighlightRef.current) {
      errorHighlightRef.current.scrollTop = textarea.scrollTop;
    }
  }, []);

  // Keep scroll in sync when code changes programmatically (e.g. preset selection)
  useEffect(() => {
    syncScroll();
  }, [code, syncScroll]);

  // Register scroll-to-line function for click-to-jump errors
  useEffect(() => {
    if (!scrollToLineRef) return;
    (
      scrollToLineRef as React.MutableRefObject<((line: number) => void) | null>
    ).current = (line: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      // leading-6 = 24px per line
      textarea.scrollTop = (line - 1) * 24;
      textarea.focus();
      syncScroll();
    };
    return () => {
      (
        scrollToLineRef as React.MutableRefObject<
          ((line: number) => void) | null
        >
      ).current = null;
    };
  }, [scrollToLineRef]);

  const handleFormat = useCallback(() => {
    onChange(formatGLSL(code));
  }, [code, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.key === "Tab") {
        e.preventDefault();
        const before = code.slice(0, start);
        const after = code.slice(end);
        onChange(before + "  " + after);

        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
        return;
      }

      // Enter: auto-indent to match current line, extra level after {
      if (e.key === "Enter") {
        e.preventDefault();
        const before = code.slice(0, start);
        const after = code.slice(end);

        // Find the current line's leading whitespace
        const currentLine = before.split("\n").pop() ?? "";
        const match = currentLine.match(/^(\s*)/);
        let indent = match?.[1] ?? "";

        // Extra indent after {
        const trimmedBefore = before.trimEnd();
        if (trimmedBefore.endsWith("{")) {
          indent += "  ";
        }

        // If the cursor is right before }, auto-dedent the closing brace
        const afterTrimmed = after.trimStart();
        if (afterTrimmed.startsWith("}") && indent.length >= 2) {
          const closingIndent = indent.slice(2);
          // Strip existing whitespace before the }
          const restAfterBrace = after.slice(after.indexOf("}"));
          const newCode = `${before}\n${indent}\n${closingIndent}${restAfterBrace}`;
          const cursorPos = before.length + 1 + indent.length;
          onChange(newCode);

          requestAnimationFrame(() => {
            textarea.selectionStart = cursorPos;
            textarea.selectionEnd = cursorPos;
          });
          return;
        }

        const newCode = `${before}\n${indent}${after}`;
        const cursorPos = before.length + 1 + indent.length;
        onChange(newCode);

        requestAnimationFrame(() => {
          textarea.selectionStart = cursorPos;
          textarea.selectionEnd = cursorPos;
        });
        return;
      }

      // Shift+Alt+F to format (matches VS Code convention)
      if (e.key === "f" && e.shiftKey && e.altKey) {
        e.preventDefault();
        handleFormat();
        return;
      }

      // Escape releases focus so keyboard users aren't trapped
      if (e.key === "Escape") {
        e.currentTarget.blur();
      }
    },
    [code, onChange, handleFormat],
  );

  return (
    <div className="bg-surface-card-alt border-border-hairline relative h-80 overflow-hidden rounded-lg border">
      <style dangerouslySetInnerHTML={{ __html: GLSL_STYLES }} />

      {/* Format button */}
      <button
        type="button"
        aria-label="Format code (Shift+Alt+F)"
        title="Format (Shift+Alt+F)"
        onClick={handleFormat}
        className="border-border-hairline bg-surface-card text-text-muted hover:border-accent hover:text-accent absolute top-2 right-2 z-30 flex size-7 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h10M4 17h12" />
        </svg>
      </button>

      {/* Line number gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="text-text-muted/60 border-border-hairline bg-surface-card-alt absolute top-0 bottom-0 left-0 z-10 overflow-hidden border-r py-3 pr-2 pl-2 text-right font-mono text-sm leading-6 select-none"
        style={{ width: gutterWidth }}
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const lineNum = i + 1;
          const hasError = errorLines.has(lineNum);
          return (
            <div
              key={lineNum}
              className={hasError ? "text-red-400" : undefined}
            >
              {lineNum}
            </div>
          );
        })}
      </div>

      {/* Error line highlights — syncs scroll with textarea */}
      {errorLines.size > 0 && (
        <div
          ref={errorHighlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 z-0 overflow-hidden"
          style={{ left: gutterWidth }}
        >
          <div className="py-3 leading-6">
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className={errorLines.has(i + 1) ? "bg-red-500/10" : undefined}
                style={{ height: "1.5rem" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Syntax highlight overlay */}
      <pre
        ref={overlayRef}
        aria-hidden="true"
        className={`text-text pointer-events-none absolute top-0 right-0 bottom-0 z-1 m-0 overflow-hidden py-3 pr-3 pl-3 ${SHARED_TEXT_CLASSES}`}
        style={{
          left: gutterWidth,
          tabSize: 2,
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>

      {/* Editable textarea */}
      <textarea
        ref={textareaRef}
        data-lenis-prevent
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="GLSL fragment shader editor"
        className={`absolute top-0 right-0 bottom-0 z-2 m-0 block resize-none bg-transparent py-3 pr-3 pl-3 text-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 ${SHARED_TEXT_CLASSES}`}
        style={{
          left: gutterWidth,
          caretColor: "var(--text)",
          tabSize: 2,
        }}
      />
    </div>
  );
}
