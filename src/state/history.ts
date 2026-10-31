import { GraphState } from '../domain/types';

export const MAX_HISTORY_LENGTH = 30;

export interface HistoryState {
  past: GraphState[];
  present: GraphState;
}

export function createHistory(initial: GraphState): HistoryState {
  return {
    past: [],
    present: initial,
  };
}

export function pushHistory(history: HistoryState, next: GraphState): HistoryState {
  if (next === history.present) {
    return history;
  }
  const updatedPast = [...history.past, history.present];
  if (updatedPast.length > MAX_HISTORY_LENGTH) {
    updatedPast.splice(0, updatedPast.length - MAX_HISTORY_LENGTH);
  }
  return {
    past: updatedPast,
    present: next,
  };
}

export function undoHistory(history: HistoryState): HistoryState {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, history.past.length - 1);
  return {
    past: nextPast,
    present: previous,
  };
}

export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0;
}

export function resetHistory(initial: GraphState): HistoryState {
  return {
    past: [],
    present: initial,
  };
}
