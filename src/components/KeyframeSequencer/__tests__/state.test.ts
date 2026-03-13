import { describe, it, expect } from "vitest";
import {
  reducer,
  initialState,
  buildSegmentEasings,
  NON_UNDOABLE,
} from "../state";
import type { KeyframeSequencerState, KeyframeSequencerAction } from "../state";
import type { AnimationPreset, KeyframeStop, SegmentEasing } from "../types";
import {
  DEFAULT_EASING,
  DEFAULT_EASING_VALUE,
  DEFAULT_MASK,
  DEFAULT_PROPERTIES,
} from "../constants";

/**
 * Minimal in-test history wrapper that mirrors useHistoryReducer logic,
 * so we can unit-test undo/redo without React hooks.
 */
type HistoryState = {
  present: KeyframeSequencerState;
  past: KeyframeSequencerState[];
  future: KeyframeSequencerState[];
};
type HistoryAction =
  | KeyframeSequencerAction
  | { type: "UNDO" }
  | { type: "REDO" };

function createHistoryState(present: KeyframeSequencerState): HistoryState {
  return { present, past: [], future: [] };
}

function historyReducer(
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
        future: [state.present, ...state.future].slice(0, 50),
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present].slice(-50),
        present: next,
        future: state.future.slice(1),
      };
    }
    default: {
      const nextPresent = reducer(
        state.present,
        action as KeyframeSequencerAction,
      );
      if (nextPresent === state.present) return state;
      if (NON_UNDOABLE.has((action as KeyframeSequencerAction).type)) {
        return { ...state, present: nextPresent };
      }
      return {
        past: [...state.past, state.present].slice(-50),
        present: nextPresent,
        future: [],
      };
    }
  }
}

/** Helper to get a state with a middle keyframe at 50% for removal/update tests */
function stateWithMiddle(): KeyframeSequencerState {
  return reducer(initialState, { type: "ADD_KEYFRAME", offset: 50 });
}

