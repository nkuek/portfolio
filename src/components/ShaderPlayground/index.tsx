"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ToolGuide, {
  GuideGrid,
  GuideSection,
  GuideList,
  GuideItem,
  Kbd,
} from "~/components/ToolGuide";
import { shaderReducer, initialState } from "./state";
import type { ShaderState } from "./state";
import { PRESETS } from "./presets";
import { parseCustomUniforms } from "./glsl";
import CodeEditor from "./CodeEditor";
import PreviewPane from "./PreviewPane";
import PlaybackControls from "./PlaybackControls";
import PresetLibrary from "./PresetLibrary";
import UniformControls from "./UniformControls";
import ExportPanel from "./ExportPanel";
import useReducedMotion from "~/hooks/useReducedMotion";

function ShaderPlaygroundInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitRef = useRef(false);
  const timeRef = useRef(0);

  // Lazy initial state from URL
  const getInitialState = useCallback((): ShaderState => {
    const presetParam = searchParams.get("preset");
    if (presetParam) {
      const preset = PRESETS.find((p) => p.name === presetParam);
      if (preset) {
        return {
          ...initialState,
          code: preset.code,
          lastValidCode: preset.code,
          activePreset: preset.name,
        };
      }
    }
    return initialState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch] = useReducer(
    shaderReducer,
    undefined,
    getInitialState,
  );

  // Auto-pause on prefers-reduced-motion
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) {
      dispatch({ type: "SET_PLAYBACK", playback: "paused" });
    }
  }, [reducedMotion]);

  // Pause when tab is hidden, resume when visible
  const playbackRef = useRef(state.playback);
  playbackRef.current = state.playback;
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        wasPlayingRef.current = playbackRef.current === "playing";
        if (wasPlayingRef.current) {
          dispatch({ type: "SET_PLAYBACK", playback: "paused" });
        }
      } else if (wasPlayingRef.current) {
        dispatch({ type: "SET_PLAYBACK", playback: "playing" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Debounced URL sync — only ?preset=name when a preset is active
  useEffect(() => {
    if (!isInitRef.current) {
      isInitRef.current = true;
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (state.activePreset) {
        params.set("preset", state.activePreset);
      }
      const qs = params.toString();
      const url = qs ? `?${qs}` : window.location.pathname;
      router.replace(url, { scroll: false });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [state.activePreset, router]);

  // Code change handler
  const handleCodeChange = useCallback((code: string) => {
    dispatch({ type: "SET_CODE", code });
  }, []);

  // Time update callback from ShaderQuad
  const handleTimeUpdate = useCallback((time: number) => {
    timeRef.current = time;
  }, []);

  // Parse custom uniforms (memoized)
  const customUniformDefs = useMemo(
    () => parseCustomUniforms(state.code),
    [state.code],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
      <header className="mb-8 sm:mb-12">
        <h1 className="title text-text mb-2">Shader Playground</h1>
        <p className="text-text-muted text-lg font-light">
          Write, preview, and export GLSL fragment shaders in real time.
        </p>
      </header>

      <ToolGuide>
        <GuideGrid>
          <GuideSection title="Editor">
            <GuideList>
              <GuideItem>Edit GLSL — preview updates live</GuideItem>
              <GuideItem>
                <Kbd>Tab</Kbd> inserts 2 spaces; <Kbd>Shift</Kbd>+<Kbd>Alt</Kbd>
                +<Kbd>F</Kbd> formats
              </GuideItem>
              <GuideItem>
                Errors show inline with line numbers highlighted
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Uniforms">
            <GuideList>
              <GuideItem>
                Add{" "}
                <code className="text-accent font-mono text-[11px]">
                  uniform float/vec2/vec3/vec4
                </code>{" "}
                for custom sliders
              </GuideItem>
              <GuideItem>
                Use{" "}
                <code className="text-accent font-mono text-[11px]">
                  {"// range: 0, 10"}
                </code>{" "}
                to set min/max
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Playback">
            <GuideList>
              <GuideItem>
                Select a preset to start from a working shader
              </GuideItem>
              <GuideItem>
                Adjust speed (0.5x, 1x, 2x) or pause to freeze time
              </GuideItem>
            </GuideList>
          </GuideSection>
          <GuideSection title="Export">
            <GuideList>
              <GuideItem>
                Export as Raw GLSL, Three.js, TSL, or Shadertoy
              </GuideItem>
              <GuideItem>Click exported code to select all</GuideItem>
            </GuideList>
          </GuideSection>
        </GuideGrid>
      </ToolGuide>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left column — Presets, Editor, Uniforms */}
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PresetLibrary
              activePreset={state.activePreset}
              dispatch={dispatch}
            />
          </div>

          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <h3 className="text-text-subtle mb-3 text-sm font-medium">
              Fragment Shader
            </h3>
            <CodeEditor
              code={state.code}
              onChange={handleCodeChange}
              errors={state.errors}
            />
            <div
              className="mt-3 flex flex-col gap-1"
              aria-live="polite"
              role="status"
            >
              {state.errors.map((error, i) => (
                <p key={i} className="font-mono text-xs text-red-500">
                  {error.line !== null ? `Line ${error.line}: ` : ""}
                  {error.message}
                </p>
              ))}
            </div>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-[var(--ease-spring)] ${customUniformDefs.length > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="bg-surface-card border-border-hairline rounded-xl border p-4 shadow-[var(--shadow-card)]">
                <UniformControls
                  uniforms={customUniformDefs}
                  values={state.customUniforms}
                  dispatch={dispatch}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Canvas, Playback, Export */}
        <div className="order-1 min-w-0 lg:order-2">
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
            <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
              <PreviewPane
                code={state.code}
                lastValidCode={state.lastValidCode}
                customUniformDefs={customUniformDefs}
                customUniforms={state.customUniforms}
                playback={state.playback}
                speed={state.speed}
                resetCounter={state.resetCounter}
                dispatch={dispatch}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
            <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
              <PlaybackControls
                playback={state.playback}
                speed={state.speed}
                timeRef={timeRef}
                dispatch={dispatch}
              />
            </div>
            <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
              <ExportPanel code={state.code} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShaderPlayground() {
  return (
    <Suspense>
      <ShaderPlaygroundInner />
    </Suspense>
  );
}
