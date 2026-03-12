"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { tokenizeGLSL } from "./highlighting";
import type { ShaderError } from "../types";

type CodeEditorProps = {
  code: string;
  onChange: (code: string) => void;
  errors: ShaderError[];
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
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Keep scroll in sync when code changes programmatically (e.g. preset selection)
  useEffect(() => {
    syncScroll();
  }, [code, syncScroll]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = code.slice(0, start);
        const after = code.slice(end);
        onChange(before + "  " + after);

        // Restore cursor position after React re-renders the value
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
      }
      // Escape releases focus so keyboard users aren't trapped
      if (e.key === "Escape") {
        e.currentTarget.blur();
      }
    },
    [code, onChange],
  );

  return (
    <div className="bg-surface-card-alt border-border-hairline relative overflow-hidden rounded-lg border">
      <style dangerouslySetInnerHTML={{ __html: GLSL_STYLES }} />

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

      {/* Error line highlights */}
      {errorLines.size > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 z-0"
          style={{ left: gutterWidth }}
        >
          <div className="relative py-3">
            {Array.from({ length: lineCount }, (_, i) => {
              const lineNum = i + 1;
              if (!errorLines.has(lineNum)) return null;
              return (
                <div
                  key={lineNum}
                  className="absolute right-0 left-0 bg-red-500/10"
                  style={{
                    top: `calc(0.75rem + ${i} * 1.5rem)`,
                    height: "1.5rem",
                  }}
                />
              );
            })}
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
        className={`relative z-2 m-0 block h-80 w-full resize-none bg-transparent py-3 pr-3 pl-3 text-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 ${SHARED_TEXT_CLASSES}`}
        style={{
          left: gutterWidth,
          width: `calc(100% - ${gutterWidth})`,
          caretColor: "var(--text)",
          tabSize: 2,
        }}
      />
    </div>
  );
}