describe("reducer", () => {
  describe("initialState", () => {
    it("has two keyframes at 0% and 100%", () => {
      expect(initialState.keyframes).toHaveLength(2);
      expect(initialState.keyframes[0]?.offset).toBe(0);
      expect(initialState.keyframes[1]?.offset).toBe(100);
    });

    it("has one segment easing between the two keyframes", () => {
      expect(initialState.segmentEasings).toHaveLength(1);
      expect(initialState.segmentEasings[0]?.fromId).toBe(
        initialState.keyframes[0]?.id,
      );
      expect(initialState.segmentEasings[0]?.toId).toBe(
        initialState.keyframes[1]?.id,
      );
      expect(initialState.segmentEasings[0]?.easingName).toBe(DEFAULT_EASING);
    });

    it("selects the first keyframe by default", () => {
      expect(initialState.selectedKeyframeId).toBe(
        initialState.keyframes[0]?.id,
      );
    });

    it("has correct default values", () => {
      expect(initialState.animationName).toBe("my-animation");
      expect(initialState.duration).toBe(1000);
      expect(initialState.iterationCount).toBe(1);
      expect(initialState.direction).toBe("normal");
      expect(initialState.fillMode).toBe("none");
      expect(initialState.previewShape).toBe("box");
      expect(initialState.playback).toBe("playing");
      expect(initialState.activePreset).toBeNull();
    });
  });

  describe("ADD_KEYFRAME", () => {
    it("adds keyframe at given offset and keeps sorted order", () => {
      const next = reducer(initialState, { type: "ADD_KEYFRAME", offset: 50 });
      expect(next.keyframes).toHaveLength(3);
      expect(next.keyframes[0]?.offset).toBe(0);
      expect(next.keyframes[1]?.offset).toBe(50);
      expect(next.keyframes[2]?.offset).toBe(100);
    });

    it("interpolates numeric properties from neighbors", () => {
      // Set left (0%) translateX to 0, right (100%) to 100
      let state = reducer(initialState, {
        type: "SET_PROPERTY",
        keyframeId: initialState.keyframes[0]?.id ?? "",
        property: "translateX",
        value: 0,
      });
      state = reducer(state, {
        type: "SET_PROPERTY",
        keyframeId: initialState.keyframes[1]?.id ?? "",
        property: "translateX",
        value: 100,
      });
      const next = reducer(state, { type: "ADD_KEYFRAME", offset: 50 });
      const middle = next.keyframes[1];
      expect(middle?.properties.translateX).toBeCloseTo(50);
    });

    it("unions masks from neighbors", () => {
      // Enable scale mask on 100% keyframe
      const state = reducer(initialState, {
        type: "TOGGLE_PROPERTY_MASK",
        keyframeId: initialState.keyframes[1]?.id ?? "",
        property: "scale",
      });
      // 0% has opacity:true, 100% now has opacity:true + scale:true
      const next = reducer(state, { type: "ADD_KEYFRAME", offset: 50 });
      const middle = next.keyframes[1];
      expect(middle?.mask.opacity).toBe(true);
      expect(middle?.mask.scale).toBe(true);
    });

    it("adds new segment easings", () => {
      const next = reducer(initialState, { type: "ADD_KEYFRAME", offset: 50 });
      expect(next.segmentEasings).toHaveLength(2);
      expect(next.segmentEasings[0]?.fromId).toBe(next.keyframes[0]?.id);
      expect(next.segmentEasings[0]?.toId).toBe(next.keyframes[1]?.id);
      expect(next.segmentEasings[1]?.fromId).toBe(next.keyframes[1]?.id);
      expect(next.segmentEasings[1]?.toId).toBe(next.keyframes[2]?.id);
    });

    it("auto-selects the new keyframe", () => {
      const next = reducer(initialState, { type: "ADD_KEYFRAME", offset: 25 });
      const newKf = next.keyframes.find((kf) => kf.offset === 25);
      expect(next.selectedKeyframeId).toBe(newKf?.id);
    });

    it("clears activePreset", () => {
      const state: KeyframeSequencerState = {
        ...initialState,
        activePreset: "bounce",
      };
      const next = reducer(state, { type: "ADD_KEYFRAME", offset: 50 });
      expect(next.activePreset).toBeNull();
    });
  });

  describe("REMOVE_KEYFRAME", () => {
    it("removes a middle keyframe", () => {
      const state = stateWithMiddle();
      const middleId = state.keyframes.find((kf) => kf.offset === 50)?.id ?? "";
      const next = reducer(state, { type: "REMOVE_KEYFRAME", id: middleId });
      expect(next.keyframes).toHaveLength(2);
      expect(next.keyframes.find((kf) => kf.offset === 50)).toBeUndefined();
    });

    it("cannot remove 0% keyframe", () => {
      const id = initialState.keyframes[0]?.id ?? "";
      const next = reducer(initialState, { type: "REMOVE_KEYFRAME", id });
      expect(next.keyframes).toHaveLength(2);
    });

    it("cannot remove 100% keyframe", () => {
      const id = initialState.keyframes[1]?.id ?? "";
      const next = reducer(initialState, { type: "REMOVE_KEYFRAME", id });
      expect(next.keyframes).toHaveLength(2);
    });

    it("merges segment easings keeping left easing", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      // Set a custom easing on the left segment (0% -> 50%)
      const leftFrom = state.keyframes[0]?.id ?? "";
      const updated = reducer(state, {
        type: "SET_SEGMENT_EASING",
        fromId: leftFrom,
        toId: middleKf?.id ?? "",
        easing: "linear",
        easingName: "linear",
      });
      const next = reducer(updated, {
        type: "REMOVE_KEYFRAME",
        id: middleKf?.id ?? "",
      });
      expect(next.segmentEasings).toHaveLength(1);
      expect(next.segmentEasings[0]?.easing).toBe("linear");
      expect(next.segmentEasings[0]?.easingName).toBe("linear");
    });

    it("auto-selects nearest remaining keyframe", () => {
      // Add keyframes at 25 and 75
      let state = reducer(initialState, { type: "ADD_KEYFRAME", offset: 25 });
      state = reducer(state, { type: "ADD_KEYFRAME", offset: 75 });
      const kf25 = state.keyframes.find((kf) => kf.offset === 25);
      const kf75 = state.keyframes.find((kf) => kf.offset === 75);
      // Remove 75% — nearest should be 100% (distance 25) or 25% (distance 50)
      const next = reducer(state, {
        type: "REMOVE_KEYFRAME",
        id: kf75?.id ?? "",
      });
      const selectedKf = next.keyframes.find(
        (kf) => kf.id === next.selectedKeyframeId,
      );
      // 100% is at distance 25 from 75%, 25% is at distance 50
      expect(selectedKf?.offset).toBe(100);

      // Remove 25% — nearest should be 0% (distance 25)
      const next2 = reducer(next, {
        type: "REMOVE_KEYFRAME",
        id: kf25?.id ?? "",
      });
      const selectedKf2 = next2.keyframes.find(
        (kf) => kf.id === next2.selectedKeyframeId,
      );
      expect(selectedKf2?.offset).toBe(0);
    });
  });

  describe("UPDATE_KEYFRAME_OFFSET", () => {
    it("updates offset and re-sorts", () => {
      const state = stateWithMiddle();
      const middleId = state.keyframes.find((kf) => kf.offset === 50)?.id ?? "";
      const next = reducer(state, {
        type: "UPDATE_KEYFRAME_OFFSET",
        id: middleId,
        offset: 75,
      });
      expect(next.keyframes[1]?.offset).toBe(75);
      // Still sorted
      for (let i = 1; i < next.keyframes.length; i++) {
        const prev = next.keyframes[i - 1];
        const curr = next.keyframes[i];
        expect((prev?.offset ?? 0) <= (curr?.offset ?? 0)).toBe(true);
      }
    });

    it("clamps to (0, 100) exclusive", () => {
      const state = stateWithMiddle();
      const middleId = state.keyframes.find((kf) => kf.offset === 50)?.id ?? "";

      const clamped0 = reducer(state, {
        type: "UPDATE_KEYFRAME_OFFSET",
        id: middleId,
        offset: -10,
      });
      expect(clamped0.keyframes.find((kf) => kf.id === middleId)?.offset).toBe(
        1,
      );

      const clamped100 = reducer(state, {
        type: "UPDATE_KEYFRAME_OFFSET",
        id: middleId,
        offset: 150,
      });
      expect(
        clamped100.keyframes.find((kf) => kf.id === middleId)?.offset,
      ).toBe(99);
    });

    it("rebuilds segment easings preserving existing", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      // Set a custom easing on the right segment (50% -> 100%)
      const updated = reducer(state, {
        type: "SET_SEGMENT_EASING",
        fromId: middleKf?.id ?? "",
        toId: state.keyframes[2]?.id ?? "",
        easing: "linear",
        easingName: "linear",
      });
      // Move middle to 30% — pair IDs haven't changed, so easing should survive
      const next = reducer(updated, {
        type: "UPDATE_KEYFRAME_OFFSET",
        id: middleKf?.id ?? "",
        offset: 30,
      });
      const rightSeg = next.segmentEasings.find(
        (e) => e.fromId === middleKf?.id,
      );
      expect(rightSeg?.easing).toBe("linear");
    });
  });

  describe("SELECT_KEYFRAME", () => {
    it("sets selectedKeyframeId", () => {
      const id = initialState.keyframes[1]?.id ?? "";
      const next = reducer(initialState, {
        type: "SELECT_KEYFRAME",
        id,
      });
      expect(next.selectedKeyframeId).toBe(id);
    });

    it("can set to null", () => {
      const next = reducer(initialState, {
        type: "SELECT_KEYFRAME",
        id: null,
      });
      expect(next.selectedKeyframeId).toBeNull();
    });
  });

  describe("SET_PROPERTY", () => {
    it("updates property value on the target keyframe", () => {
      const id = initialState.keyframes[0]?.id ?? "";
      const next = reducer(initialState, {
        type: "SET_PROPERTY",
        keyframeId: id,
        property: "scale",
        value: 2.5,
      });
      expect(next.keyframes[0]?.properties.scale).toBe(2.5);
    });

    it("auto-enables mask for that property", () => {
      const id = initialState.keyframes[0]?.id ?? "";
      // scale mask starts as false
      expect(initialState.keyframes[0]?.mask.scale).toBe(false);
      const next = reducer(initialState, {
        type: "SET_PROPERTY",
        keyframeId: id,
        property: "scale",
        value: 1.5,
      });
      expect(next.keyframes[0]?.mask.scale).toBe(true);
    });

    it("clears activePreset", () => {
      const state: KeyframeSequencerState = {
        ...initialState,
        activePreset: "slide",
      };
      const next = reducer(state, {
        type: "SET_PROPERTY",
        keyframeId: state.keyframes[0]?.id ?? "",
        property: "opacity",
        value: 0.5,
      });
      expect(next.activePreset).toBeNull();
    });
  });

  describe("TOGGLE_PROPERTY_MASK", () => {
    it("flips mask boolean", () => {
      const id = initialState.keyframes[0]?.id ?? "";
      // opacity starts true
      const next = reducer(initialState, {
        type: "TOGGLE_PROPERTY_MASK",
        keyframeId: id,
        property: "opacity",
      });
      expect(next.keyframes[0]?.mask.opacity).toBe(false);

      // Toggle again
      const next2 = reducer(next, {
        type: "TOGGLE_PROPERTY_MASK",
        keyframeId: id,
        property: "opacity",
      });
      expect(next2.keyframes[0]?.mask.opacity).toBe(true);
    });
  });

  describe("SET_SEGMENT_EASING", () => {
    it("updates easing for a segment", () => {
      const fromId = initialState.keyframes[0]?.id ?? "";
      const toId = initialState.keyframes[1]?.id ?? "";
      const next = reducer(initialState, {
        type: "SET_SEGMENT_EASING",
        fromId,
        toId,
        easing: "linear",
        easingName: "linear",
      });
      expect(next.segmentEasings[0]?.easing).toBe("linear");
      expect(next.segmentEasings[0]?.easingName).toBe("linear");
    });
  });

  describe("SET_DURATION", () => {
    it("updates duration", () => {
      const next = reducer(initialState, {
        type: "SET_DURATION",
        duration: 2000,
      });
      expect(next.duration).toBe(2000);
    });
  });

  describe("SET_ANIMATION_NAME", () => {
    it("updates animation name", () => {
      const next = reducer(initialState, {
        type: "SET_ANIMATION_NAME",
        name: "slide-in",
      });
      expect(next.animationName).toBe("slide-in");
    });
  });

  describe("SET_ITERATION_COUNT", () => {
    it("sets numeric count", () => {
      const next = reducer(initialState, {
        type: "SET_ITERATION_COUNT",
        count: 3,
      });
      expect(next.iterationCount).toBe(3);
    });

    it("sets infinite", () => {
      const next = reducer(initialState, {
        type: "SET_ITERATION_COUNT",
        count: "infinite",
      });
      expect(next.iterationCount).toBe("infinite");
    });
  });

  describe("SET_DIRECTION", () => {
    it("updates direction", () => {
      const next = reducer(initialState, {
        type: "SET_DIRECTION",
        direction: "alternate",
      });
      expect(next.direction).toBe("alternate");
    });
  });

  describe("SET_FILL_MODE", () => {
    it("updates fill mode", () => {
      const next = reducer(initialState, {
        type: "SET_FILL_MODE",
        fillMode: "both",
      });
      expect(next.fillMode).toBe("both");
    });
  });

  describe("SET_PREVIEW_SHAPE", () => {
    it("updates preview shape", () => {
      const next = reducer(initialState, {
        type: "SET_PREVIEW_SHAPE",
        shape: "circle",
      });
      expect(next.previewShape).toBe("circle");
    });
  });

  describe("SET_PLAYBACK", () => {
    it("sets playback to paused", () => {
      const next = reducer(initialState, {
        type: "SET_PLAYBACK",
        playback: "paused",
      });
      expect(next.playback).toBe("paused");
    });

    it("sets playback to playing", () => {
      const state: KeyframeSequencerState = {
        ...initialState,
        playback: "paused",
      };
      const next = reducer(state, {
        type: "SET_PLAYBACK",
        playback: "playing",
      });
      expect(next.playback).toBe("playing");
    });
  });

  describe("LOAD_PRESET", () => {
    it("replaces keyframes, easings, duration, and sets activePreset", () => {
      const presetKf0: KeyframeStop = {
        id: "preset-0",
        offset: 0,
        properties: { ...DEFAULT_PROPERTIES, opacity: 0 },
        mask: { ...DEFAULT_MASK },
      };
      const presetKf100: KeyframeStop = {
        id: "preset-100",
        offset: 100,
        properties: { ...DEFAULT_PROPERTIES, opacity: 1 },
        mask: { ...DEFAULT_MASK },
      };
      const presetEasing: SegmentEasing = {
        fromId: "preset-0",
        toId: "preset-100",
        easing: "linear",
        easingName: "linear",
      };
      const preset: AnimationPreset = {
        name: "fade-in",
        category: "entrance",
        keyframes: [presetKf0, presetKf100],
        segmentEasings: [presetEasing],
        duration: 500,
      };

      const next = reducer(initialState, { type: "LOAD_PRESET", preset });
      expect(next.keyframes).toEqual([presetKf0, presetKf100]);
      expect(next.segmentEasings).toEqual([presetEasing]);
      expect(next.duration).toBe(500);
      expect(next.activePreset).toBe("fade-in");
      expect(next.selectedKeyframeId).toBe("preset-0");
    });
  });

  describe("DUPLICATE_KEYFRAME", () => {
    it("duplicates at offset + 5", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      const next = reducer(state, {
        type: "DUPLICATE_KEYFRAME",
        id: middleKf?.id ?? "",
      });
      expect(next.keyframes).toHaveLength(4);
      const duped = next.keyframes.find((kf) => kf.offset === 55);
      expect(duped).toBeDefined();
      expect(duped?.properties).toEqual(middleKf?.properties);
      expect(duped?.mask).toEqual(middleKf?.mask);
    });

    it("clamps duplicate offset to 99", () => {
      // Duplicate the 100% keyframe — but 100% is an endpoint so let's
      // add a keyframe at 97% and duplicate that
      const state = reducer(initialState, {
        type: "ADD_KEYFRAME",
        offset: 97,
      });
      const kf97 = state.keyframes.find((kf) => kf.offset === 97);
      const next = reducer(state, {
        type: "DUPLICATE_KEYFRAME",
        id: kf97?.id ?? "",
      });
      // 97 + 5 = 102, clamped to 99
      const duped = next.keyframes.find(
        (kf) => kf.id !== kf97?.id && kf.offset >= 97 && kf.offset < 100,
      );
      expect(duped?.offset).toBe(99);
    });

    it("inherits easing from original segment", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      // Set custom easing on segment from middle -> 100%
      const updated = reducer(state, {
        type: "SET_SEGMENT_EASING",
        fromId: middleKf?.id ?? "",
        toId: state.keyframes[2]?.id ?? "",
        easing: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
        easingName: "back-in-out",
      });
      const next = reducer(updated, {
        type: "DUPLICATE_KEYFRAME",
        id: middleKf?.id ?? "",
      });
      // The segment from middle -> duplicate should inherit the original easing
      const segFromMiddle = next.segmentEasings.find(
        (e) => e.fromId === middleKf?.id && e.toId !== state.keyframes[2]?.id,
      );
      expect(segFromMiddle?.easing).toBe("cubic-bezier(0.68, -0.6, 0.32, 1.6)");
      expect(segFromMiddle?.easingName).toBe("back-in-out");
    });
  });

  describe("CLONE_KEYFRAME", () => {
    it("clones with the provided newId", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      const next = reducer(state, {
        type: "CLONE_KEYFRAME",
        sourceId: middleKf?.id ?? "",
        newId: "my-clone-id",
      });
      expect(next.keyframes).toHaveLength(4);
      const cloned = next.keyframes.find((kf) => kf.id === "my-clone-id");
      expect(cloned).toBeDefined();
      expect(cloned?.offset).toBe(55);
      expect(cloned?.properties).toEqual(middleKf?.properties);
      expect(cloned?.mask).toEqual(middleKf?.mask);
    });

    it("selects the cloned keyframe", () => {
      const state = stateWithMiddle();
      const middleKf = state.keyframes.find((kf) => kf.offset === 50);
      const next = reducer(state, {
        type: "CLONE_KEYFRAME",
        sourceId: middleKf?.id ?? "",
        newId: "clone-id",
      });
      expect(next.selectedKeyframeId).toBe("clone-id");
    });

    it("returns unchanged state for unknown sourceId", () => {
      const next = reducer(initialState, {
        type: "CLONE_KEYFRAME",
        sourceId: "nonexistent",
        newId: "new-id",
      });
      expect(next).toBe(initialState);
    });
  });

  describe("RESET", () => {
    it("returns a fresh initial state", () => {
      const state = stateWithMiddle();
      const next = reducer(state, { type: "RESET" });
      expect(next.keyframes).toHaveLength(2);
      expect(next.keyframes[0]?.offset).toBe(0);
      expect(next.keyframes[1]?.offset).toBe(100);
      expect(next.animationName).toBe("my-animation");
      expect(next.duration).toBe(1000);
      expect(next.activePreset).toBeNull();
    });

    it("generates new IDs on reset", () => {
      const next = reducer(initialState, { type: "RESET" });
      expect(next.keyframes[0]?.id).not.toBe(initialState.keyframes[0]?.id);
    });
  });

  describe("buildSegmentEasings", () => {
    it("creates default easings for new pairs", () => {
      const kfs: KeyframeStop[] = [
        {
          id: "a",
          offset: 0,
          properties: DEFAULT_PROPERTIES,
          mask: DEFAULT_MASK,
        },
        {
          id: "b",
          offset: 50,
          properties: DEFAULT_PROPERTIES,
          mask: DEFAULT_MASK,
        },
        {
          id: "c",
          offset: 100,
          properties: DEFAULT_PROPERTIES,
          mask: DEFAULT_MASK,
        },
      ];
      const result = buildSegmentEasings(kfs, []);
      expect(result).toHaveLength(2);
      expect(result[0]?.easing).toBe(DEFAULT_EASING_VALUE);
      expect(result[1]?.easing).toBe(DEFAULT_EASING_VALUE);
    });

    it("preserves existing easings for matching pairs", () => {
      const kfs: KeyframeStop[] = [
        {
          id: "a",
          offset: 0,
          properties: DEFAULT_PROPERTIES,
          mask: DEFAULT_MASK,
        },
        {
          id: "b",
          offset: 100,
          properties: DEFAULT_PROPERTIES,
          mask: DEFAULT_MASK,
        },
      ];
      const existing: SegmentEasing[] = [
        {
          fromId: "a",
          toId: "b",
          easing: "linear",
          easingName: "linear",
        },
      ];
      const result = buildSegmentEasings(kfs, existing);
      expect(result).toHaveLength(1);
      expect(result[0]?.easing).toBe("linear");
    });
  });
});

