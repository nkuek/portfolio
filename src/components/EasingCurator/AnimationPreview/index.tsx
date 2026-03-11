"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EasingAction, EasingState } from "../state";
import PreviewStage from "./PreviewStage";

type AnimationPreviewProps = {
  easing: string;
  pinnedEasing: string | null;
  state: EasingState;
  dispatch: React.Dispatch<EasingAction>;
};

const PAUSE_MS = 500;

function TranslatePreview({
  easing,
  pinnedEasing,
  duration,
  totalDuration,
  onAnimation,
}: {
  easing: string;
  pinnedEasing?: string | null;
  duration: number;
  totalDuration: number;
  onAnimation: (key: string, anim: Animation | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const travel = track.clientWidth - 32 - 16;
    const end = `translateX(${travel}px)`;

    const t1 = duration / totalDuration;
    const t2 = (duration + PAUSE_MS) / totalDuration;
    const t3 = (duration * 2 + PAUSE_MS) / totalDuration;

    const anim = el.animate(
      [
        { transform: "translateX(0)", offset: 0, easing },
        { transform: end, offset: t1, easing: "linear" },
        { transform: end, offset: t2, easing },
        { transform: "translateX(0)", offset: t3, easing: "linear" },
        { transform: "translateX(0)", offset: 1 },
      ],
      { duration: totalDuration, iterations: Infinity },
    );

    onAnimation("translate", anim);
    return () => {
      anim.cancel();
      onAnimation("translate", null);
    };
  }, [duration, easing, totalDuration, onAnimation]);

  // Ghost animation for pinned curve
  useEffect(() => {
    const el = ghostRef.current;
    const track = trackRef.current;
    if (!el || !track || !pinnedEasing) return;

    const travel = track.clientWidth - 32 - 16;
    const end = `translateX(${travel}px)`;

    const t1 = duration / totalDuration;
    const t2 = (duration + PAUSE_MS) / totalDuration;
    const t3 = (duration * 2 + PAUSE_MS) / totalDuration;

    const anim = el.animate(
      [
        { transform: "translateX(0)", offset: 0, easing: pinnedEasing },
        { transform: end, offset: t1, easing: "linear" },
        { transform: end, offset: t2, easing: pinnedEasing },
        { transform: "translateX(0)", offset: t3, easing: "linear" },
        { transform: "translateX(0)", offset: 1 },
      ],
      { duration: totalDuration, iterations: Infinity },
    );

    onAnimation("translate-ghost", anim);
    return () => {
      anim.cancel();
      onAnimation("translate-ghost", null);
    };
  }, [duration, pinnedEasing, totalDuration, onAnimation]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted w-16 shrink-0 font-mono text-xs">
        position
      </span>
      <div
        ref={trackRef}
        className="border-border-hairline relative flex h-12 flex-1 items-center overflow-hidden rounded-lg border px-2"
      >
        {pinnedEasing && (
          <div
            ref={ghostRef}
            className="absolute size-8 shrink-0 rounded-md bg-[var(--accent-rose)] opacity-40"
          />
        )}
        <div
          ref={boxRef}
          className="size-8 shrink-0 rounded-md bg-[var(--accent)] opacity-85"
        />
      </div>
    </div>
  );
}

