import type { ShaderError } from "./types";
import { DEFAULT_FRAGMENT_SHADER, SHADER_GUIDE_COMMENT } from "./constants";

export type ShaderState = {
  code: string;
  activePreset: string | null;
  lastValidCode: string;
  errors: ShaderError[];
  playback: "playing" | "paused";
  speed: number;
  customUniforms: Record<string, number[]>;
  resetCounter: number;
};

export type ShaderAction =
  | { type: "SET_CODE"; code: string }
  | { type: "SELECT_PRESET"; name: string; code: string }
  | { type: "SET_ERRORS"; errors: ShaderError[] }
  | { type: "COMPILATION_SUCCESS" }
  | { type: "SET_PLAYBACK"; playback: "playing" | "paused" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "RESET_TIME" }
  | { type: "SET_UNIFORM"; name: string; value: number[] };

export const initialState: ShaderState = {
  code: DEFAULT_FRAGMENT_SHADER,
  activePreset: "UV Gradient",
  lastValidCode: DEFAULT_FRAGMENT_SHADER,
  errors: [],
  playback: "playing",
  speed: 1,
  customUniforms: {},
  resetCounter: 0,
};

export function shaderReducer(
  state: ShaderState,
  action: ShaderAction,
): ShaderState {
  switch (action.type) {
    case "SET_CODE":
      return { ...state, code: action.code, activePreset: null };
    case "SELECT_PRESET": {
      const code = SHADER_GUIDE_COMMENT + "\n" + action.code;
      return {
        ...state,
        code,
        lastValidCode: code,
        activePreset: action.name,
        errors: [],
        customUniforms: {},
        speed: 1,
      };
    }
    case "COMPILATION_SUCCESS":
      return { ...state, lastValidCode: state.code, errors: [] };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "SET_PLAYBACK":
      return { ...state, playback: action.playback };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "RESET_TIME":
      return { ...state, resetCounter: state.resetCounter + 1 };
    case "SET_UNIFORM":
      return {
        ...state,
        customUniforms: {
          ...state.customUniforms,
          [action.name]: action.value,
        },
      };
  }
}
