import type {
  AnimationDirection,
  AnimationPreset,
  FillMode,
  KeyframeProperty,
  KeyframeStop,
  PlaybackState,
  PreviewShape,
  PropertyMask,
  SegmentEasing,
} from "./types";
import {
  DEFAULT_EASING,
  DEFAULT_EASING_VALUE,
  DEFAULT_MASK,
  DEFAULT_PROPERTIES,
} from "./constants";

export type KeyframeSequencerState = {
  keyframes: KeyframeStop[];
  segmentEasings: SegmentEasing[];
  selectedKeyframeId: string | null;
  animationName: string;
  duration: number;
  iterationCount: number | "infinite";
  direction: AnimationDirection;
  fillMode: FillMode;
  previewShape: PreviewShape;
  playback: PlaybackState;
  activePreset: string | null;
};

export type KeyframeSequencerAction =
  | { type: "ADD_KEYFRAME"; offset: number }
  | { type: "REMOVE_KEYFRAME"; id: string }
  | { type: "UPDATE_KEYFRAME_OFFSET"; id: string; offset: number }
  | { type: "SELECT_KEYFRAME"; id: string | null }
  | {
      type: "SET_PROPERTY";
      keyframeId: string;
      property: keyof KeyframeProperty;
      value: number | string;
    }
  | {
      type: "TOGGLE_PROPERTY_MASK";
      keyframeId: string;
      property: keyof KeyframeProperty;
    }
  | {
      type: "SET_SEGMENT_EASING";
      fromId: string;
      toId: string;
      easing: string;
      easingName: string;
    }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_ANIMATION_NAME"; name: string }
  | { type: "SET_ITERATION_COUNT"; count: number | "infinite" }
  | { type: "SET_DIRECTION"; direction: AnimationDirection }
  | { type: "SET_FILL_MODE"; fillMode: FillMode }
  | { type: "SET_PREVIEW_SHAPE"; shape: PreviewShape }
  | { type: "SET_PLAYBACK"; playback: PlaybackState }
  | { type: "LOAD_PRESET"; preset: AnimationPreset }
  | { type: "DUPLICATE_KEYFRAME"; id: string }
  | { type: "RESET" };

function interpolateProperties(
  left: KeyframeStop,
  right: KeyframeStop,
  offset: number,
): KeyframeProperty {
  const range = right.offset - left.offset;
  const t = range === 0 ? 0 : (offset - left.offset) / range;
  return {
    translateX:
      left.properties.translateX +
      t * (right.properties.translateX - left.properties.translateX),
    translateY:
      left.properties.translateY +
      t * (right.properties.translateY - left.properties.translateY),
    scale:
      left.properties.scale +
      t * (right.properties.scale - left.properties.scale),
    rotate:
      left.properties.rotate +
      t * (right.properties.rotate - left.properties.rotate),
    opacity:
      left.properties.opacity +
      t * (right.properties.opacity - left.properties.opacity),
    backgroundColor: left.properties.backgroundColor,
  };
}

function unionMasks(a: PropertyMask, b: PropertyMask): PropertyMask {
  return {
    translateX: a.translateX || b.translateX,
    translateY: a.translateY || b.translateY,
    scale: a.scale || b.scale,
    rotate: a.rotate || b.rotate,
    opacity: a.opacity || b.opacity,
    backgroundColor: a.backgroundColor || b.backgroundColor,
  };
}

export function buildSegmentEasings(
  keyframes: KeyframeStop[],
  existingEasings: SegmentEasing[],
): SegmentEasing[] {
  const result: SegmentEasing[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];
    if (!from || !to) continue;

    const existing = existingEasings.find(
      (e) => e.fromId === from.id && e.toId === to.id,
    );
    result.push(
      existing ?? {
        fromId: from.id,
        toId: to.id,
        easing: DEFAULT_EASING_VALUE,
        easingName: DEFAULT_EASING,
      },
    );
  }
  return result;
}

function findNeighbors(
  keyframes: KeyframeStop[],
  offset: number,
): { left: KeyframeStop; right: KeyframeStop } {
  let left = keyframes[0];
  let right = keyframes[keyframes.length - 1];

  if (!left || !right) {
    throw new Error("Keyframes array must have at least two entries");
  }

  for (const kf of keyframes) {
    if (kf.offset <= offset && kf.offset >= left.offset) {
      left = kf;
    }
    if (kf.offset >= offset && kf.offset <= right.offset) {
      right = kf;
    }
  }

  return { left, right };
}

