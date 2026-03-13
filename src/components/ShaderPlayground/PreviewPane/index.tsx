"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import type { ShaderAction } from "../state";
import type { CustomUniform } from "../types";

type PreviewPaneProps = {
  code: string;
  lastValidCode: string;
  customUniformDefs: CustomUniform[];
  customUniforms: Record<string, number[]>;
  playback: "playing" | "paused";
  speed: number;
  resetCounter: number;
  seekTimeRef: React.RefObject<number | null>;
  invalidateRef: React.RefObject<(() => void) | null>;
  dispatch: React.Dispatch<ShaderAction>;
  onTimeUpdate: (time: number) => void;
};

/** Error boundary to catch WebGL crashes gracefully */
type ErrorBoundaryProps = { children: ReactNode; fallback: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class WebGLErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CanvasPlaceholder() {
  return (
    <div className="bg-surface-card-alt aspect-square max-h-[min(100vw,600px)] w-full" />
  );
}

/** Dynamic import to disable SSR for the R3F Canvas */
const PreviewCanvas = dynamic(() => import("./PreviewCanvas"), {
  ssr: false,
  loading: CanvasPlaceholder,
});

export default function PreviewPane(props: PreviewPaneProps) {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = fullscreenRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  return (
    <div ref={fullscreenRef} className="relative">
      <WebGLErrorBoundary
        fallback={
          <div className="bg-surface-card-alt text-text-muted flex aspect-square max-h-[min(100vw,600px)] w-full items-center justify-center font-mono text-sm">
            WebGL is not available in this browser.
          </div>
        }
      >
        <PreviewCanvas {...props} isFullscreen={isFullscreen} />
      </WebGLErrorBoundary>

      {/* Fullscreen toggle */}
      <button
        type="button"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={toggleFullscreen}
        className="border-border-hairline bg-surface-card/80 text-text-muted hover:border-accent hover:text-accent absolute top-2 right-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      >
        {isFullscreen ? (
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
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
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
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </div>
  );
}
