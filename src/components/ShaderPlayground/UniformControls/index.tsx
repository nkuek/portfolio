"use client";

import type { CustomUniform } from "../types";
import type { ShaderAction } from "../state";

type UniformControlsProps = {
  uniforms: CustomUniform[];
  values: Record<string, number[]>;
  dispatch: React.Dispatch<ShaderAction>;
};

const VECTOR_LABELS = ["x", "y", "z", "w"] as const;

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
          const currentValues = values[u.name] ?? u.value;
          return (
            <div key={u.name}>
              <span className="text-text mb-1 block font-mono text-xs">
                {u.name}
                <span className="text-text-muted ml-1.5">{u.type}</span>
              </span>
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: u.components }, (_, i) => {
                  const componentValue = currentValues[i] ?? u.min;
                  const label =
                    u.components === 1
                      ? u.name
                      : `${u.name}.${VECTOR_LABELS[i]}`;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {u.components > 1 && (
                        <span className="text-text-muted w-3 shrink-0 font-mono text-[10px]">
                          {VECTOR_LABELS[i]}
                        </span>
                      )}
                      <input
                        id={`uniform-${u.name}-${i}`}
                        type="range"
                        aria-label={label}
                        min={u.min}
                        max={u.max}
                        step={u.step}
                        value={componentValue}
                        onChange={(e) => {
                          const next = [...currentValues];
                          next[i] = parseFloat(e.target.value);
                          dispatch({
                            type: "SET_UNIFORM",
                            name: u.name,
                            value: next,
                          });
                        }}
                        className="min-w-0 flex-1 rounded outline-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span className="text-text-muted w-10 shrink-0 text-right font-mono text-[10px] tabular-nums">
                        {componentValue.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
