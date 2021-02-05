import { Draft } from "@reduxjs/toolkit";
import {
  PositionType,
  OperationType,
  ZoneType,
  HistoryType,
  InsideState,
} from "../types";
import {
  makeSequence,
  cropMatrix,
  writeMatrix,
  slideArea,
  spreadMatrix,
  matrixShape,
  makeReactions,
  applyFlattened,
  inverseFlattened,
} from "../api/arrays";

export const pushHistory = (history: HistoryType, operation: OperationType): HistoryType => {
  history = {... history};
  const operations = [... history.operations];
  operations.splice(history.index + 1, operations.length);
  operations.push({... operation});
  history.index++;
  if (operations.length > history.size) {
    operations.splice(0, 1);
    history.index--;
  }
  return {... history, operations};
};

export const undoCopy = (state: Draft<InsideState>, { dst, src, before }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [top, left, top + h - 1, left + w - 1];
  matrix = writeMatrix(top, left, before, matrix);

  return {
    ...state,
    matrix,
    selectingZone,
    choosing: [top, left],
    copyingZone: src,
    cutting: false,
    reactions: makeReactions(src, dst, state.choosing),
  };
};

export const redoCopy = (
  state: Draft<InsideState>,
  { src, dst, after, options }: OperationType,
): Draft<InsideState> => {
  const [y, x] = dst;
  const reactions = makeReactions(src, dst, state.choosing, state.selectingZone);
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  const matrix = writeMatrix(y, x, after, state.matrix);
  return {
    ...state,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
    reactions,
  };
};

export const undoCut = (state: Draft<InsideState>, {
  dst, src,
  before, after,
}: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [top, left, top + h - 1, left + w - 1];
  matrix = writeMatrix(top, left, before, matrix);

  const [y, x] = src;
  matrix = writeMatrix(y, x, cropMatrix(after, slideArea(src, -y, -x)), matrix);

  return {
    ...state,
    matrix,
    selectingZone,
    choosing: [top, left],
    copyingZone: src,
    cutting: true,
    reactions: makeReactions(src, dst, state.choosing),
  };
};

export const redoCut = (
  state: Draft<InsideState>,
  { src, dst, after, options }: OperationType,
): Draft<InsideState> => {
  const [y, x] = dst;
  const reactions = makeReactions(src, dst, state.choosing, state.selectingZone);
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  let matrix = writeMatrix(y, x, after, state.matrix);
  const [top, left, bottom, right] = src;
  const blank = spreadMatrix([[""]], bottom - top, right - left);
  matrix = writeMatrix(top, left, blank, matrix);
  matrix = writeMatrix(y, x, after, matrix);

  return {
    ...state,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
    reactions,
  };
};

export const undoWrite = (state: Draft<InsideState>, { dst, src, before }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [top, left, top + h - 1, left + w - 1];
  matrix = writeMatrix(top, left, before, matrix);
  return {
    ...state,
    matrix,
    selectingZone,
    choosing: [top, left],
    cutting: false,
    reactions: makeReactions(src, dst, state.choosing),
    copyingZone: [-1, -1, -1, -1],
  };
};

export const redoWrite = (
  state: Draft<InsideState>,
  { src, dst, after, options }: OperationType,
): Draft<InsideState> => {
  const [y, x] = dst;
  const reactions = makeReactions(src, dst, state.choosing);
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  const matrix = writeMatrix(y, x, after, state.matrix);
  return {
    ...state,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
    reactions,
  };
};

export const undoAddRows = (state: Draft<InsideState>, { dst, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom] = [...dst];
  matrix.splice(top, bottom - top + 1);
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, inverseFlattened(options || {})),
  };
};

export const redoAddRows = (state: Draft<InsideState>, { dst, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom, right] = [...dst];
  const width = right - left + 1;
  const blanks = makeSequence(0, bottom - top + 1).map(() => makeSequence(0, width).map(() => ""));
  matrix.splice(top, 0, ...blanks);
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, options || {}),
  };
};

export const undoAddCols = (state: Draft<InsideState>, { dst, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom, right] = [...dst];
  matrix = [...state.matrix].map((cols) => {
    cols = [...cols];
    cols.splice(left, right - left + 1);
    return cols;
  });
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, inverseFlattened(options || {})),
  };
};

export const redoAddCols = (state: Draft<InsideState>, { dst, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom, right] = [...dst];
  matrix = [...state.matrix].map((cols) => {
    const blanks = makeSequence(0, right - left + 1).map(() => "");
    cols = [...cols];
    cols.splice(left, 0, ...blanks);
    return cols;
  });
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, options || {}),
  };
};

export const undoRemoveRows = (state: Draft<InsideState>, { src, before, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom] = [...src];
  matrix.splice(top, 0, ...before);
  return {
    ...state,
    matrix,
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, inverseFlattened(options || {})),
  };
};

export const redoRemoveRows = (state: Draft<InsideState>, { src, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom] = [...src];
  matrix.splice(top, bottom - top + 1);
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, options || {}),
  };
};

export const undoRemoveCols = (state: Draft<InsideState>, { src, before, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom, right] = [...src];
  matrix = [...state.matrix].map((cols, i) => {
    cols = [...cols];
    cols.splice(left, 0, ...before[i]);
    return cols;
  });
  return {
    ...state,
    matrix,
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, inverseFlattened(options || {})),
  };
};

export const redoRemoveCols = (state: Draft<InsideState>, { src, options }: OperationType): Draft<InsideState> => {
  let matrix = [... state.matrix];
  const [top, left, bottom, right] = [...src];
  matrix = [...state.matrix].map((cols) => {
    cols = [...cols];
    cols.splice(left, right - left + 1);
    return cols;
  });
  return {
    ...state,
    matrix: [...matrix],
    reactions: makeReactions([top, left, matrix.length, matrix[0]?.length || 0]),
    cellsOption: applyFlattened(state.cellsOption, options || {}),
  };
};