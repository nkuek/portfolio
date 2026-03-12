"use client";

import { useCallback, useEffect, useRef } from "react";
import { SPEED_OPTIONS } from "../constants";
import type { ShaderAction } from "../state";

type PlaybackControlsProps = {
  playback: "playing" | "paused";
  speed: number;
  timeRef: React.RefObject<number>;
  dispatch: React.Dispatch<ShaderAction>;
};

export default function PlaybackControls({
  playback,
  speed,
  timeRef,
  dispatch,
}: PlaybackControlsProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);

  // Update time display via direct DOM writes to avoid 60fps re-renders
  useEffect(() => {
    const tick = () => {
      if (displayRef.current) {
        const t = timeRef.current ?? 0;
        displayRef.current.textContent = `${t.toFixed(1)}s`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [timeRef]);

  const togglePlayback = useCallback(() => {
    dispatch({
      type: "SET_PLAYBACK",
      playback: playback === "playing" ? "paused" : "playing",
    });
  }, [playback, dispatch]);

  const resetTime = useCallback(() => {
    dispatch({ type: "RESET_TIME" });
  }, [dispatch]);

  const setSpeed = useCallback(
    (s: number) => {
      dispatch({ type: "SET_SPEED", speed: s });
    },
    [dispatch],
  );

  const isPlaying = playback === "playing";

  return (
    <div className="flex items-center gap-2">
      {/* Play / Pause */}
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause shader" : "Play shader"}
        className="group border-border-hairline text-text-muted hover:border-accent hover:text-accent flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
      >
        {isPlaying ? (
          <svg
            viewBox="0 0 16 16"
            className="peer size-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 1h3v14H3zM10 1h3v14h-3z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            className="peer size-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4 2l10 6-10 6V2z" />
          </svg>
        )}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={resetTime}
        aria-label="Reset time"
        className="group border-border-hairline text-text-muted hover:border-accent hover:text-accent flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
      >
        <svg
          viewBox="0 0 16 16"
          className="peer size-3.5"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 1a7 7 0 0 0-7 7h2a5 5 0 0 1 9.17-2.74L10 7h5V2l-1.76 1.76A7 7 0 0 0 8 1zM1 10h5l-2.17 2.17A5 5 0 0 0 13 8h2a7 7 0 0 1-12.24 4.24L1 14V10z" />
        </svg>
      </button>

      {/* Speed buttons */}
      <div className="flex gap-1" role="group" aria-label="Playback speed">
        {SPEED_OPTIONS.map((s: number) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            aria-label={`Playback speed ${s}x`}
            className={`cursor-pointer rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
              speed === s
                ? "border-accent bg-accent text-white"
                : "border-border-hairline text-text-muted hover:border-accent"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Time display */}
      <span
        ref={displayRef}
        aria-label="Elapsed shader time"
        className="text-text-muted ml-auto font-mono text-xs tabular-nums"
      >
        0.0s
      </span>
    </div>
  );
}
