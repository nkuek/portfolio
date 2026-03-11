"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { BezierCurve, SpringConfig } from "../types";
import type { EditorMode } from "../state";
import {
  formatCSS,
  formatCSSTransition,
  formatCSSVariable,
  formatLinearEasing,
  formatSpringKeyframes,
  formatMotionConfig,
} from "./formatters";

type ExportPanelProps = {
  mode: EditorMode;
  curve: BezierCurve;
  duration: number;
  springConfig: SpringConfig;
  springSamples: number[];
};

type BezierFormat = "cubic-bezier" | "transition" | "variable";
type SpringFormat = "linear" | "keyframes" | "motion";

const BEZIER_FORMAT_LABELS: Record<BezierFormat, string> = {
  "cubic-bezier": "cubic-bezier()",
  transition: "transition",
  variable: "CSS variable",
};

const SPRING_FORMAT_LABELS: Record<SpringFormat, string> = {
  linear: "linear()",
  keyframes: "@keyframes",
  motion: "Motion",
};

export default function ExportPanel({
  mode,
  curve,
  duration,
  springConfig,
  springSamples,
}: ExportPanelProps) {
  const [bezierFormat, setBezierFormat] =
    useState<BezierFormat>("cubic-bezier");
  const [springFormat, setSpringFormat] = useState<SpringFormat>("linear");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { code, note } = useMemo(() => {
    if (mode === "bezier") {
      switch (bezierFormat) {
        case "cubic-bezier":
          return { code: formatCSS(curve), note: null };
        case "transition":
          return { code: formatCSSTransition(curve, duration), note: null };
        case "variable":
          return { code: formatCSSVariable(curve), note: null };
      }
    }

    switch (springFormat) {
      case "linear":
        return { code: formatLinearEasing(springSamples), note: null };
      case "keyframes":
        return { code: formatSpringKeyframes(springSamples), note: null };
      case "motion":
        return { code: formatMotionConfig(springConfig), note: null };
    }
  }, [
    mode,
    bezierFormat,
    springFormat,
    curve,
    duration,
    springConfig,
    springSamples,
  ]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [code]);

  const formatLabels =
    mode === "bezier" ? BEZIER_FORMAT_LABELS : SPRING_FORMAT_LABELS;
  const activeFormat = mode === "bezier" ? bezierFormat : springFormat;
  const setFormat = mode === "bezier" ? setBezierFormat : setSpringFormat;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-text-subtle text-sm font-medium">Export</h3>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(formatLabels) as string[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => (setFormat as (v: string) => void)(f)}
            className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
              activeFormat === f
                ? "border-accent bg-accent text-white"
                : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer"
            }`}
          >
            {formatLabels[f as keyof typeof formatLabels]}
          </button>
        ))}
      </div>

      <div
        data-lenis-prevent
        className="bg-surface-card-alt relative max-h-48 overflow-auto rounded-lg p-3"
      >
        <pre className="text-text font-mono text-sm">
          {code}
        </pre>
        {note && <p className="text-text-muted mt-2 text-xs italic">{note}</p>}
        <button
          type="button"
          onClick={handleCopy}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent absolute top-2 right-2 cursor-pointer rounded-md border px-2 py-1 font-mono text-xs transition-colors hover:bg-[var(--accent)] hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
