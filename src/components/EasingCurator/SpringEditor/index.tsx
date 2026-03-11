"use client";

import type { SpringConfig } from "../types";
import type { EasingAction } from "../state";

type SpringEditorProps = {
  springConfig: SpringConfig;
  settleMs: number;
  dispatch: React.Dispatch<EasingAction>;
};

const PARAMS: {
  key: "mass" | "stiffness" | "damping";
  label: string;
  tip: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "mass",
    label: "mass",
    tip: "Weight of the object. Higher mass means slower acceleration and a more sluggish feel.",
    min: 0.1,
    max: 10,
    step: 0.1,
  },
  {
    key: "stiffness",
    label: "stiffness",
    tip: "Tension of the spring. Higher stiffness snaps to the target faster with more force.",
    min: 10,
    max: 1000,
    step: 1,
  },
  {
    key: "damping",
    label: "damping",
    tip: "Friction that slows the spring. Lower values produce more oscillation, higher values settle faster.",
    min: 1,
    max: 100,
    step: 0.5,
  },
];

function dampingLabel(config: SpringConfig): string {
  const ratio =
    config.damping / (2 * Math.sqrt(config.stiffness * config.mass));
  if (ratio < 0.99) return "underdamped";
  if (ratio <= 1.01) return "critically damped";
  return "overdamped";
}

export default function SpringEditor({
  springConfig,
  settleMs,
  dispatch,
}: SpringEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      {PARAMS.map(({ key, label, tip, min, max, step }) => (
        <label key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="text-text-muted font-mono text-xs">{label}</span>
              <button
                type="button"
                aria-label={`Info: ${label}`}
                className="group relative cursor-help rounded-full outline-[var(--accent)] before:absolute before:-inset-1.5 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="peer text-text-muted/50 hover:text-text-muted group-focus-visible:text-text-muted relative size-3 transition-colors"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.2A5.8 5.8 0 1 1 2.2 8 5.8 5.8 0 0 1 8 2.2ZM8 4.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8ZM7 7.5v4h2v-4H7Z" />
                </svg>
                <span role="tooltip" className="bg-surface-card border-border-hairline text-text-muted pointer-events-none absolute bottom-full left-0 z-20 mb-1 w-44 rounded-lg border p-2.5 text-xs opacity-0 shadow-lg transition-opacity peer-hover:pointer-events-auto peer-hover:opacity-100 group-focus-visible:pointer-events-auto group-focus-visible:opacity-100">
                  {tip}
                </span>
              </button>
            </span>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={springConfig[key]}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  dispatch({
                    type: "SET_SPRING_PARAM",
                    param: key,
                    value: Math.min(max, Math.max(min, val)),
                  });
                }
              }}
              className="border-border-hairline bg-surface-card-alt text-text w-20 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={springConfig[key]}
            onChange={(e) =>
              dispatch({
                type: "SET_SPRING_PARAM",
                param: key,
                value: parseFloat(e.target.value),
              })
            }
            className="w-full rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </label>
      ))}

      {/* Computed info */}
      <div className="border-border-hairline flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted font-mono text-xs">
            {dampingLabel(springConfig)}
          </span>
          <span className="text-text-subtle font-mono text-xs">
            settles in {settleMs}ms
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "SET_DURATION", duration: settleMs })
            }
            className="border-border-hairline text-text-muted hover:border-accent hover:text-text-subtle cursor-pointer rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
          >
            Use natural
          </button>
          <button
            type="button"
            aria-label="Info: use natural duration"
            className="group relative cursor-help rounded-full outline-[var(--accent)] before:absolute before:-inset-1 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <svg
              viewBox="0 0 16 16"
              className="peer text-text-muted/50 hover:text-text-muted group-focus-visible:text-text-muted relative size-3.5 transition-colors"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.2A5.8 5.8 0 1 1 2.2 8 5.8 5.8 0 0 1 8 2.2ZM8 4.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8ZM7 7.5v4h2v-4H7Z" />
            </svg>
            <div role="tooltip" className="bg-surface-card border-border-hairline text-text-muted pointer-events-none absolute right-0 bottom-full mb-1 w-48 rounded-lg border p-2.5 text-xs opacity-0 shadow-lg transition-opacity peer-hover:pointer-events-auto peer-hover:opacity-100 group-focus-visible:pointer-events-auto group-focus-visible:opacity-100">
              Sets the preview duration to this spring&apos;s natural settle
              time ({settleMs}ms) — the point where motion is imperceptible.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
