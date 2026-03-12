"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatRawGLSL,
  formatThreeJS,
  formatTSL,
  formatShadertoy,
} from "./formatters";

type ExportFormat = "raw" | "threejs" | "tsl" | "shadertoy";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  raw: "Raw GLSL",
  threejs: "Three.js",
  tsl: "TSL",
  shadertoy: "Shadertoy",
};

const FORMATS: ExportFormat[] = ["raw", "threejs", "tsl", "shadertoy"];

type ExportPanelProps = {
  code: string;
};

export default function ExportPanel({ code }: ExportPanelProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("tsl");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const formatted = useMemo(() => {
    switch (activeFormat) {
      case "raw":
        return formatRawGLSL(code);
      case "threejs":
        return formatThreeJS(code);
      case "tsl":
        return formatTSL(code);
      case "shadertoy":
        return formatShadertoy(code);
    }
  }, [code, activeFormat]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [formatted]);

  return (
    <div>
      <h3 className="text-text-subtle mb-3 text-sm font-medium">Export</h3>

      {/* Format selector */}
      <div
        className="mb-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Export format"
      >
        {FORMATS.map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setActiveFormat(fmt)}
            aria-pressed={activeFormat === fmt}
            className={`cursor-pointer rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
              activeFormat === fmt
                ? "border-accent bg-accent text-white"
                : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent"
            }`}
          >
            {FORMAT_LABELS[fmt]}
          </button>
        ))}
      </div>

      {/* Code display */}
      <div className="relative">
        <pre
          data-lenis-prevent
          className="bg-surface-card-alt text-text h-48 overflow-auto rounded-lg p-3 pr-16 font-mono text-xs"
        >
          <code>{formatted}</code>
        </pre>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent absolute top-2 right-2 cursor-pointer rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
