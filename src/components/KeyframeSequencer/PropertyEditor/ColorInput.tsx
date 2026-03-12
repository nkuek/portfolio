"use client";

import { useCallback, useState } from "react";
import cn from "~/utils/cn";
import type { KeyframeSequencerAction } from "../state";

type ColorInputProps = {
  keyframeId: string;
  color: string;
  masked: boolean;
  dispatch: React.Dispatch<KeyframeSequencerAction>;
};

const HEX_PATTERN = /^#[\da-f]{6}$/i;

export default function ColorInput({
  keyframeId,
  color,
  masked,
  dispatch,
}: ColorInputProps) {
  const [hexDraft, setHexDraft] = useState(color);

  const handleColorChange = useCallback(
    (value: string) => {
      setHexDraft(value);
      dispatch({
        type: "SET_PROPERTY",
        keyframeId,
        property: "backgroundColor",
        value,
      });
    },
    [keyframeId, dispatch],
  );

  const handleHexInput = useCallback((raw: string) => {
    setHexDraft(raw);
  }, []);

  const handleHexBlur = useCallback(() => {
    const normalized = hexDraft.startsWith("#") ? hexDraft : `#${hexDraft}`;
    if (HEX_PATTERN.test(normalized)) {
      dispatch({
        type: "SET_PROPERTY",
        keyframeId,
        property: "backgroundColor",
        value: normalized,
      });
      setHexDraft(normalized);
    } else {
      setHexDraft(color);
    }
  }, [hexDraft, color, keyframeId, dispatch]);

  const handleToggleMask = useCallback(() => {
    dispatch({
      type: "TOGGLE_PROPERTY_MASK",
      keyframeId,
      property: "backgroundColor",
    });
  }, [keyframeId, dispatch]);

  const colorInputId = `color-picker-${keyframeId}`;
  const hexInputId = `color-hex-${keyframeId}`;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-text-subtle text-xs font-medium">Color</h4>
      <div className={cn("flex items-center gap-2", !masked && "opacity-50")}>
        <input
          type="checkbox"
          id={`mask-${keyframeId}-backgroundColor`}
          checked={masked}
          onChange={handleToggleMask}
          className="size-3.5 shrink-0 cursor-pointer rounded accent-[var(--accent)]"
        />
        <label
          htmlFor={colorInputId}
          className="text-text-muted w-12 shrink-0 font-mono text-xs"
        >
          Color
        </label>
        <input
          type="color"
          id={colorInputId}
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded border-none bg-transparent outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span
          className="size-5 shrink-0 rounded-sm border border-white/20"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <label htmlFor={hexInputId} className="sr-only">
          Hex color value
        </label>
        <input
          type="text"
          id={hexInputId}
          value={hexDraft}
          onChange={(e) => handleHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          maxLength={7}
          spellCheck={false}
          className="border-border-hairline bg-surface-card-alt text-text w-20 shrink-0 rounded-md border px-2 py-1 font-mono text-xs outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </div>
    </div>
  );
}
