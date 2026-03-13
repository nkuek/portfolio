import type {
  KeyframeStop,
  SegmentEasing,
  AnimationDirection,
  FillMode,
  KeyframeProperty,
  PropertyMask,
} from "./types";
import { DEFAULT_PROPERTIES, EASING_PRESETS } from "./constants";

type UrlState = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasing[];
  animationName: string;
  duration: number;
  iterationCount: number | "infinite";
  direction: AnimationDirection;
  fillMode: FillMode;
  activePreset: string | null;
};

const DIRECTION_SHORT: Record<AnimationDirection, string> = {
  normal: "n",
  reverse: "r",
  alternate: "a",
  "alternate-reverse": "ar",
};

const DIRECTION_LONG: Record<string, AnimationDirection> = {
  n: "normal",
  r: "reverse",
  a: "alternate",
  ar: "alternate-reverse",
};

const FILL_SHORT: Record<FillMode, string> = {
  none: "n",
  forwards: "f",
  backwards: "b",
  both: "bo",
};

const FILL_LONG: Record<string, FillMode> = {
  n: "none",
  f: "forwards",
  b: "backwards",
  bo: "both",
};

/** Short keys for encoding individual properties. */
const PROP_SHORT: Record<keyof KeyframeProperty, string> = {
  translateX: "tX",
  translateY: "tY",
  scale: "s",
  rotate: "r",
  opacity: "o",
  backgroundColor: "bg",
};

const PROP_LONG: Record<string, keyof KeyframeProperty> = Object.fromEntries(
  Object.entries(PROP_SHORT).map(([k, v]) => [v, k as keyof KeyframeProperty]),
);

function easingToName(cssValue: string): string {
  for (const [name, value] of Object.entries(EASING_PRESETS)) {
    if (value === cssValue) return name;
  }
  return cssValue;
}

function nameToEasing(name: string): string {
  return EASING_PRESETS[name] ?? name;
}

/** Encode a color for URL: strip leading # */
function encodeColor(color: string): string {
  return color.startsWith("#") ? color.slice(1) : color;
}

/** Decode a color from URL: re-add # */
function decodeColor(encoded: string): string {
  return encoded.startsWith("#") ? encoded : `#${encoded}`;
}

function formatNum(v: number): string {
  return String(Math.round(v * 100) / 100);
}

/**
 * Encode a keyframe as `offset:key=val,key=val,...`
 * Only masked (active) properties that differ from defaults are included.
 */
function encodeKeyframe(kf: KeyframeStop): string {
  const parts: string[] = [];

  for (const [prop, short] of Object.entries(PROP_SHORT)) {
    const key = prop as keyof KeyframeProperty;
    if (!kf.mask[key]) continue;

    const val = kf.properties[key];
    if (key === "backgroundColor") {
      parts.push(`${short}=${encodeColor(val as string)}`);
    } else {
      parts.push(`${short}=${formatNum(val as number)}`);
    }
  }

  return `${kf.offset}:${parts.join(",")}`;
}

function decodeKeyframe(encoded: string): KeyframeStop | null {
  const colonIdx = encoded.indexOf(":");
  if (colonIdx === -1) return null;

  const offsetStr = encoded.slice(0, colonIdx);
  const propsStr = encoded.slice(colonIdx + 1);

  const offset = Number(offsetStr);
  if (Number.isNaN(offset)) return null;

  const properties: KeyframeProperty = { ...DEFAULT_PROPERTIES };
  const mask: PropertyMask = {
    translateX: false,
    translateY: false,
    scale: false,
    rotate: false,
    opacity: false,
    backgroundColor: false,
  };

  // Empty props string means all defaults with no mask
  if (propsStr) {
    const pairs = propsStr.split(",");
    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) continue;

      const short = pair.slice(0, eqIdx);
      const rawVal = pair.slice(eqIdx + 1);
      const propKey = PROP_LONG[short];
      if (!propKey) continue;

      mask[propKey] = true;

      if (propKey === "backgroundColor") {
        properties[propKey] = decodeColor(rawVal);
      } else {
        const num = Number(rawVal);
        if (Number.isNaN(num)) return null;
        properties[propKey] = num;
      }
    }
  }

  return { id: crypto.randomUUID(), offset, properties, mask };
}

export function encodeState(state: UrlState): string {
  const iter =
    state.iterationCount === "infinite" ? "inf" : String(state.iterationCount);
  const dir = DIRECTION_SHORT[state.direction] ?? "n";
  const fill = FILL_SHORT[state.fillMode] ?? "n";

  const preset = state.activePreset ?? "";
  const header = `${state.animationName}~${state.duration}~${iter}~${dir}~${fill}~${preset}`;

  const kfParts = state.keyframes.map(encodeKeyframe);

  const easingNames = state.segmentEasings.map((se) => easingToName(se.easing));
  const easingsPart = `e:${easingNames.join(",")}`;

  return [header, ...kfParts, easingsPart].join("|");
}

export function decodeState(encoded: string): UrlState | null {
  if (!encoded) return null;

  const segments = encoded.split("|");
  if (segments.length < 3) return null;

  const header = segments[0];
  if (!header) return null;

  const headerParts = header.split("~");
  if (headerParts.length < 5) return null;

  const [name, durationStr, iterStr, dirStr, fillStr, presetStr] = headerParts;
  if (!name || !durationStr || !iterStr || !dirStr || !fillStr) return null;

  const duration = Number(durationStr);
  if (Number.isNaN(duration)) return null;

  const iterationCount: number | "infinite" =
    iterStr === "inf" ? "infinite" : Number(iterStr);
  if (typeof iterationCount === "number" && Number.isNaN(iterationCount))
    return null;

  const direction = DIRECTION_LONG[dirStr];
  if (!direction) return null;

  const fillMode = FILL_LONG[fillStr];
  if (!fillMode) return null;

  // Last segment should be easings
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment?.startsWith("e:")) return null;

  const easingNamesStr = lastSegment.slice(2);
  const easingNames = easingNamesStr ? easingNamesStr.split(",") : [];

  // Middle segments are keyframes
  const keyframeSegments = segments.slice(1, -1);
  const keyframes: KeyframeStop[] = [];

  for (const seg of keyframeSegments) {
    const kf = decodeKeyframe(seg);
    if (!kf) return null;
    keyframes.push(kf);
  }

  if (keyframes.length < 2) return null;

  // Rebuild segment easings
  const segmentEasings: SegmentEasing[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (!from || !to) continue;
    const eName = easingNames[i] ?? "ease";
    segmentEasings.push({
      fromId: from.id,
      toId: to.id,
      easing: nameToEasing(eName),
      easingName: eName,
    });
  }

  return {
    keyframes,
    segmentEasings,
    animationName: name,
    duration,
    iterationCount,
    direction,
    fillMode,
    activePreset: presetStr || null,
  };
}
