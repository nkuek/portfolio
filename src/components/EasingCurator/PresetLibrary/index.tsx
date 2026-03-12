"use client";

import { useMemo, useState } from "react";
import type { BezierCurve, PresetCategory } from "../types";
import type { EasingAction, EditorMode } from "../state";
import { PRESETS, CATEGORY_LABELS } from "../constants";
import { SPRING_PRESETS, simulateSpring } from "../spring";
import type { SpringPresetEntry } from "../spring";

type PresetLibraryProps = {
  editorPanel: EditorMode;
  activePreset: string | null;
  pinnedPresetName: string | null;
  pinnedSpringPresetName: string | null;
  dispatch: React.Dispatch<EasingAction>;
};

function MiniCurve({ curve }: { curve: BezierCurve }) {
  const { x1, y1, x2, y2 } = curve;
  const sy1 = 1 - y1;
  const sy2 = 1 - y2;

  const minY = Math.min(0, sy1, sy2) - 0.1;
  const maxY = Math.max(1, sy1, sy2) + 0.1;
  const hasOvershoot = y1 > 1 || y2 > 1 || y1 < 0 || y2 < 0;

  return (
    <svg
      viewBox={`-0.05 ${minY} 1.1 ${maxY - minY}`}
      className="size-8 shrink-0 overflow-hidden"
    >
      {hasOvershoot && (
        <line
          x1={0}
          y1={0}
          x2={1}
          y2={0}
          stroke="currentColor"
          strokeWidth={0.04}
          strokeDasharray="0.06 0.06"
          opacity={0.3}
        />
      )}
      <path
        d={`M 0 1 C ${x1} ${sy1} ${x2} ${sy2} 1 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.08}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Pre-compute spring samples for mini curves
const SPRING_PRESET_SAMPLES: Map<string, number[]> = new Map(
  SPRING_PRESETS.map((p) => [p.name, simulateSpring(p.config).samples]),
);

function MiniSpringCurve({ samples }: { samples: number[] }) {
  const minVal = Math.min(...samples);
  const maxVal = Math.max(...samples);
  const padding = 0.1;
  const yMin = Math.min(0, minVal) - padding;
  const yMax = Math.max(1, maxVal) + padding;
  const yRange = yMax - yMin;

  const points = samples
    .map((v, i) => {
      const x = i / (samples.length - 1);
      const y = yMax - v;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`-0.05 ${yMin} 1.1 ${yRange}`}
      className="size-8 shrink-0 overflow-hidden"
    >
      {maxVal > 1.01 && (
        <line
          x1={0}
          y1={yMax - 1}
          x2={1}
          y2={yMax - 1}
          stroke="currentColor"
          strokeWidth={0.04 * yRange}
          strokeDasharray={`${0.06 * yRange} ${0.06 * yRange}`}
          opacity={0.3}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.08 * yRange}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PIN_ICON = (
  <svg viewBox="0 0 16 16" className="size-3" fill="currentColor" aria-hidden="true">
    <path d="M9.828 1.515a.5.5 0 0 1 .707 0l3.95 3.95a.5.5 0 0 1-.122.796l-2.678 1.339-.507.507 1.165 3.494a.5.5 0 0 1-.129.512L11.16 13.16a.5.5 0 0 1-.707 0L7.05 9.757l-3.464 3.464a.5.5 0 0 1-.707-.707L6.343 9.05 2.94 5.647a.5.5 0 0 1 0-.707l1.047-1.053a.5.5 0 0 1 .512-.129l3.494 1.165.507-.507L9.839 2.34l-.01-.118a.5.5 0 0 1 0-.707z" />
  </svg>
);

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as PresetCategory[];

const CATEGORIES = PRESETS.reduce<Record<string, typeof PRESETS>>(
  (acc, preset) => {
    (acc[preset.category] ??= []).push(preset);
    return acc;
  },
  {},
);

export default function PresetLibrary({
  editorPanel,
  activePreset,
  pinnedPresetName,
  pinnedSpringPresetName,
  dispatch,
}: PresetLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(() => {
    if (activePreset) {
      if (SPRING_PRESETS.some((p) => p.name === activePreset)) return "spring";
      const found = PRESETS.find((p) => p.name === activePreset);
      if (found) return found.category;
    }
    return editorPanel === "spring" ? "spring" : "standard";
  });

  const presets = CATEGORIES[activeCategory] ?? [];

  // Which category has the active/pinned preset?
  const activeCategoryForPreset = useMemo(() => {
    if (!activePreset) return null;
    if (SPRING_PRESETS.some((p) => p.name === activePreset))
      return "spring" as PresetCategory;
    return PRESETS.find((p) => p.name === activePreset)?.category ?? null;
  }, [activePreset]);

  const pinnedCategoryForPreset = useMemo(() => {
    if (pinnedPresetName) {
      return PRESETS.find((p) => p.name === pinnedPresetName)?.category ?? null;
    }
    if (pinnedSpringPresetName) return "spring" as PresetCategory;
    return null;
  }, [pinnedPresetName, pinnedSpringPresetName]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-text-subtle text-sm font-medium">Presets</h3>

      {/* Category tabs — hidden when only 1 category */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap">
        {CATEGORY_KEYS.map((key) => {
          const hasActive = activeCategoryForPreset === key;
          const hasPinned = pinnedCategoryForPreset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveCategory(key);
                dispatch({
                  type: "SET_MODE",
                  mode: key === "spring" ? "spring" : "bezier",
                });
              }}
              className={`relative shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
                activeCategory === key
                  ? "border-accent bg-accent text-white"
                  : "border-border-hairline text-text-muted hover:border-accent cursor-pointer"
              }`}
            >
              {CATEGORY_LABELS[key]}
              <span
                className={`absolute -top-0.5 -right-0.5 size-2 rounded-full transition-opacity duration-200 ${hasPinned && !hasActive ? "bg-[var(--accent-rose)]" : "bg-[var(--accent)]"} ${(hasActive || hasPinned) && activeCategory !== key ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-1">
        {activeCategory === "spring"
          ? SPRING_PRESETS.map((preset) => (
              <SpringPresetButton
                key={preset.name}
                preset={preset}
                isActive={activePreset === preset.name}
                isPinned={pinnedSpringPresetName === preset.name}
                dispatch={dispatch}
              />
            ))
          : presets.map((preset) => {
              const isActive = activePreset === preset.name;
              const isPinned = pinnedPresetName === preset.name;

              return (
                <div
                  key={preset.name}
                  className="flex min-w-0 items-center gap-1"
                >
                  <button
                    type="button"
                    draggable
                    onClick={() =>
                      dispatch({
                        type: "SELECT_PRESET",
                        name: preset.name,
                        curve: preset.curve,
                      })
                    }
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-easing-preset",
                        JSON.stringify({
                          type: "bezier",
                          name: preset.name,
                          curve: preset.curve,
                        }),
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ${
                      isActive
                        ? "border-accent bg-accent text-white"
                        : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer"
                    }`}
                    aria-pressed={isActive}
                  >
                    <MiniCurve curve={preset.curve} />
                    <span className="truncate">{preset.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        isPinned
                          ? { type: "UNPIN_CURVE" }
                          : {
                              type: "PIN_CURVE",
                              curve: preset.curve,
                              name: preset.name,
                            },
                      )
                    }
                    aria-label={
                      isPinned ? "Unpin" : `Pin ${preset.name} for comparison`
                    }
                    aria-pressed={isPinned}
                    className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93] ${
                      isPinned
                        ? "border-accent-rose bg-accent-rose text-white"
                        : "border-border-hairline text-text-muted hover:border-accent-rose hover:text-accent-rose"
                    }`}
                  >
                    {PIN_ICON}
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}

function SpringPresetButton({
  preset,
  isActive,
  isPinned,
  dispatch,
}: {
  preset: SpringPresetEntry;
  isActive: boolean;
  isPinned: boolean;
  dispatch: React.Dispatch<EasingAction>;
}) {
  const samples = SPRING_PRESET_SAMPLES.get(preset.name) ?? [];

  return (
    <div className="flex min-w-0 items-center gap-1">
      <button
        type="button"
        draggable
        onClick={() =>
          dispatch({
            type: "SELECT_SPRING_PRESET",
            name: preset.name,
            config: preset.config,
          })
        }
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/x-easing-preset",
            JSON.stringify({
              type: "spring",
              name: preset.name,
              config: preset.config,
            }),
          );
          e.dataTransfer.effectAllowed = "copy";
        }}
        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ${
          isActive
            ? "border-accent bg-accent text-white"
            : "border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer"
        }`}
        aria-pressed={isActive}
      >
        <MiniSpringCurve samples={samples} />
        <span className="truncate">{preset.name}</span>
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch(
            isPinned
              ? { type: "UNPIN_SPRING" }
              : {
                  type: "PIN_SPRING",
                  config: preset.config,
                  name: preset.name,
                },
          )
        }
        aria-label={isPinned ? "Unpin" : `Pin ${preset.name} for comparison`}
        aria-pressed={isPinned}
        className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.93] ${
          isPinned
            ? "border-accent-rose bg-accent-rose text-white"
            : "border-border-hairline text-text-muted hover:border-accent-rose hover:text-accent-rose"
        }`}
      >
        {PIN_ICON}
      </button>
    </div>
  );
}
