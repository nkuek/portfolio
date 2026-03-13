import { useReducer, useCallback } from "react";

const DEFAULT_MAX_HISTORY = 50;

type HistoryState<S> = {
  present: S;
  past: S[];
  future: S[];
  /** Snapshot of present when a batch started, or null if not batching. */
  batchAnchor: S | null;
};

type HistoryMeta = {
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * Wraps any reducer with undo/redo history.
 *
 * Actions whose `type` appears in `nonUndoable` still update the present
 * state but do not push to the undo stack.
 *
 * Returns `[state, dispatch, { canUndo, canRedo }]`.
 * `dispatch` accepts the inner action type plus `{ type: "UNDO" }` and
 * `{ type: "REDO" }`.
 */
export default function useHistoryReducer<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  init: () => S,
  options: {
    nonUndoable?: Set<A["type"]>;
    maxHistory?: number;
  } = {},
): [
  S,
  React.Dispatch<
    | A
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "BATCH_START" }
    | { type: "BATCH_END" }
  >,
  HistoryMeta,
] {
  const { nonUndoable, maxHistory = DEFAULT_MAX_HISTORY } = options;

  const historyReducer = useCallback(
    (
      state: HistoryState<S>,
      action:
        | A
        | { type: "UNDO" }
        | { type: "REDO" }
        | { type: "BATCH_START" }
        | { type: "BATCH_END" },
    ): HistoryState<S> => {
      switch (action.type) {
        case "UNDO": {
          if (state.past.length === 0) return state;
          const previous = state.past[state.past.length - 1];
          if (!previous) return state;
          return {
            past: state.past.slice(0, -1),
            present: previous,
            future: [state.present, ...state.future].slice(0, maxHistory),
            batchAnchor: null,
          };
        }

        case "REDO": {
          if (state.future.length === 0) return state;
          const next = state.future[0];
          if (!next) return state;
          return {
            past: [...state.past, state.present].slice(-maxHistory),
            present: next,
            future: state.future.slice(1),
            batchAnchor: null,
          };
        }

        case "BATCH_START":
          // Save current present as the undo anchor; subsequent actions
          // update present without pushing to past until BATCH_END.
          return { ...state, batchAnchor: state.batchAnchor ?? state.present };

        case "BATCH_END": {
          if (state.batchAnchor === null) return state;
          // If nothing actually changed during the batch, discard it
          if (state.batchAnchor === state.present) {
            return { ...state, batchAnchor: null };
          }
          return {
            past: [...state.past, state.batchAnchor].slice(-maxHistory),
            present: state.present,
            future: [],
            batchAnchor: null,
          };
        }

        default: {
          const nextPresent = reducer(state.present, action as A);
          if (nextPresent === state.present) return state;

          if (nonUndoable?.has((action as A).type)) {
            return { ...state, present: nextPresent };
          }

          // Inside a batch: update present but don't push to past
          if (state.batchAnchor !== null) {
            return { ...state, present: nextPresent, future: [] };
          }

          return {
            ...state,
            past: [...state.past, state.present].slice(-maxHistory),
            present: nextPresent,
            future: [],
          };
        }
      }
    },
    [reducer, nonUndoable, maxHistory],
  );

  const initHistory = useCallback(
    (): HistoryState<S> => ({
      present: init(),
      past: [],
      future: [],
      batchAnchor: null,
    }),
    [init],
  );

  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    initHistory,
  );

  return [
    history.present,
    dispatch,
    { canUndo: history.past.length > 0, canRedo: history.future.length > 0 },
  ];
}
