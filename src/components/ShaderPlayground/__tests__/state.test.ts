import { describe, it, expect } from "vitest";
import { shaderReducer, initialState } from "../state";
import type { ShaderState } from "../state";
import { DEFAULT_FRAGMENT_SHADER } from "../constants";

describe("shaderReducer", () => {
  describe("initialState", () => {
    it("has correct defaults", () => {
      expect(initialState.code).toBe(DEFAULT_FRAGMENT_SHADER);
      expect(initialState.lastValidCode).toBe(DEFAULT_FRAGMENT_SHADER);
      expect(initialState.activePreset).toBeNull();
      expect(initialState.errors).toEqual([]);
      expect(initialState.playback).toBe("playing");
      expect(initialState.speed).toBe(1);
      expect(initialState.customUniforms).toEqual({});
      expect(initialState.resetCounter).toBe(0);
    });
  });

  describe("SET_CODE", () => {
    it("updates code", () => {
      const next = shaderReducer(initialState, {
        type: "SET_CODE",
        code: "void main() {}",
      });
      expect(next.code).toBe("void main() {}");
    });

    it("clears activePreset when code changes", () => {
      const state: ShaderState = { ...initialState, activePreset: "Plasma" };
      const next = shaderReducer(state, {
        type: "SET_CODE",
        code: "new code",
      });
      expect(next.activePreset).toBeNull();
    });

    it("preserves other state fields", () => {
      const state: ShaderState = {
        ...initialState,
        speed: 2,
        playback: "paused",
        customUniforms: { brightness: 0.5 },
      };
      const next = shaderReducer(state, {
        type: "SET_CODE",
        code: "new code",
      });
      expect(next.speed).toBe(2);
      expect(next.playback).toBe("paused");
      expect(next.customUniforms).toEqual({ brightness: 0.5 });
    });
  });

  describe("SELECT_PRESET", () => {
    it("sets code and activePreset", () => {
      const next = shaderReducer(initialState, {
        type: "SELECT_PRESET",
        name: "Plasma",
        code: "plasma code",
      });
      expect(next.code).toBe("plasma code");
      expect(next.activePreset).toBe("Plasma");
    });

    it("clears errors", () => {
      const state: ShaderState = {
        ...initialState,
        errors: [{ line: 5, message: "syntax error" }],
      };
      const next = shaderReducer(state, {
        type: "SELECT_PRESET",
        name: "Solid",
        code: "solid code",
      });
      expect(next.errors).toEqual([]);
    });

    it("clears customUniforms", () => {
      const state: ShaderState = {
        ...initialState,
        customUniforms: { brightness: 0.8 },
      };
      const next = shaderReducer(state, {
        type: "SELECT_PRESET",
        name: "Solid",
        code: "solid code",
      });
      expect(next.customUniforms).toEqual({});
    });

    it("resets speed to 1", () => {
      const state: ShaderState = { ...initialState, speed: 2 };
      const next = shaderReducer(state, {
        type: "SELECT_PRESET",
        name: "Solid",
        code: "solid code",
      });
      expect(next.speed).toBe(1);
    });
  });

  describe("COMPILATION_SUCCESS", () => {
    it("copies code to lastValidCode", () => {
      const state: ShaderState = {
        ...initialState,
        code: "new valid code",
        lastValidCode: "old code",
      };
      const next = shaderReducer(state, { type: "COMPILATION_SUCCESS" });
      expect(next.lastValidCode).toBe("new valid code");
    });

    it("clears errors", () => {
      const state: ShaderState = {
        ...initialState,
        errors: [{ line: 3, message: "error" }],
      };
      const next = shaderReducer(state, { type: "COMPILATION_SUCCESS" });
      expect(next.errors).toEqual([]);
    });
  });

  describe("SET_ERRORS", () => {
    it("stores parsed errors", () => {
      const errors = [
        { line: 5, message: "unexpected token" },
        { line: 10, message: "undeclared variable" },
      ];
      const next = shaderReducer(initialState, {
        type: "SET_ERRORS",
        errors,
      });
      expect(next.errors).toEqual(errors);
    });

    it("does not update lastValidCode", () => {
      const state: ShaderState = {
        ...initialState,
        code: "broken code",
        lastValidCode: "good code",
      };
      const next = shaderReducer(state, {
        type: "SET_ERRORS",
        errors: [{ line: 1, message: "error" }],
      });
      expect(next.lastValidCode).toBe("good code");
    });
  });

  describe("SET_PLAYBACK", () => {
    it("sets playback to paused", () => {
      const next = shaderReducer(initialState, {
        type: "SET_PLAYBACK",
        playback: "paused",
      });
      expect(next.playback).toBe("paused");
    });

    it("sets playback to playing", () => {
      const state: ShaderState = { ...initialState, playback: "paused" };
      const next = shaderReducer(state, {
        type: "SET_PLAYBACK",
        playback: "playing",
      });
      expect(next.playback).toBe("playing");
    });
  });

  describe("SET_SPEED", () => {
    it("changes speed", () => {
      const next = shaderReducer(initialState, {
        type: "SET_SPEED",
        speed: 0.5,
      });
      expect(next.speed).toBe(0.5);
    });

    it("accepts all valid speed options", () => {
      for (const speed of [0.25, 0.5, 1, 2]) {
        const next = shaderReducer(initialState, {
          type: "SET_SPEED",
          speed,
        });
        expect(next.speed).toBe(speed);
      }
    });
  });

  describe("RESET_TIME", () => {
    it("increments resetCounter", () => {
      const next = shaderReducer(initialState, { type: "RESET_TIME" });
      expect(next.resetCounter).toBe(1);
    });

    it("increments from current value", () => {
      const state: ShaderState = { ...initialState, resetCounter: 5 };
      const next = shaderReducer(state, { type: "RESET_TIME" });
      expect(next.resetCounter).toBe(6);
    });
  });

  describe("SET_UNIFORM", () => {
    it("updates a specific uniform value", () => {
      const next = shaderReducer(initialState, {
        type: "SET_UNIFORM",
        name: "brightness",
        value: 0.75,
      });
      expect(next.customUniforms).toEqual({ brightness: 0.75 });
    });

    it("preserves other uniforms", () => {
      const state: ShaderState = {
        ...initialState,
        customUniforms: { brightness: 0.5, contrast: 1.2 },
      };
      const next = shaderReducer(state, {
        type: "SET_UNIFORM",
        name: "brightness",
        value: 0.9,
      });
      expect(next.customUniforms).toEqual({ brightness: 0.9, contrast: 1.2 });
    });

    it("adds a new uniform to existing map", () => {
      const state: ShaderState = {
        ...initialState,
        customUniforms: { brightness: 0.5 },
      };
      const next = shaderReducer(state, {
        type: "SET_UNIFORM",
        name: "scale",
        value: 2.0,
      });
      expect(next.customUniforms).toEqual({ brightness: 0.5, scale: 2.0 });
    });
  });
});
