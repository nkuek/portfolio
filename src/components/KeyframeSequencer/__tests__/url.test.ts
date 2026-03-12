import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "../url";
import type { KeyframeStop, SegmentEasing } from "../types";
import { DEFAULT_PROPERTIES, EASING_PRESETS } from "../constants";

function makeKeyframe(
  offset: number,
  overrides: Partial<typeof DEFAULT_PROPERTIES> = {},
  maskKeys: Array<keyof typeof DEFAULT_PROPERTIES> = ["opacity"],
): KeyframeStop {
  return {
    id: crypto.randomUUID(),
    offset,
    properties: { ...DEFAULT_PROPERTIES, ...overrides },
    mask: {
      translateX: maskKeys.includes("translateX"),
      translateY: maskKeys.includes("translateY"),
      scale: maskKeys.includes("scale"),
      rotate: maskKeys.includes("rotate"),
      opacity: maskKeys.includes("opacity"),
      backgroundColor: maskKeys.includes("backgroundColor"),
    },
  };
}

function makeEasings(
  keyframes: KeyframeStop[],
  names: string[],
): SegmentEasing[] {
  const result: SegmentEasing[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (!from || !to) continue;
    const name = names[i] ?? "ease";
    result.push({
      fromId: from.id,
      toId: to.id,
      easing: EASING_PRESETS[name] ?? name,
      easingName: name,
    });
  }
  return result;
}

function compareKeyframes(a: KeyframeStop[], b: KeyframeStop[]) {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i]?.offset).toBe(b[i]?.offset);
    expect(a[i]?.properties).toEqual(b[i]?.properties);
    expect(a[i]?.mask).toEqual(b[i]?.mask);
  }
}

function compareEasings(a: SegmentEasing[], b: SegmentEasing[]) {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i]?.easing).toBe(b[i]?.easing);
    expect(a[i]?.easingName).toBe(b[i]?.easingName);
  }
}

describe("url encode/decode", () => {
  it("round-trips basic state", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease-out"]),
      animationName: "fadeIn",
      duration: 800,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);

    expect(decoded).not.toBeNull();
    if (!decoded) return;

    expect(decoded.animationName).toBe("fadeIn");
    expect(decoded.duration).toBe(800);
    expect(decoded.iterationCount).toBe(1);
    expect(decoded.direction).toBe("normal");
    expect(decoded.fillMode).toBe("none");
    compareKeyframes(decoded.keyframes, state.keyframes);
    compareEasings(decoded.segmentEasings, state.segmentEasings);
  });

  it("round-trips with custom animation name", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease"]),
      animationName: "my-custom-anim",
      duration: 500,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.animationName).toBe("my-custom-anim");
  });

  it("round-trips with infinite iteration count", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease"]),
      animationName: "loop",
      duration: 1000,
      iterationCount: "infinite" as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.iterationCount).toBe("infinite");
  });

  it("round-trips with alternate direction", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease"]),
      animationName: "alt",
      duration: 1000,
      iterationCount: 2 as number | "infinite",
      direction: "alternate" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.direction).toBe("alternate");
  });

  it("round-trips with backwards fill", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease"]),
      animationName: "fill-test",
      duration: 600,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "backwards" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.fillMode).toBe("backwards");
  });

  it("round-trips with multiple keyframes", () => {
    const kfs = [
      makeKeyframe(0, { scale: 1 }, ["scale"]),
      makeKeyframe(50, { scale: 1.05 }, ["scale"]),
      makeKeyframe(100, { scale: 1 }, ["scale"]),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease-in-out", "ease-in-out"]),
      animationName: "pulse",
      duration: 600,
      iterationCount: "infinite" as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded).not.toBeNull();
    if (!decoded) return;

    expect(decoded.keyframes.length).toBe(3);
    compareKeyframes(decoded.keyframes, state.keyframes);
    compareEasings(decoded.segmentEasings, state.segmentEasings);
  });

  it("round-trips with different easing presets per segment", () => {
    const kfs = [
      makeKeyframe(0, { translateY: 0 }, ["translateY"]),
      makeKeyframe(30, { translateY: -30 }, ["translateY"]),
      makeKeyframe(50, { translateY: 0 }, ["translateY"]),
      makeKeyframe(100, { translateY: 0 }, ["translateY"]),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease-out", "ease-in", "spring"]),
      animationName: "bounce",
      duration: 800,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded).not.toBeNull();
    if (!decoded) return;

    expect(decoded.segmentEasings[0]?.easingName).toBe("ease-out");
    expect(decoded.segmentEasings[1]?.easingName).toBe("ease-in");
    expect(decoded.segmentEasings[2]?.easingName).toBe("spring");
  });

  it("decode returns null for empty string", () => {
    expect(decodeState("")).toBeNull();
  });

  it("decode returns null for malformed input", () => {
    expect(decodeState("garbage")).toBeNull();
    expect(decodeState("a~b~c")).toBeNull();
    expect(decodeState("name~NaN~1~n~n|bad")).toBeNull();
    expect(decodeState("name~1000~1~x~n|0:0:000000|100:0:000000|e:ease")).toBeNull();
  });

  it("round-trips preserving all property values", () => {
    const kfs = [
      makeKeyframe(
        0,
        {
          translateX: -150,
          translateY: 75,
          scale: 0.5,
          rotate: -180,
          opacity: 0.25,
          backgroundColor: "#ff0000",
        },
        ["translateX", "translateY", "scale", "rotate", "opacity", "backgroundColor"],
      ),
      makeKeyframe(
        100,
        {
          translateX: 100,
          translateY: -50,
          scale: 2.5,
          rotate: 270,
          opacity: 0.9,
          backgroundColor: "#00ff00",
        },
        ["translateX", "translateY", "scale", "rotate", "opacity", "backgroundColor"],
      ),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["back-out"]),
      animationName: "all-props",
      duration: 1200,
      iterationCount: 3 as number | "infinite",
      direction: "alternate-reverse" as const,
      fillMode: "both" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded).not.toBeNull();
    if (!decoded) return;

    expect(decoded.direction).toBe("alternate-reverse");
    expect(decoded.fillMode).toBe("both");
    expect(decoded.iterationCount).toBe(3);
    compareKeyframes(decoded.keyframes, state.keyframes);
    compareEasings(decoded.segmentEasings, state.segmentEasings);
  });

  it("round-trips activePreset", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease-out"]),
      animationName: "fadeIn",
      duration: 800,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: "fadeIn",
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.activePreset).toBe("fadeIn");
  });

  it("round-trips null activePreset", () => {
    const kfs = [
      makeKeyframe(0, { opacity: 0 }),
      makeKeyframe(100, { opacity: 1 }),
    ];
    const state = {
      keyframes: kfs,
      segmentEasings: makeEasings(kfs, ["ease"]),
      animationName: "custom",
      duration: 500,
      iterationCount: 1 as number | "infinite",
      direction: "normal" as const,
      fillMode: "none" as const,
      activePreset: null,
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded?.activePreset).toBeNull();
  });
});