export default function AnimationPreview({
  easing,
  pinnedEasing,
  state,
  dispatch,
}: AnimationPreviewProps) {
  const { duration } = state;
  const totalDuration = duration * 2 + PAUSE_MS * 2;

  const animationsRef = useRef<Map<string, Animation>>(new Map());
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const wasPausedRef = useRef(false);

  const registerAnimation = useCallback(
    (key: string, anim: Animation | null) => {
      if (anim) {
        // Sync new animation to the current time of existing ones
        const existing = animationsRef.current.values().next().value;
        if (existing && existing.currentTime != null) {
          anim.currentTime = existing.currentTime;
        }
        animationsRef.current.set(key, anim);
        if (paused) anim.pause();
      } else {
        animationsRef.current.delete(key);
      }
    },
    [paused],
  );

  // Convert raw cycle time to easing progress (0->1->0)
  const timeToProgress = useCallback(
    (time: number) => {
      const t = time % totalDuration;
      if (t < duration) return t / duration; // forward
      if (t < duration + PAUSE_MS) return 1; // hold at end
      if (t < duration * 2 + PAUSE_MS)
        return 1 - (t - duration - PAUSE_MS) / duration; // reverse
      return 0; // hold at start
    },
    [duration, totalDuration],
  );

  // Convert seeker progress (0->1) to cycle time (forward phase only)
  const progressToTime = useCallback((p: number) => p * duration, [duration]);

  // rAF loop to read currentTime for the seeker
  useEffect(() => {
    const tick = () => {
      if (!draggingRef.current) {
        const first = animationsRef.current.values().next().value;
        if (first && first.currentTime != null) {
          setProgress(timeToProgress(first.currentTime as number));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [timeToProgress]);

  const handlePlayPause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      animationsRef.current.forEach((a) => {
        if (next) a.pause();
        else a.play();
      });
      return next;
    });
  }, []);

  const handleSeekStart = useCallback(() => {
    draggingRef.current = true;
    wasPausedRef.current = paused;
    animationsRef.current.forEach((a) => a.pause());
  }, [paused]);

  const handleSeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setProgress(val);
      const time = progressToTime(val);
      animationsRef.current.forEach((a) => {
        a.currentTime = time;
      });
    },
    [progressToTime],
  );

  const handleSeekEnd = useCallback(() => {
    draggingRef.current = false;
    if (!wasPausedRef.current) {
      animationsRef.current.forEach((a) => a.play());
    }
  }, []);

  const scaleFrom = useMemo(() => ({ transform: "scale(0.4)" }), []);
  const scaleTo = useMemo(() => ({ transform: "scale(1)" }), []);
  const rotateFrom = useMemo(() => ({ transform: "rotate(0deg)" }), []);
  const rotateTo = useMemo(() => ({ transform: "rotate(360deg)" }), []);
  const opacityFrom = useMemo(() => ({ opacity: 0 }), []);
  const opacityTo = useMemo(() => ({ opacity: 1 }), []);

  return (
    <div className="flex flex-col gap-4">
      {/* Duration control */}
      <div className="flex flex-col gap-2">
        <h3 className="text-text-subtle text-sm font-medium">Preview</h3>
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-mono text-xs">Duration</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={duration}
                onChange={(e) =>
                  dispatch({
                    type: "SET_DURATION",
                    duration: parseInt(e.target.value) || 500,
                  })
                }
                className="border-border-hairline bg-surface-card-alt text-text w-16 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <span className="text-text-muted font-mono text-xs">ms</span>
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={3000}
            step={50}
            value={duration}
            onChange={(e) =>
              dispatch({
                type: "SET_DURATION",
                duration: parseInt(e.target.value),
              })
            }
            className="w-full rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </label>
      </div>

      {/* Preview stages */}
      <div className="flex flex-col gap-2">
        <TranslatePreview
          easing={easing}
          pinnedEasing={pinnedEasing}
          duration={duration}
          totalDuration={totalDuration}
          onAnimation={registerAnimation}
        />

        <PreviewStage
          label="scale"
          easing={easing}
          pinnedEasing={pinnedEasing}
          duration={duration}
          totalDuration={totalDuration}
          from={scaleFrom}
          to={scaleTo}
          onAnimation={registerAnimation}
          guide={
            <>
              <div className="border-border-hairline size-8 rounded-md border border-dashed" />
              <div className="border-border-hairline size-[13px] rounded-sm border border-dashed" />
            </>
          }
          ghostGuide={
            <>
              <div className="size-8 rounded-md border border-dashed border-[var(--accent-rose)] opacity-30" />
              <div className="size-[13px] rounded-sm border border-dashed border-[var(--accent-rose)] opacity-30" />
            </>
          }
        >
          <div className="size-8 rounded-md bg-[var(--accent)] opacity-85" />
        </PreviewStage>

        <PreviewStage
          label="rotate"
          easing={easing}
          pinnedEasing={pinnedEasing}
          duration={duration}
          totalDuration={totalDuration}
          from={rotateFrom}
          to={rotateTo}
          onAnimation={registerAnimation}
          guide={
            <div className="border-border-hairline size-8 rounded-md border border-dashed" />
          }
          ghostGuide={
            <div className="size-8 rounded-md border border-dashed border-[var(--accent-rose)] opacity-30" />
          }
        >
          <div className="size-8 rounded-md bg-[var(--accent)] opacity-85" />
        </PreviewStage>

        <PreviewStage
          label="opacity"
          easing={easing}
          pinnedEasing={pinnedEasing}
          duration={duration}
          totalDuration={totalDuration}
          from={opacityFrom}
          to={opacityTo}
          onAnimation={registerAnimation}
          guide={
            <div className="border-border-hairline size-8 rounded-md border border-dashed" />
          }
          ghostGuide={
            <div className="size-8 rounded-md border border-dashed border-[var(--accent-rose)] opacity-30" />
          }
        >
          <div className="size-8 rounded-md bg-[var(--accent)] opacity-85" />
        </PreviewStage>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={paused ? "Play" : "Pause"}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent hover:bg-accent flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93]"
        >
          {paused ? (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
              <path d="M4 2l10 6-10 6V2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
              <path d="M3 1h3v14H3zM10 1h3v14h-3z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onPointerDown={handleSeekStart}
          onChange={handleSeekInput}
          onPointerUp={handleSeekEnd}
          className="h-1.5 flex-1 cursor-pointer rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Animation timeline"
        />
      </div>
    </div>
  );
}