export function createInitialState(): KeyframeSequencerState {
  const kf0Id = crypto.randomUUID();
  const kf100Id = crypto.randomUUID();
  return {
    keyframes: [
      {
        id: kf0Id,
        offset: 0,
        properties: { ...DEFAULT_PROPERTIES, opacity: 0 },
        mask: { ...DEFAULT_MASK },
      },
      {
        id: kf100Id,
        offset: 100,
        properties: { ...DEFAULT_PROPERTIES },
        mask: { ...DEFAULT_MASK },
      },
    ],
    segmentEasings: [
      {
        fromId: kf0Id,
        toId: kf100Id,
        easing: DEFAULT_EASING_VALUE,
        easingName: DEFAULT_EASING,
      },
    ],
    selectedKeyframeId: kf0Id,
    animationName: "my-animation",
    duration: 1000,
    iterationCount: 1,
    direction: "normal",
    fillMode: "none",
    previewShape: "box",
    playback: "playing",
    activePreset: null,
  };
}

export const initialState: KeyframeSequencerState = createInitialState();

export function reducer(
  state: KeyframeSequencerState,
  action: KeyframeSequencerAction,
): KeyframeSequencerState {
  switch (action.type) {
    case "ADD_KEYFRAME": {
      const { left, right } = findNeighbors(state.keyframes, action.offset);
      const newId = crypto.randomUUID();
      const newKeyframe: KeyframeStop = {
        id: newId,
        offset: action.offset,
        properties: interpolateProperties(left, right, action.offset),
        mask: unionMasks(left.mask, right.mask),
      };
      const sorted = [...state.keyframes, newKeyframe].sort(
        (a, b) => a.offset - b.offset,
      );
      return {
        ...state,
        keyframes: sorted,
        segmentEasings: buildSegmentEasings(sorted, state.segmentEasings),
        selectedKeyframeId: newId,
        activePreset: null,
      };
    }

    case "REMOVE_KEYFRAME": {
      const target = state.keyframes.find((kf) => kf.id === action.id);
      if (!target || target.offset === 0 || target.offset === 100) {
        return state;
      }

      // Find the segment to the left of the removed keyframe to preserve its easing
      const targetIndex = state.keyframes.findIndex(
        (kf) => kf.id === action.id,
      );
      const leftSegment =
        targetIndex > 0
          ? state.segmentEasings.find(
              (e) =>
                e.fromId === state.keyframes[targetIndex - 1]?.id &&
                e.toId === action.id,
            )
          : undefined;

      const remaining = state.keyframes.filter((kf) => kf.id !== action.id);
      const newEasings = buildSegmentEasings(remaining, state.segmentEasings);

      // For the merged segment (left neighbor -> right neighbor), use the left segment's easing
      if (
        leftSegment &&
        targetIndex > 0 &&
        targetIndex < state.keyframes.length - 1
      ) {
        const leftNeighbor = state.keyframes[targetIndex - 1];
        const rightNeighbor = state.keyframes[targetIndex + 1];
        if (leftNeighbor && rightNeighbor) {
          const mergedIndex = newEasings.findIndex(
            (e) => e.fromId === leftNeighbor.id && e.toId === rightNeighbor.id,
          );
          if (mergedIndex >= 0) {
            newEasings[mergedIndex] = {
              fromId: leftNeighbor.id,
              toId: rightNeighbor.id,
              easing: leftSegment.easing,
              easingName: leftSegment.easingName,
            };
          }
        }
      }

      // Select nearest remaining keyframe
      let nearest = remaining[0];
      if (nearest) {
        let minDist = Math.abs(nearest.offset - target.offset);
        for (const kf of remaining) {
          const dist = Math.abs(kf.offset - target.offset);
          if (dist < minDist) {
            minDist = dist;
            nearest = kf;
          }
        }
      }

      return {
        ...state,
        keyframes: remaining,
        segmentEasings: newEasings,
        selectedKeyframeId: nearest?.id ?? null,
        activePreset: null,
      };
    }

    case "UPDATE_KEYFRAME_OFFSET": {
      const kf = state.keyframes.find((k) => k.id === action.id);
      if (!kf || kf.offset === 0 || kf.offset === 100) {
        return state;
      }

      const clampedOffset = Math.max(1, Math.min(99, action.offset));
      const updated = state.keyframes.map((k) =>
        k.id === action.id ? { ...k, offset: clampedOffset } : k,
      );
      const sorted = [...updated].sort((a, b) => a.offset - b.offset);

      return {
        ...state,
        keyframes: sorted,
        segmentEasings: buildSegmentEasings(sorted, state.segmentEasings),
        activePreset: null,
      };
    }

    case "SELECT_KEYFRAME":
      return { ...state, selectedKeyframeId: action.id };

    case "SET_PROPERTY": {
      const keyframes = state.keyframes.map((kf) => {
        if (kf.id !== action.keyframeId) return kf;
        return {
          ...kf,
          properties: { ...kf.properties, [action.property]: action.value },
          mask: { ...kf.mask, [action.property]: true },
        };
      });
      return { ...state, keyframes, activePreset: null };
    }

    case "TOGGLE_PROPERTY_MASK": {
      const keyframes = state.keyframes.map((kf) => {
        if (kf.id !== action.keyframeId) return kf;
        return {
          ...kf,
          mask: { ...kf.mask, [action.property]: !kf.mask[action.property] },
        };
      });
      return { ...state, keyframes, activePreset: null };
    }

    case "SET_SEGMENT_EASING": {
      const segmentEasings = state.segmentEasings.map((seg) => {
        if (seg.fromId === action.fromId && seg.toId === action.toId) {
          return {
            ...seg,
            easing: action.easing,
            easingName: action.easingName,
          };
        }
        return seg;
      });
      return { ...state, segmentEasings, activePreset: null };
    }

    case "SET_DURATION":
      return { ...state, duration: action.duration };

    case "SET_ANIMATION_NAME":
      return { ...state, animationName: action.name };

    case "SET_ITERATION_COUNT":
      return { ...state, iterationCount: action.count };

    case "SET_DIRECTION":
      return { ...state, direction: action.direction, playback: "playing" };

    case "SET_FILL_MODE":
      return { ...state, fillMode: action.fillMode, playback: "playing" };

    case "SET_PREVIEW_SHAPE":
      return { ...state, previewShape: action.shape };

    case "SET_PLAYBACK":
      return { ...state, playback: action.playback };

    case "LOAD_PRESET":
      return {
        ...state,
        keyframes: action.preset.keyframes,
        segmentEasings: action.preset.segmentEasings,
        duration: action.preset.duration,
        selectedKeyframeId: action.preset.keyframes[0]?.id ?? null,
        activePreset: action.preset.name,
      };

    case "DUPLICATE_KEYFRAME": {
      const source = state.keyframes.find((kf) => kf.id === action.id);
      if (!source) return state;

      const newOffset = Math.min(source.offset + 5, 99);
      const newId = crypto.randomUUID();
      const duplicate: KeyframeStop = {
        id: newId,
        offset: newOffset,
        properties: { ...source.properties },
        mask: { ...source.mask },
      };

      // Find the segment easing that the source keyframe is the "from" of
      const sourceSegment = state.segmentEasings.find(
        (e) => e.fromId === source.id,
      );

      const sorted = [...state.keyframes, duplicate].sort(
        (a, b) => a.offset - b.offset,
      );
      const newEasings = buildSegmentEasings(sorted, state.segmentEasings);

      // Apply the original segment's easing to the new segment from source to duplicate
      if (sourceSegment) {
        const idx = newEasings.findIndex(
          (e) => e.fromId === source.id && e.toId === newId,
        );
        if (idx >= 0) {
          newEasings[idx] = {
            fromId: source.id,
            toId: newId,
            easing: sourceSegment.easing,
            easingName: sourceSegment.easingName,
          };
        }
      }

      return {
        ...state,
        keyframes: sorted,
        segmentEasings: newEasings,
        selectedKeyframeId: newId,
        activePreset: null,
      };
    }

    case "RESET":
      return createInitialState();
  }
}

// ---------------------------------------------------------------------------
// History wrapper for undo/redo
// ---------------------------------------------------------------------------

/** Actions that should NOT be recorded in undo history (UI-only state) */
const NON_UNDOABLE: Set<KeyframeSequencerAction["type"]> = new Set([
  "SELECT_KEYFRAME",
  "SET_PLAYBACK",
  "SET_PREVIEW_SHAPE",
]);

export type HistoryState = {
  present: KeyframeSequencerState;
  past: KeyframeSequencerState[];
  future: KeyframeSequencerState[];
};

export type HistoryAction =
  | KeyframeSequencerAction
  | { type: "UNDO" }
  | { type: "REDO" };

const MAX_HISTORY = 50;

export function createHistoryState(
  present: KeyframeSequencerState,
): HistoryState {
  return { present, past: [], future: [] };
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future].slice(0, MAX_HISTORY),
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: state.future.slice(1),
      };
    }

    default: {
      const nextPresent = reducer(state.present, action);
      if (nextPresent === state.present) return state;

      // Non-undoable actions don't push to history
      if (NON_UNDOABLE.has(action.type)) {
        return { ...state, present: nextPresent };
      }

      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: nextPresent,
        future: [],
      };
    }
  }
}