describe("historyReducer", () => {
  it("tracks undoable actions in past", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 50 });
    expect(h.past).toHaveLength(1);
    expect(h.present.keyframes).toHaveLength(3);
  });

  it("undo restores previous state", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 50 });
    h = historyReducer(h, { type: "UNDO" });
    expect(h.present.keyframes).toHaveLength(2);
    expect(h.past).toHaveLength(0);
    expect(h.future).toHaveLength(1);
  });

  it("redo restores undone state", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 50 });
    h = historyReducer(h, { type: "UNDO" });
    h = historyReducer(h, { type: "REDO" });
    expect(h.present.keyframes).toHaveLength(3);
    expect(h.past).toHaveLength(1);
    expect(h.future).toHaveLength(0);
  });

  it("new action clears future", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 50 });
    h = historyReducer(h, { type: "UNDO" });
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 25 });
    expect(h.future).toHaveLength(0);
  });

  it("non-undoable actions do not push to past", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "SELECT_KEYFRAME", id: null });
    expect(h.past).toHaveLength(0);
    h = historyReducer(h, { type: "SET_PLAYBACK", playback: "paused" });
    expect(h.past).toHaveLength(0);
    h = historyReducer(h, { type: "SET_PREVIEW_SHAPE", shape: "circle" });
    expect(h.past).toHaveLength(0);
  });

  it("undo with empty past is no-op", () => {
    const h = createHistoryState(initialState);
    const next = historyReducer(h, { type: "UNDO" });
    expect(next).toBe(h);
  });

  it("redo with empty future is no-op", () => {
    const h = createHistoryState(initialState);
    const next = historyReducer(h, { type: "REDO" });
    expect(next).toBe(h);
  });

  it("multiple undo/redo round-trips", () => {
    let h = createHistoryState(initialState);
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 25 });
    h = historyReducer(h, { type: "ADD_KEYFRAME", offset: 75 });
    expect(h.present.keyframes).toHaveLength(4);

    h = historyReducer(h, { type: "UNDO" });
    expect(h.present.keyframes).toHaveLength(3);

    h = historyReducer(h, { type: "UNDO" });
    expect(h.present.keyframes).toHaveLength(2);

    h = historyReducer(h, { type: "REDO" });
    expect(h.present.keyframes).toHaveLength(3);

    h = historyReducer(h, { type: "REDO" });
    expect(h.present.keyframes).toHaveLength(4);
  });
});
