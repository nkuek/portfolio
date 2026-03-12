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

const PROPERTY_KEYS: Array<keyof KeyframeProperty> = [
  "translateX",
  "translateY",
  "scale",
  "rotate",
  "opacity",
  "backgroundColor",
];

function easingToName(cssValue: string): string {
  for (const [name, value] of Object.entries(EASING_PRESETS)) {
    if (value === cssValue) return name;
  }
  return cssValue;
}

function nameToEasing(name: string): string {
  return EASING_PRESETS[name] ?? name;
}

function encodeKeyframe(kf: KeyframeStop): string {
  const values = PROPERTY_KEYS.map((key) => {
    const v = kf.properties[key];
    return typeof v === "number" ? String(Math.round(v * 100) / 100) : v;
  }).join(",");

  const maskBits = PROPERTY_KEYS.map((key) => (kf.mask[key] ? "1" : "0")).join(
    "",
  );

  return `${kf.offset}:${values}:${maskBits}`;
}

function decodeKeyframe(encoded: string): KeyframeStop | null {
  const parts = encoded.split(":");
  if (parts.length !== 3) return null;

  const offsetStr = parts[0];
  const valuesStr = parts[1];
  const maskStr = parts[2];

  if (!offsetStr || !valuesStr || !maskStr) return null;

  const offset = Number(offsetStr);
  if (Number.isNaN(offset)) return null;

  const values = valuesStr.split(",");
  if (values.length !== 6) return null;

  if (maskStr.length !== 6) return null;

  const properties: KeyframeProperty = { ...DEFAULT_PROPERTIES };
  const maskObj: PropertyMask = {
    translateX: false,
    translateY: false,
    scale: false,
    rotate: false,
    opacity: false,
    backgroundColor: false,
  };

  for (let i = 0; i < PROPERTY_KEYS.length; i++) {
    const key = PROPERTY_KEYS[i];
    const raw = values[i];
    if (!key || raw === undefined) return null;

    if (key === "backgroundColor") {
      properties[key] = raw;
    } else {
      const num = Number(raw);
      if (Number.isNaN(num)) return null;
      properties[key] = num;
    }

    maskObj[key] = maskStr[i] === "1";
  }

  return {
    id: crypto.randomUUID(),
    offset,
    properties,
    mask: maskObj,
  };
}

export function encodeState(state: UrlState): string {
  const iter =
    state.iterationCount === "infinite" ? "inf" : String(state.iterationCount);
  const dir = DIRECTION_SHORT[state.direction] ?? "n";
  const fill = FILL_SHORT[state.fillMode] ?? "n";

  const preset = state.activePreset ?? "";
  const header = `${state.animationName}~${state.duration}~${iter}~${dir}~${fill}~${preset}`;

  const kfParts = state.keyframes.map(encodeKeyframe);

  const easingNames = state.segmentEasings.map((se) =>
    easingToName(se.easing),
  );
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
