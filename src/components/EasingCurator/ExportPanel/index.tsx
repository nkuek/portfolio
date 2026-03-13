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
  formatTailwindTheme,
} from "./formatters";

type ExportPanelProps = {
  mode: EditorMode;
  curve: BezierCurve;
  duration: number;
  springConfig: SpringConfig;
  springSamples: number[];
  activePreset: string | null;
};

type BezierFormat = "cubic-bezier" | "transition" | "variable" | "tailwind";
type SpringFormat = "linear" | "keyframes" | "motion" | "tailwind";

const BEZIER_FORMATS: BezierFormat[] = [
  "cubic-bezier",
  "transition",
  "variable",
  "tailwind",
];

const BEZIER_FORMAT_LABELS: Record<BezierFormat, string> = {
  "cubic-bezier": "cubic-bezier()",
  transition: "transition",
  variable: "CSS variable",
  tailwind: "Tailwind",
};

const SPRING_FORMATS: SpringFormat[] = [
  "linear",
  "keyframes",
  "motion",
  "tailwind",
];

const SPRING_FORMAT_LABELS: Record<SpringFormat, string> = {
  linear: "linear()",
  keyframes: "@keyframes",
  motion: "Motion",
  tailwind: "Tailwind",
};

export default function ExportPanel({
  mode,
  curve,
  duration,
  springConfig,
  springSamples,
  activePreset,
}: ExportPanelProps) {
  const [bezierFormat, setBezierFormat] =
    useState<BezierFormat>("cubic-bezier");
  const [springFormat, setSpringFormat] = useState<SpringFormat>("linear");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const themeName = activePreset ?? "my-ease";

  const { code, note } = useMemo(() => {
    if (mode === "bezier") {
      switch (bezierFormat) {
        case "cubic-bezier":
          return { code: formatCSS(curve), note: null };
        case "transition":
          return { code: formatCSSTransition(curve, duration), note: null };
        case "variable":
          return { code: formatCSSVariable(curve), note: null };
        case "tailwind":
          return {
            code: formatTailwindTheme(formatCSS(curve), themeName),
            note: `Use as ease-${themeName}`,
          };
      }
    }

    switch (springFormat) {
      case "linear":
        return { code: formatLinearEasing(springSamples), note: null };
      case "keyframes":
        return { code: formatSpringKeyframes(springSamples), note: null };
      case "motion":
        return { code: formatMotionConfig(springConfig), note: null };
      case "tailwind":
        return {
          code: formatTailwindTheme(
            formatLinearEasing(springSamples),
            themeName,
          ),
          note: `Use as ease-${themeName}`,
        };
    }
  }, [
    mode,
    bezierFormat,
    springFormat,
    curve,
    duration,
    springConfig,
    springSamples,
    themeName,
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

  const formats = mode === "bezier" ? BEZIER_FORMATS : SPRING_FORMATS;
  const activeFormat = mode === "bezier" ? bezierFormat : springFormat;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-text-subtle text-sm font-medium">Export</h3>

      <div className="flex flex-wrap gap-1.5">
        {formats.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() =>
              mode === "bezier"
                ? setBezierFormat(f as BezierFormat)
                : setSpringFormat(f as SpringFormat)
            }
            className={`rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
              activeFormat === f
                ? "border-accent bg-accent text-white"
                : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer"
            }`}
          >
            {mode === "bezier"
              ? BEZIER_FORMAT_LABELS[f as BezierFormat]
              : SPRING_FORMAT_LABELS[f as SpringFormat]}
          </button>
        ))}
      </div>

      <div
        data-lenis-prevent
        className="bg-surface-card-alt max-h-48 overflow-auto rounded-lg p-3"
      >
        <pre className="text-text cursor-text select-all font-mono text-sm">{code}</pre>
        {note && (
          <p className="text-text-muted mt-2 text-xs italic select-none">{note}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent mt-2 w-full cursor-pointer rounded-md border px-2 py-1.5 font-mono text-xs outline-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
