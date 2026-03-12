"use client";

import type { CustomUniform } from "../types";
import type { ShaderAction } from "../state";

type UniformControlsProps = {
  uniforms: CustomUniform[];
  values: Record<string, number>;
  dispatch: React.Dispatch<ShaderAction>;
};

export default function UniformControls({
  uniforms,
  values,
  dispatch,
}: UniformControlsProps) {
  return (
    <div>
      <h3 className="text-text-subtle mb-3 text-sm font-medium">Uniforms</h3>
      <div className="flex flex-col gap-3">
        {uniforms.map((u) => {
          const currentValue = values[u.name] ?? u.value;
          return (
            <div key={u.name}>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor={`uniform-${u.name}`}
                  className="text-text font-mono text-xs"
                >
                  {u.name}
                </label>
                <span className="text-text-muted font-mono text-xs tabular-nums">
                  {currentValue.toFixed(2)}
                </span>
              </div>
              <input
                id={`uniform-${u.name}`}
                type="range"
                min={u.min}
                max={u.max}
                step={u.step}
                value={currentValue}
                onChange={(e) =>
                  dispatch({
                    type: "SET_UNIFORM",
                    name: u.name,
                    value: parseFloat(e.target.value),
                  })
                }
                className="w-full rounded outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ accentColor: "var(--accent)" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
