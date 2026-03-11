import type { BezierCurve, SpringConfig } from "../types";
import { springToLinearEasing } from "../spring";

export function formatCSS(curve: BezierCurve): string {
  return `cubic-bezier(${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2})`;
}

export function formatCSSTransition(
  curve: BezierCurve,
  duration: number,
): string {
  return `transition: all ${duration}ms ${formatCSS(curve)};`;
}

export function formatCSSVariable(
  curve: BezierCurve,
  name = "my-ease",
): string {
  return `--ease-${name}: ${formatCSS(curve)};`;
}

export function formatLinearEasing(samples: number[]): string {
  return springToLinearEasing(samples);
}

export function formatSpringKeyframes(samples: number[]): string {
  const lines = samples.map((v, i) => {
    const pct = Math.round((i / (samples.length - 1)) * 100);
    return `  ${pct}% { transform: translateX(${(v * 100).toFixed(1)}%); }`;
  });
  return `@keyframes spring {\n${lines.join("\n")}\n}`;
}

export function formatMotionConfig(config: SpringConfig): string {
  return `transition: {\n  type: "spring",\n  mass: ${config.mass},\n  stiffness: ${config.stiffness},\n  damping: ${config.damping},\n}`;
}

export function formatTailwindTheme(
  easingValue: string,
  name = "my-ease",
): string {
  return `@theme {\n  --ease-${name}: ${easingValue};\n}`;
}
