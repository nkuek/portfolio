import type { BezierCurve, SpringConfig } from "./types";
import { DEFAULT_CURVE, DEFAULT_DURATION } from "./constants";
import { DEFAULT_SPRING_CONFIG } from "./spring";

export type EditorMode = "bezier" | "spring";
export type OverlayType = "none" | "velocity" | "acceleration";

export type EasingState = {
  mode: EditorMode;
  editorPanel: EditorMode;
  curve: BezierCurve;
  duration: number;
  activePreset: string | null;
  pinnedCurve: BezierCurve | null;
  pinnedPresetName: string | null;
  springConfig: SpringConfig;
  pinnedSpringConfig: SpringConfig | null;
  pinnedSpringPresetName: string | null;
  overlay: OverlayType;
};

export type EasingAction =
  | { type: "SET_MODE"; mode: EditorMode }
  | { type: "SET_CURVE"; curve: BezierCurve }
  | { type: "SET_HANDLE"; handle: "p1" | "p2"; x: number; y: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SELECT_PRESET"; name: string; curve: BezierCurve }
  | { type: "PIN_CURVE"; curve?: BezierCurve; name?: string | null }
  | { type: "UNPIN_CURVE" }
  | {
      type: "SET_SPRING_PARAM";
      param: "mass" | "stiffness" | "damping";
      value: number;
    }
  | { type: "SELECT_SPRING_PRESET"; name: string; config: SpringConfig }
  | { type: "PIN_SPRING"; config?: SpringConfig; name?: string | null }
  | { type: "UNPIN_SPRING" }
  | { type: "SET_OVERLAY"; overlay: OverlayType };

export const initialState: EasingState = {
  mode: "bezier",
  editorPanel: "bezier",
  curve: DEFAULT_CURVE,
  duration: DEFAULT_DURATION,
  activePreset: "spring",
  pinnedCurve: null,
  pinnedPresetName: null,
  springConfig: DEFAULT_SPRING_CONFIG,
  pinnedSpringConfig: null,
  pinnedSpringPresetName: null,
  overlay: "none",
};

export function easingReducer(
  state: EasingState,
  action: EasingAction,
): EasingState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, editorPanel: action.mode };
    case "SET_CURVE":
      return {
        ...state,
        curve: action.curve,
        activePreset: null,
        mode: "bezier",
      };
    case "SET_HANDLE": {
      const curve =
        action.handle === "p1"
          ? { ...state.curve, x1: action.x, y1: action.y }
          : { ...state.curve, x2: action.x, y2: action.y };
      return { ...state, curve, activePreset: null, mode: "bezier" };
    }
    case "SET_DURATION":
      return { ...state, duration: action.duration };
    case "SELECT_PRESET":
      return {
        ...state,
        mode: "bezier",
        editorPanel: "bezier",
        curve: action.curve,
        activePreset: action.name,
        duration: DEFAULT_DURATION,
      };
    case "PIN_CURVE":
      return {
        ...state,
        pinnedCurve: action.curve ? { ...action.curve } : { ...state.curve },
        pinnedPresetName:
          action.name !== undefined ? action.name : state.activePreset,
        pinnedSpringConfig: null,
        pinnedSpringPresetName: null,
      };
    case "UNPIN_CURVE":
      return { ...state, pinnedCurve: null, pinnedPresetName: null };
    case "SET_SPRING_PARAM":
      return {
        ...state,
        springConfig: { ...state.springConfig, [action.param]: action.value },
        activePreset: null,
        mode: "spring",
      };
    case "SELECT_SPRING_PRESET":
      return {
        ...state,
        mode: "spring",
        editorPanel: "spring",
        springConfig: { ...action.config },
        activePreset: action.name,
        duration: DEFAULT_DURATION,
      };
    case "PIN_SPRING":
      return {
        ...state,
        pinnedSpringConfig: action.config
          ? { ...action.config }
          : { ...state.springConfig },
        pinnedSpringPresetName:
          action.name !== undefined ? action.name : state.activePreset,
        pinnedCurve: null,
        pinnedPresetName: null,
      };
    case "UNPIN_SPRING":
      return {
        ...state,
        pinnedSpringConfig: null,
        pinnedSpringPresetName: null,
      };
    case "SET_OVERLAY":
      return { ...state, overlay: action.overlay };
  }
}
