"use client";

import { Component } from "react";
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
  return (
    <WebGLErrorBoundary
      fallback={
        <div className="bg-surface-card-alt text-text-muted flex aspect-square max-h-[min(100vw,600px)] w-full items-center justify-center font-mono text-sm">
          WebGL is not available in this browser.
        </div>
      }
    >
      <PreviewCanvas {...props} />
    </WebGLErrorBoundary>
  );
}
