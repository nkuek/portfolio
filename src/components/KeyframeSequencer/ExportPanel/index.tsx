"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  AnimationDirection,
  ExportFormat,
  FillMode,
  KeyframeStop,
  SegmentEasing,
} from "../types";
import {
  formatCSSAnimation,
  formatCSSKeyframes,
  formatFramerMotion,
  formatTailwind,
} from "./formatters";

type ExportPanelProps = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasing[];
  animationName: string;
  duration: number;
  iterationCount: number | "infinite";
  direction: AnimationDirection;
  fillMode: FillMode;
};

const FORMATS: ExportFormat[] = [
  "css-keyframes",
  "css-animation",
  "tailwind",
  "framer-motion",
];

const FORMAT_LABELS: Record<ExportFormat, string> = {
  "css-keyframes": "CSS @keyframes",
  "css-animation": "CSS animation",
  tailwind: "Tailwind v4",
  "framer-motion": "Framer Motion",
};

export default function ExportPanel({
  keyframes,
  segmentEasings,
  animationName,
  duration,
  iterationCount,
  direction,
  fillMode,
}: ExportPanelProps) {
  const [activeFormat, setActiveFormat] =
    useState<ExportFormat>("css-keyframes");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const code = useMemo(() => {
    switch (activeFormat) {
      case "css-keyframes":
        return formatCSSKeyframes(animationName, keyframes, segmentEasings);
      case "css-animation":
        return formatCSSAnimation(
          animationName,
          duration,
          iterationCount,
          direction,
          fillMode,
        );
      case "tailwind":
        return formatTailwind(
          animationName,
          keyframes,
          segmentEasings,
          duration,
          iterationCount,
          direction,
          fillMode,
        );
      case "framer-motion":
        return formatFramerMotion(keyframes, segmentEasings, duration);
    }
  }, [
    activeFormat,
    animationName,
    keyframes,
    segmentEasings,
    duration,
    iterationCount,
    direction,
    fillMode,
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

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-text-subtle text-sm font-medium">Export</h3>

      <div className="flex flex-wrap gap-1.5">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFormat(f)}
            className={`rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
              activeFormat === f
                ? "border-accent bg-accent text-white"
                : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer"
            }`}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="relative">
        <div
          data-lenis-prevent
          className="bg-surface-card-alt max-h-48 overflow-auto rounded-lg p-3 pr-16"
        >
          <pre className="text-text overflow-x-auto font-mono text-sm">{code}</pre>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent absolute top-2 right-2 cursor-pointer rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
