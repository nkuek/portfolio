"use client";

import { useCallback } from "react";
import cn from "~/utils/cn";
import { PROPERTY_RANGES } from "../constants";
import type { KeyframeStop } from "../types";
import type { KeyframeSequencerAction } from "../state";
import TransformInputs from "./TransformInputs";
import ColorInput from "./ColorInput";

type PropertyEditorProps = {
  keyframe: KeyframeStop | null;
  isEndpoint: boolean;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const opacityRange = PROPERTY_RANGES.opacity;

export default function PropertyEditor({
  keyframe,
  isEndpoint,
  dispatch,
}: PropertyEditorProps) {
  const handleOpacityChange = useCallback(
    (raw: string) => {
      if (!keyframe) return;
      const num = parseFloat(raw);
      if (isNaN(num)) return;
      const clamped = Math.min(
        opacityRange.max,
        Math.max(opacityRange.min, num),
      );
      dispatch({
        type: "SET_PROPERTY",
        keyframeId: keyframe.id,
        property: "opacity",
        value: clamped,
      });
    },
    [keyframe, dispatch],
  );

  const handleOpacityMaskToggle = useCallback(() => {
    if (!keyframe) return;
    dispatch({
      type: "TOGGLE_PROPERTY_MASK",
      keyframeId: keyframe.id,
      property: "opacity",
    });
  }, [keyframe, dispatch]);

  const handleDelete = useCallback(() => {
    if (!keyframe || isEndpoint) return;
    dispatch({ type: "REMOVE_KEYFRAME", id: keyframe.id });
  }, [keyframe, isEndpoint, dispatch]);

  const handleDuplicate = useCallback(() => {
    if (!keyframe) return;
    dispatch({ type: "DUPLICATE_KEYFRAME", id: keyframe.id });
  }, [keyframe, dispatch]);

  if (!keyframe) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted text-sm">
          Select a keyframe to edit properties
        </p>
      </div>
    );
  }

  const opacityActive = keyframe.mask.opacity;
  const opacityInputId = `opacity-${keyframe.id}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <h3 className="text-text-subtle text-sm font-medium">
        Keyframe at{" "}
        <span className="text-text font-mono">{keyframe.offset}%</span>
      </h3>

      {/* Transform properties */}
      <TransformInputs
        keyframeId={keyframe.id}
        properties={keyframe.properties}
        mask={keyframe.mask}
        dispatch={dispatch}
      />

      {/* Opacity */}
      <div className="flex flex-col gap-3">
        <h4 className="text-text-subtle text-xs font-medium">Opacity</h4>
        <div
          className={cn(
            "flex items-center gap-2",
            !opacityActive && "opacity-50",
          )}
        >
          <input
            type="checkbox"
            id={`mask-${keyframe.id}-opacity`}
            checked={opacityActive}
            onChange={handleOpacityMaskToggle}
            className="size-3.5 shrink-0 cursor-pointer rounded accent-[var(--accent)]"
          />
          <label
            htmlFor={opacityInputId}
            className="text-text-muted w-10 shrink-0 font-mono text-xs"
          >
            Alpha
          </label>
          <input
            type="range"
            id={opacityInputId}
            min={opacityRange.min}
            max={opacityRange.max}
            step={opacityRange.step}
            value={keyframe.properties.opacity}
            onChange={(e) => handleOpacityChange(e.target.value)}
            className="min-w-0 flex-1 rounded accent-[var(--accent)] outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <input
            type="number"
            min={opacityRange.min}
            max={opacityRange.max}
            step={opacityRange.step}
            value={keyframe.properties.opacity}
            onChange={(e) => handleOpacityChange(e.target.value)}
            aria-label="Opacity value"
            className="border-border-hairline bg-surface-card-alt text-text hidden w-16 shrink-0 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 sm:block"
          />
        </div>
      </div>

      {/* Color */}
      <ColorInput
        keyframeId={keyframe.id}
        color={keyframe.properties.backgroundColor}
        masked={keyframe.mask.backgroundColor}
        dispatch={dispatch}
      />

      {/* Actions */}
      <div className="border-border-hairline flex items-center gap-2 border-t pt-4">
        <button
          type="button"
          onClick={handleDuplicate}
          className="border-border-hairline bg-surface-card text-text-subtle hover:border-accent cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isEndpoint}
          className={cn(
            "rounded-md border px-3 py-1.5 font-mono text-xs outline-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]",
            isEndpoint
              ? "border-border-hairline text-text-muted cursor-not-allowed opacity-40"
              : "cursor-pointer border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
          )}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
