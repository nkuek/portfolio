import type {
  AnimationDirection,
  FillMode,
  KeyframeStop,
  SegmentEasing,
} from "../types";
import { parseCubicBezier } from "../constants";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildTransform(kf: KeyframeStop): string | null {
  const parts: string[] = [];
  if (kf.mask.translateX) parts.push(`translateX(${round(kf.properties.translateX)}px)`);
  if (kf.mask.translateY) parts.push(`translateY(${round(kf.properties.translateY)}px)`);
  if (kf.mask.scale) parts.push(`scale(${round(kf.properties.scale)})`);
  if (kf.mask.rotate) parts.push(`rotate(${round(kf.properties.rotate)}deg)`);
  return parts.length > 0 ? parts.join(" ") : null;
}

function findEasingForKeyframe(
  kf: KeyframeStop,
  segmentEasings: SegmentEasing[],
): string | null {
  const segment = segmentEasings.find((se) => se.fromId === kf.id);
  return segment?.easing ?? null;
}

export function formatCSSKeyframes(
  name: string,
  keyframes: KeyframeStop[],
  segmentEasings: SegmentEasing[],
): string {
  const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);
  const lines: string[] = [`@keyframes ${name} {`];

  for (let i = 0; i < sorted.length; i++) {
    const kf = sorted[i];
    if (!kf) continue;
    const isLast = i === sorted.length - 1;
    const props: string[] = [];

    if (kf.mask.opacity) {
      props.push(`    opacity: ${round(kf.properties.opacity)};`);
    }
    if (kf.mask.backgroundColor) {
      props.push(`    background-color: ${kf.properties.backgroundColor};`);
    }

    const transform = buildTransform(kf);
    if (transform) {
      props.push(`    transform: ${transform};`);
    }

    if (!isLast) {
      const easing = findEasingForKeyframe(kf, segmentEasings);
      if (easing) {
        props.push(`    animation-timing-function: ${easing};`);
      }
    }

    lines.push(`  ${kf.offset}% {`);
    for (const prop of props) {
      lines.push(prop);
    }
    lines.push("  }");
  }

  lines.push("}");
  return lines.join("\n");
}

export function formatCSSAnimation(
  name: string,
  duration: number,
  iterationCount: number | "infinite",
  direction: AnimationDirection,
  fillMode: FillMode,
): string {
  return `animation: ${name} ${duration}ms linear ${iterationCount} ${direction} ${fillMode};`;
}

export function formatTailwind(
  name: string,
  keyframes: KeyframeStop[],
  segmentEasings: SegmentEasing[],
  duration: number,
  iterationCount: number | "infinite",
  direction: AnimationDirection,
  fillMode: FillMode,
): string {
  const themeBlock = [
    "@theme {",
    `  --animate-${name}: ${name} ${duration}ms linear ${iterationCount} ${direction} ${fillMode};`,
    "}",
  ].join("\n");

  const keyframesBlock = formatCSSKeyframes(name, keyframes, segmentEasings);

  return `${themeBlock}\n\n${keyframesBlock}`;
}

export function formatFramerMotion(
  keyframes: KeyframeStop[],
  segmentEasings: SegmentEasing[],
  duration: number,
): string {
  const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);

  const propertyMap: Record<string, { framerKey: string; values: (number | string)[] }> = {};

  // Determine which properties have at least one mask enabled
  const hasOpacity = sorted.some((kf) => kf.mask.opacity);
  const hasTranslateX = sorted.some((kf) => kf.mask.translateX);
  const hasTranslateY = sorted.some((kf) => kf.mask.translateY);
  const hasScale = sorted.some((kf) => kf.mask.scale);
  const hasRotate = sorted.some((kf) => kf.mask.rotate);
  const hasBackgroundColor = sorted.some((kf) => kf.mask.backgroundColor);

  if (hasOpacity) propertyMap.opacity = { framerKey: "opacity", values: [] };
  if (hasTranslateX) propertyMap.translateX = { framerKey: "x", values: [] };
  if (hasTranslateY) propertyMap.translateY = { framerKey: "y", values: [] };
  if (hasScale) propertyMap.scale = { framerKey: "scale", values: [] };
  if (hasRotate) propertyMap.rotate = { framerKey: "rotate", values: [] };
  if (hasBackgroundColor) propertyMap.backgroundColor = { framerKey: "backgroundColor", values: [] };

  for (const kf of sorted) {
    if (hasOpacity) propertyMap.opacity?.values.push(round(kf.properties.opacity));
    if (hasTranslateX) propertyMap.translateX?.values.push(round(kf.properties.translateX));
    if (hasTranslateY) propertyMap.translateY?.values.push(round(kf.properties.translateY));
    if (hasScale) propertyMap.scale?.values.push(round(kf.properties.scale));
    if (hasRotate) propertyMap.rotate?.values.push(round(kf.properties.rotate));
    if (hasBackgroundColor) propertyMap.backgroundColor?.values.push(kf.properties.backgroundColor);
  }

  const times = sorted.map((kf) => round(kf.offset / 100));

  // Build ease array: one per segment (keyframes.length - 1)
  const easeEntries: (number[] | string)[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const kf = sorted[i];
    if (!kf) continue;
    const easing = findEasingForKeyframe(kf, segmentEasings);
    const parsed = easing ? parseCubicBezier(easing) : null;
    easeEntries.push(parsed ?? "linear");
  }

  // Build animate object lines
  const animateLines: string[] = [];
  for (const entry of Object.values(propertyMap)) {
    const valStr = entry.values
      .map((v) => (typeof v === "string" ? `"${v}"` : v))
      .join(", ");
    animateLines.push(`    ${entry.framerKey}: [${valStr}],`);
  }

  // Build ease string
  const easeStr = easeEntries
    .map((e) => {
      if (typeof e === "string") return `"${e}"`;
      return `[${e.join(", ")}]`;
    })
    .join(", ");

  const lines = [
    "{",
    "  animate: {",
    ...animateLines,
    "  },",
    "  transition: {",
    `    duration: ${round(duration / 1000)},`,
    `    times: [${times.join(", ")}],`,
    `    ease: [${easeStr}],`,
    "  },",
    "}",
  ];

  return lines.join("\n");
}
