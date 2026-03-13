"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AnimationPresetCategory } from "../types";
import type { KeyframeSequencerAction } from "../state";
import { PRESETS, CATEGORY_LABELS } from "../presets";

type PresetLibraryProps = {
  activePreset: string | null;
  lastPreset: string | null;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const CATEGORIES: AnimationPresetCategory[] = [
  "entrance",
  "exit",
  "emphasis",
  "motion",
];

function categoryForPreset(name: string | null): AnimationPresetCategory {
  if (!name) return "entrance";
  return PRESETS.find((p) => p.name === name)?.category ?? "entrance";
}

export default function PresetLibrary({
  activePreset,
  lastPreset,
  dispatch,
}: PresetLibraryProps) {
  const isModified = lastPreset !== null && activePreset === null;
  const [activeCategory, setActiveCategory] = useState<AnimationPresetCategory>(
    () => categoryForPreset(activePreset),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [clipPath, setClipPath] = useState("inset(0 100% 0 0 round 9999px)");

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const idx = CATEGORIES.indexOf(activeCategory);
      const button = container.children[idx] as HTMLElement | undefined;
      if (!button) return;
      const left = button.offsetLeft;
      const right = container.offsetWidth - left - button.offsetWidth;
      const top = button.offsetTop;
      const bottom = container.offsetHeight - top - button.offsetHeight;
      setClipPath(
        `inset(${top}px ${right}px ${bottom}px ${left}px round 9999px)`,
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeCategory]);

  const activePresetCategory = useMemo(() => {
    if (!activePreset) return null;
    return PRESETS.find((p) => p.name === activePreset)?.category ?? null;
  }, [activePreset]);

  const filteredPresets = PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div>
      <h3 className="text-text-subtle mb-3 text-sm font-medium">Presets</h3>

      {/* Category pills */}
      <div
        ref={containerRef}
        className="relative mb-3 flex gap-2 overflow-x-auto"
        role="group"
        aria-label="Preset categories"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`relative shrink-0 cursor-pointer rounded-full border px-2.5 py-1 font-mono text-xs outline-[var(--accent)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] ${
              activeCategory === cat
                ? "border-transparent"
                : "border-border-hairline text-text-muted hover:border-accent"
            }`}
          >
            {CATEGORY_LABELS[cat]}
            <span
              aria-hidden="true"
              className={`bg-accent absolute -top-0.5 -right-0.5 size-2 rounded-full transition-opacity duration-200 ${
                activePresetCategory === cat && activeCategory !== cat
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />
          </button>
        ))}
        {/* Sliding accent indicator */}
        <div
          aria-hidden="true"
          className="bg-accent pointer-events-none absolute inset-0 flex gap-2 transition-[clip-path] duration-200 ease-[var(--ease-spring)]"
          style={{ clipPath }}
        >
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="shrink-0 rounded-full border border-transparent px-2.5 py-1 font-mono text-xs text-white"
            >
              {CATEGORY_LABELS[cat]}
            </span>
          ))}
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-col gap-2">
        {filteredPresets.map((preset) => {
          const isLast = isModified && lastPreset === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => dispatch({ type: "LOAD_PRESET", preset })}
              aria-pressed={activePreset === preset.name}
              className={`relative w-full cursor-pointer rounded-md border px-3 py-2 text-left font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                activePreset === preset.name
                  ? "border-accent bg-accent/10 text-accent"
                  : isLast
                    ? "text-text-subtle hover:border-accent border-amber-400/60"
                    : "border-border-hairline text-text-subtle hover:border-accent"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isLast && (
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-amber-400"
                  />
                )}
                <span className="font-medium">{preset.name}</span>
                {isLast && (
                  <span className="text-text-muted text-[10px] font-normal">
                    (modified)
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
