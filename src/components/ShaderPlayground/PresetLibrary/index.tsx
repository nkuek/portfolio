"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ShaderPresetCategory } from "../types";
import type { ShaderAction } from "../state";
import { CATEGORY_LABELS } from "../constants";
import { PRESETS } from "../presets";

type PresetLibraryProps = {
  activePreset: string | null;
  dispatch: React.Dispatch<ShaderAction>;
};

const CATEGORIES: ShaderPresetCategory[] = ["basics", "patterns", "effects"];

function categoryForPreset(name: string | null): ShaderPresetCategory {
  if (!name) return "basics";
  return PRESETS.find((p) => p.name === name)?.category ?? "basics";
}

export default function PresetLibrary({
  activePreset,
  dispatch,
}: PresetLibraryProps) {
  const [activeCategory, setActiveCategory] =
    useState<ShaderPresetCategory>(() => categoryForPreset(activePreset));
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

  // Which category contains the active preset?
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
        className="relative mb-3 flex gap-2"
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
        {filteredPresets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() =>
              dispatch({
                type: "SELECT_PRESET",
                name: preset.name,
                code: preset.code,
              })
            }
            aria-pressed={activePreset === preset.name}
            className={`w-full cursor-pointer rounded-md border px-3 py-2 text-left font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              activePreset === preset.name
                ? "border-accent bg-accent/10 text-accent"
                : "border-border-hairline text-text-subtle hover:border-accent"
            }`}
          >
            <span className="block font-medium">{preset.name}</span>
            <span className="text-text-muted block">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
