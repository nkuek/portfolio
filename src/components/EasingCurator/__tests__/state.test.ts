import { describe, it, expect } from "vitest";
import { easingReducer, initialState } from "../state";
import type { EasingState } from "../state";

describe("easingReducer", () => {
  describe("SET_MODE", () => {
    it("changes editorPanel without changing mode", () => {
      const next = easingReducer(initialState, {
        type: "SET_MODE",
        mode: "spring",
      });
      expect(next.editorPanel).toBe("spring");
      expect(next.mode).toBe(initialState.mode);
    });
  });

  describe("SET_CURVE", () => {
    it("updates curve and clears activePreset", () => {
      const curve = { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 };
      const next = easingReducer(
        { ...initialState, activePreset: "ease" },
        { type: "SET_CURVE", curve },
      );
      expect(next.curve).toEqual(curve);
      expect(next.activePreset).toBeNull();
      expect(next.mode).toBe("bezier");
    });
  });

  describe("SET_HANDLE", () => {
    it("updates p1 handle", () => {
      const next = easingReducer(initialState, {
        type: "SET_HANDLE",
        handle: "p1",
        x: 0.5,
        y: 0.8,
      });
      expect(next.curve.x1).toBe(0.5);
      expect(next.curve.y1).toBe(0.8);
      expect(next.curve.x2).toBe(initialState.curve.x2);
      expect(next.curve.y2).toBe(initialState.curve.y2);
    });

    it("updates p2 handle", () => {
      const next = easingReducer(initialState, {
        type: "SET_HANDLE",
        handle: "p2",
        x: 0.7,
        y: 0.3,
      });
      expect(next.curve.x2).toBe(0.7);
      expect(next.curve.y2).toBe(0.3);
      expect(next.curve.x1).toBe(initialState.curve.x1);
      expect(next.curve.y1).toBe(initialState.curve.y1);
    });

    it("clears activePreset and sets mode to bezier", () => {
      const state: EasingState = {
        ...initialState,
        mode: "spring",
        activePreset: "default",
      };
      const next = easingReducer(state, {
        type: "SET_HANDLE",
        handle: "p1",
        x: 0.5,
        y: 0.5,
      });
      expect(next.activePreset).toBeNull();
      expect(next.mode).toBe("bezier");
    });
  });

  describe("SET_DURATION", () => {
    it("updates duration", () => {
      const next = easingReducer(initialState, {
        type: "SET_DURATION",
        duration: 2000,
      });
      expect(next.duration).toBe(2000);
    });
  });

  describe("SELECT_PRESET", () => {
    it("sets curve, name, mode, and resets duration", () => {
      const curve = { x1: 0.42, y1: 0, x2: 1, y2: 1 };
      const state: EasingState = { ...initialState, duration: 2000 };
      const next = easingReducer(state, {
        type: "SELECT_PRESET",
        name: "ease-in",
        curve,
      });
      expect(next.curve).toEqual(curve);
      expect(next.activePreset).toBe("ease-in");
      expect(next.mode).toBe("bezier");
      expect(next.editorPanel).toBe("bezier");
      expect(next.duration).toBe(1000);
    });
  });

  describe("PIN_CURVE / UNPIN_CURVE", () => {
    it("pins current curve when no args", () => {
      const next = easingReducer(initialState, { type: "PIN_CURVE" });
      expect(next.pinnedCurve).toEqual(initialState.curve);
      expect(next.pinnedPresetName).toBe(initialState.activePreset);
    });

    it("pins specific curve when provided", () => {
      const curve = { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 };
      const next = easingReducer(initialState, {
        type: "PIN_CURVE",
        curve,
        name: "custom",
      });
      expect(next.pinnedCurve).toEqual(curve);
      expect(next.pinnedPresetName).toBe("custom");
    });

    it("clears pinned spring when pinning bezier", () => {
      const state: EasingState = {
        ...initialState,
        pinnedSpringConfig: { mass: 1, stiffness: 100, damping: 10 },
        pinnedSpringPresetName: "default",
      };
      const next = easingReducer(state, { type: "PIN_CURVE" });
      expect(next.pinnedSpringConfig).toBeNull();
      expect(next.pinnedSpringPresetName).toBeNull();
    });

    it("unpin clears pinned curve", () => {
      const state: EasingState = {
        ...initialState,
        pinnedCurve: { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 },
        pinnedPresetName: "test",
      };
      const next = easingReducer(state, { type: "UNPIN_CURVE" });
      expect(next.pinnedCurve).toBeNull();
      expect(next.pinnedPresetName).toBeNull();
    });
  });

  describe("SET_SPRING_PARAM", () => {
    it("updates spring config and clears preset", () => {
      const state: EasingState = {
        ...initialState,
        activePreset: "default",
      };
      const next = easingReducer(state, {
        type: "SET_SPRING_PARAM",
        param: "stiffness",
        value: 200,
      });
      expect(next.springConfig.stiffness).toBe(200);
      expect(next.activePreset).toBeNull();
      expect(next.mode).toBe("spring");
    });

    it("only updates the specified param", () => {
      const next = easingReducer(initialState, {
        type: "SET_SPRING_PARAM",
        param: "damping",
        value: 25,
      });
      expect(next.springConfig.damping).toBe(25);
      expect(next.springConfig.mass).toBe(initialState.springConfig.mass);
      expect(next.springConfig.stiffness).toBe(
        initialState.springConfig.stiffness,
      );
    });
  });

  describe("SELECT_SPRING_PRESET", () => {
    it("sets config, name, mode, and resets duration", () => {
      const config = { mass: 1, stiffness: 180, damping: 12 };
      const state: EasingState = { ...initialState, duration: 2000 };
      const next = easingReducer(state, {
        type: "SELECT_SPRING_PRESET",
        name: "bouncy",
        config,
      });
      expect(next.springConfig).toEqual(config);
      expect(next.activePreset).toBe("bouncy");
      expect(next.mode).toBe("spring");
      expect(next.editorPanel).toBe("spring");
      expect(next.duration).toBe(1000);
    });
  });

  describe("PIN_SPRING / UNPIN_SPRING", () => {
    it("pins current spring when no args", () => {
      const state: EasingState = {
        ...initialState,
        mode: "spring",
        activePreset: "default",
      };
      const next = easingReducer(state, { type: "PIN_SPRING" });
      expect(next.pinnedSpringConfig).toEqual(state.springConfig);
      expect(next.pinnedSpringPresetName).toBe("default");
    });

    it("clears pinned bezier when pinning spring", () => {
      const state: EasingState = {
        ...initialState,
        pinnedCurve: { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 },
        pinnedPresetName: "test",
      };
      const next = easingReducer(state, { type: "PIN_SPRING" });
      expect(next.pinnedCurve).toBeNull();
      expect(next.pinnedPresetName).toBeNull();
    });

    it("unpin clears pinned spring", () => {
      const state: EasingState = {
        ...initialState,
        pinnedSpringConfig: { mass: 1, stiffness: 100, damping: 10 },
        pinnedSpringPresetName: "default",
      };
      const next = easingReducer(state, { type: "UNPIN_SPRING" });
      expect(next.pinnedSpringConfig).toBeNull();
      expect(next.pinnedSpringPresetName).toBeNull();
    });
  });

  describe("SET_OVERLAY", () => {
    it("sets overlay type", () => {
      const next = easingReducer(initialState, {
        type: "SET_OVERLAY",
        overlay: "velocity",
      });
      expect(next.overlay).toBe("velocity");
    });

    it("can toggle back to none", () => {
      const state: EasingState = { ...initialState, overlay: "velocity" };
      const next = easingReducer(state, {
        type: "SET_OVERLAY",
        overlay: "none",
      });
      expect(next.overlay).toBe("none");
    });
  });
});
