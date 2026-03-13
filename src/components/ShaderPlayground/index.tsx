"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ToolGuide, {
  GuideGrid,
  GuideSection,
  GuideList,
  GuideItem,
  Kbd,
} from "~/components/ToolGuide";
import useHistoryReducer from "~/hooks/useHistoryReducer";
import cn from "~/utils/cn";
import { shaderReducer, initialState, NON_UNDOABLE } from "./state";
import type { ShaderState } from "./state";
import { PRESETS } from "./presets";
import { SHADER_GUIDE_COMMENT } from "./constants";
import { parseCustomUniforms } from "./glsl";
import { encodeShaderUrl, decodeShaderUrl } from "./url";
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
  const seekTimeRef = useRef<number | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  const scrollToLineRef = useRef<((line: number) => void) | null>(null);

  // Track whether we need to decode a ?code= param asynchronously
  const [pendingDecode, setPendingDecode] = useState<string | null>(null);

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
          lastPreset: preset.name,
        };
      }
    }
    // Check for encoded shader state
    const codeParam = searchParams.get("code");
    if (codeParam) {
      // Can't await in a lazy init — defer to useEffect
      setPendingDecode(codeParam);
    }
    return initialState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch, { canUndo, canRedo }] = useHistoryReducer(
    shaderReducer,
    getInitialState,
    { nonUndoable: NON_UNDOABLE },
  );

  // Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      // Don't capture when focused on a textarea (the code editor has its own behavior)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      if (e.shiftKey) {
        dispatch({ type: "REDO" });
      } else {
        dispatch({ type: "UNDO" });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch]);

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

  // Decode ?code= param asynchronously on mount
  useEffect(() => {
    if (!pendingDecode) return;
    let cancelled = false;
    decodeShaderUrl(pendingDecode).then((decoded) => {
      if (cancelled || !decoded) return;
      const code = SHADER_GUIDE_COMMENT + "\n" + decoded.code;
      dispatch({ type: "SET_CODE", code });
      if (decoded.speed !== 1) {
        dispatch({ type: "SET_SPEED", speed: decoded.speed });
      }
      for (const [name, value] of Object.entries(decoded.uniforms)) {
        dispatch({ type: "SET_UNIFORM", name, value });
      }
      setPendingDecode(null);
    });
    return () => {
      cancelled = true;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced URL sync
  useEffect(() => {
    if (!isInitRef.current) {
      isInitRef.current = true;
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (state.activePreset) {
        // Simple preset URL
        const params = new URLSearchParams();
        params.set("preset", state.activePreset);
        router.replace(`?${params.toString()}`, { scroll: false });
      } else {
        // Encode full shader state
        encodeShaderUrl(state.code, state.speed, state.customUniforms).then(
          (encoded) => {
            if (encoded.length > 1800) {
              // Too long for URL — just clear params
              router.replace(window.location.pathname, { scroll: false });
              return;
            }
            const params = new URLSearchParams();
            params.set("code", encoded);
            router.replace(`?${params.toString()}`, { scroll: false });
          },
        );
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [
    state.activePreset,
    state.code,
    state.speed,
    state.customUniforms,
    router,
  ]);

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

      {/* Undo / Redo toolbar */}
      <div className="mb-6 flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "UNDO" })}
          className={cn(
            "border-border-hairline bg-surface-card flex size-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]",
            canUndo
              ? "text-text-subtle hover:border-accent hover:bg-accent hover:text-white"
              : "text-text-muted cursor-not-allowed opacity-40",
          )}
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
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "REDO" })}
          className={cn(
            "border-border-hairline bg-surface-card flex size-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]",
            canRedo
              ? "text-text-subtle hover:border-accent hover:bg-accent hover:text-white"
              : "text-text-muted cursor-not-allowed opacity-40",
          )}
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
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13" />
          </svg>
        </button>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left column — Presets, Editor, Uniforms */}
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
            <PresetLibrary
              activePreset={state.activePreset}
              lastPreset={state.lastPreset}
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
              scrollToLineRef={scrollToLineRef}
            />
            <div
              className="mt-3 flex flex-col gap-1"
              aria-live="polite"
              role="status"
            >
              {state.errors.map((error, i) => (
                <p key={i} className="font-mono text-xs text-red-500">
                  {error.line !== null ? (
                    <button
                      type="button"
                      className="cursor-pointer underline decoration-red-500/40 hover:decoration-red-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500"
                      onClick={() => scrollToLineRef.current?.(error.line ?? 1)}
                    >
                      Line {error.line}:
                    </button>
                  ) : null}
                  {error.line !== null ? " " : ""}
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
                seekTimeRef={seekTimeRef}
                invalidateRef={invalidateRef}
                dispatch={dispatch}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
            <div className="bg-surface-card border-border-hairline min-w-0 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-card)]">
              <PlaybackControls
                playback={state.playback}
                speed={state.speed}
                timeRef={timeRef}
                seekTimeRef={seekTimeRef}
                invalidateRef={invalidateRef}
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
