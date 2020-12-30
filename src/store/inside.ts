import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  MatrixType,
  PositionType,
  RangeType,
  AreaType,
  ZoneType,
  HistoryType,
  ReactionsType,
} from "../types";
import { pushHistory } from "../api/histories";

import {
  cropMatrix,
  writeMatrix,
  slideArea,
  spreadMatrix,
  matrixShape, draggingToArea,
  shape, superposeArea,
  makeReactions,
} from "../api/arrays"
import {convertTSVToArray} from "../api/converters";
import { RendererType } from "../renderers/core";

export type InsideState = {
  matrix: MatrixType;
  choosing: PositionType;
  choosingLast: PositionType;
  cutting: boolean;
  selecting: ZoneType;
  horizontalHeadersSelecting: boolean;
  verticalHeadersSelecting: boolean;
  copying: ZoneType;
  editingCell: string;
  history: HistoryType;
  reactions: ReactionsType;
}

export const initialState: InsideState = {
  matrix: [],
  choosing: [-1, -1],
  choosingLast: [-1, -1],
  cutting: false,
  copying: [-1, -1, -1, -1],
  selecting: [-1, -1, -1, -1],
  horizontalHeadersSelecting: false,
  verticalHeadersSelecting: false,
  editingCell: "",
  history: {index: -1, size: 0, operations: []},
  reactions: {},
};

const reducers = {
  setMatrix: (state: Draft<InsideState>, action: PayloadAction<MatrixType>) => {
    return {...state, matrix: [... action.payload]};
  },
  blur: (state: Draft<InsideState>) => {
    const reactions = makeReactions(state.choosing, state.selecting);
    return {
      ...state,
      reactions,
      choosingLast: state.choosing,
      choosing: [-1, -1] as PositionType,
      selecting: [-1, -1, -1, -1] as ZoneType,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
      editingCell: "",
    };
  },
  escape: (state: Draft<InsideState>) => {
    const reactions = makeReactions(state.selecting, state.copying);
    return {
      ...state,
      reactions,
      copying: [-1, -1, -1, -1] as ZoneType,
      cutting: false,
      editingCell: "",
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  },
  copy: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload, state.copying);
    return {...state, reactions, copying: action.payload, cutting: false};
  },
  cut: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload, state.copying);
    return {...state, reactions, copying: action.payload, cutting: true};
  },
  refocus: (state: Draft<InsideState>, action: PayloadAction<{
    selecting: ZoneType;
    choosing: PositionType;
  }>) => {
    const { selecting, choosing } = action.payload;
    const reactions = makeReactions(selecting, choosing);
    return {
      ...state,
      ...action.payload,
      reactions,
    };
  },
  choose: (state: Draft<InsideState>, action: PayloadAction<PositionType>) => {
    const [y, x] = action.payload;
    const reactions = makeReactions([y, x, y, x], state.selecting, state.choosing);
    return {
      ...state,
      reactions,
      choosing: action.payload,
      selecting: [y, x, y, x] as ZoneType,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  },
  setChoosingLast: (state: Draft<InsideState>, action: PayloadAction<PositionType>) => {
    return {...state, choosingLast: action.payload};
  },
  setCutting: (state: Draft<InsideState>, action: PayloadAction<boolean>) => {
    return {...state, cutting: action.payload};
  },
  setEditingCell: (state: Draft<InsideState>, action: PayloadAction<string>) => {
    const [y, x] = state.choosing;
    const reactions = makeReactions(state.selecting, [y, x, y, x]);
    return {...state, reactions, editingCell: action.payload};
  },
  paste: (state: Draft<InsideState>, action: PayloadAction<string>) => {
    const { choosing, copying, cutting } = state;
    let { matrix, selecting } = state;
    const [y, x] = choosing;
    const selectingArea = draggingToArea(selecting);
    const copyingArea = draggingToArea(copying);
    const [selectingTop, selectingLeft] = selectingArea;
    const [copyingTop, copyingLeft] = copyingArea;
    const [selectingHeight, selectingWidth] = shape(selectingArea);
    const [copyingHeight, copyingWidth] = shape(copyingArea);
    const text = action.payload;

    let before: MatrixType = [];
    let after = cropMatrix(matrix, copyingArea);
    let height = copyingHeight;
    let width = copyingWidth;
    let dst: AreaType;
    if (cutting) {
      const blank = spreadMatrix([[""]], copyingHeight, copyingWidth);
      matrix = writeMatrix(copyingTop, copyingLeft, blank, matrix);
    }
    if (selectingTop === -1) { // unselecting destination
      if (copyingTop === -1) { // unselecting source
        after = convertTSVToArray(text);
        [height, width] = [after.length - 1, after[0].length - 1];
      }
      dst = [y, x, y + height, x + width];
      before = cropMatrix(matrix, dst);
      matrix = writeMatrix(y, x, after, matrix);
      selecting = height === 0 && width === 0 ? [-1, -1, -1, -1] : [y, x, y + height, x + width];
    } else { // selecting destination
      if (copyingTop === -1) { // unselecting source
        after = convertTSVToArray(text);
        [height, width] = superposeArea([0, 0, after.length - 1, after[0].length - 1], [0, 0, selectingHeight, selectingWidth]);
      } else { // selecting source
        [height, width] = superposeArea(copyingArea, selectingArea);
      }
      dst = selectingArea;
      after = spreadMatrix(after, height, width);
      before = cropMatrix(matrix, slideArea([0, 0, height, width], selectingTop, selectingLeft));
      matrix = writeMatrix(selectingTop, selectingLeft, after, matrix);
      selecting = slideArea([0, 0, height, width], selectingTop, selectingLeft);
    }
    const command = copyingArea[0] !== -1 ? cutting ? "cut" : "copy": "write";
    const history = pushHistory(state.history, {
      command,
      dst,
      src: copyingArea,
      before,
      after,
    });
    const reactions = makeReactions(copyingArea, selecting, dst);
    return {
      ...state,
      matrix,
      history,
      selecting,
      reactions,
      cutting: false,
      copying: [-1, -1, -1, -1] as ZoneType,
    };
  },
  select: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload);
    return {
      ...state,
      reactions,
      selecting: action.payload,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  },
  drag: (state: Draft<InsideState>, action: PayloadAction<PositionType>): InsideState => {
    const [y, x] = state.choosing;
    const selecting = [y, x, action.payload[0], action.payload[1]] as ZoneType;
    const reactions = makeReactions(selecting, state.selecting, state.choosing, [y, x]);
    return {...state, reactions, selecting};
  },
  selectAll: (state: Draft<InsideState>, action: PayloadAction<{numRows: number, numCols: number}>) => {
    const { numRows, numCols } = action.payload;
    const selecting = [0, 0, numRows - 1, numCols - 1] as ZoneType;
    const reactions = makeReactions(selecting);
    return {
      ...state,
      selecting,
      reactions,
      horizontalHeadersSelecting: true,
      verticalHeadersSelecting: true,
    };
  },
  selectRows: (state: Draft<InsideState>, action: PayloadAction<{range: RangeType, numCols: number}>) => {
    const { range, numCols } = action.payload;
    const [start, end] = range.sort();
    const selecting = [start, 0, end, numCols - 1] as ZoneType;
    const reactions = makeReactions(state.selecting, selecting);
    return {
      ...state,
      selecting,
      reactions,
      choosing: [start, 0] as PositionType,
      verticalHeadersSelecting: true,
      horizontalHeadersSelecting: false,
    };
  },
  selectCols: (state: Draft<InsideState>, action: PayloadAction<{range: RangeType, numRows: number}>) => {
    const { range, numRows} = action.payload;
    const [start, end] = range.sort();
    const selecting = [0, start, numRows - 1, end] as ZoneType;
    const reactions = makeReactions(state.selecting, selecting);
    return {
      ...state,
      selecting,
      reactions,
      choosing: [0, start] as PositionType,
      verticalHeadersSelecting: false,
      horizontalHeadersSelecting: true,
    };
  },
  initHistory: (state: Draft<InsideState>, action: PayloadAction<number>) => {
    return {...state, history: {operations: [], index: -1, size: action.payload}};
  },
  undo: (state: Draft<InsideState>) => {
    const history = {... state.history };
    let { matrix } = state;
    if (history.index < 0) {
      return state;
    }
    const { command, src, dst, before, after } = history.operations[history.index--];
    const [y, x] = dst;
    const reactions = makeReactions(src, dst, state.choosing);
    const choosing = [y, x] as PositionType;
    const [h, w] = matrixShape(before);
    const selecting: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
    let copying = src as ZoneType;
    matrix = writeMatrix(y, x, before, matrix);

    switch(command) {
      case "copy":
        return {...state, matrix, selecting, history, choosing, copying, reactions, cutting: false};

      case "cut":
        const [top, left] = src;
        matrix = writeMatrix(top, left, cropMatrix(after, slideArea(src, -top, -left)), matrix);
        return {...state, matrix, selecting, history, choosing, copying, reactions, cutting: true};

      case "write":
        copying = [-1, -1, -1, -1];
        return {... state, matrix, selecting, history, choosing, copying, reactions, cutting: false};
    }
    return state;
  },
  redo: (state: Draft<InsideState>) => {
    const history = {... state.history };
    let { matrix } = state;
    if (history.index + 1 >= history.operations.length) {
      return state;
    }
    const { command, src, dst, after } = history.operations[++history.index];
    const [y, x] = dst;
    const reactions = makeReactions(src, dst, state.choosing);
    const choosing = [y, x] as PositionType;
    const [h, w] = matrixShape(after);
    const selecting: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
    const copying = [-1, -1, -1, -1] as ZoneType;
    matrix = writeMatrix(y, x, after, matrix);

    switch(command) {
      case "copy":
        return {... state, matrix, selecting, copying, history, choosing, reactions};
      case "cut":
        const [top, left, bottom, right] = src;
        const blank = spreadMatrix([[""]], bottom - top, right - left);
        matrix = writeMatrix(top, left, blank, matrix);
        matrix = writeMatrix(y, x, after, matrix);
        return {... state, matrix, selecting, copying, history, choosing, reactions};
      case "write":
        return {... state, matrix, selecting, copying, history, choosing, reactions};
    }
    return state;
  },
  walk: (state: Draft<InsideState>, action: PayloadAction<{
    deltaY: number; deltaX: number; numRows: number; numCols: number;
  }>) => {
    const { deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selecting } = state;
    const [y, x] = choosing;
    const selectingArea = draggingToArea(selecting);
    const [top, left, bottom, right] = selectingArea;
    let [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < top && top !== -1) {
      nextY = bottom;
      nextX = nextX > left ? nextX - 1 : right;
    }
    if (nextY > bottom && bottom !== -1) {
      nextY = top;
      nextX = nextX < right ? nextX + 1 : left;
    }
    if (nextX < left && left !== -1) {
      nextX = right;
      nextY = nextY > top ? nextY - 1 : bottom;
    }
    if (nextX > right && right !== -1) {
      nextX = left;
      nextY = nextY < bottom ? nextY + 1 : top;
    }
    if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
      return state;
    }
    return {
      ...state,
      reactions: makeReactions([nextY, nextX, nextY, nextY], state.selecting, state.choosing),
      choosing: [nextY, nextX] as PositionType,
    };
  },
  arrow: (state: Draft<InsideState>, action: PayloadAction<{
    shiftKey: boolean; deltaY: number; deltaX: number; numRows: number; numCols: number;
  }>) => {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selecting } = state;
    const [y, x] = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [selecting[2] === -1 ? y : selecting[2], selecting[3] === -1 ? x : selecting[3]];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
        return state;
      }
      selecting = (y === nextY && x === nextX) ? [-1, -1, -1, -1] : [y, x, nextY, nextX];
      return {
        ... state,
        selecting,
        reactions: makeReactions(selecting, state.selecting, choosing),
      };
    }
    const [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
      return state;
    }
    return {
      ...state,
      reactions: makeReactions([nextY, nextX, nextY, nextY], state.selecting, choosing),
      selecting: [-1, -1, -1, -1] as ZoneType,
      choosing: [nextY, nextX] as PositionType,
    };
  },
  write: (state: Draft<InsideState>, action: PayloadAction<any>): InsideState => {
    const [y, x] = state.choosing;
    const value = action.payload;
    const matrix = writeMatrix(y, x, [[value]], state.matrix);
    const point = [y, x, y, x] as AreaType;
    const history = pushHistory(state.history, {
      command: "write",
      src: point,
      dst: point,
      before: [[state.matrix[y][x]]],
      after: [[value]],
    });
    const reactions = makeReactions(point, state.copying);
    return {...state, matrix, history, reactions, copying: [-1, -1, -1, -1]};
  },
  clear: (state: Draft<InsideState>): InsideState => {
    const { choosing, selecting, matrix } = state;

    let selectingArea = draggingToArea(selecting);
    const [top, left, bottom, right] = selectingArea;
    let [y, x] = [top, left];
    if (top === -1) {
      [y, x] = choosing;
      selectingArea = [y, x, y, x];
    }
    const after = spreadMatrix([[""]], bottom - top, right - left);
    const written = writeMatrix(y, x, after, matrix);
    const history = pushHistory(state.history, {
      command: "write",
      dst: [y, x, y, x] as AreaType,
      src: selectingArea,
      before: cropMatrix(matrix, selectingArea),
      after,
    });
    const reactions = makeReactions(selectingArea, state.choosing, state.selecting);
    return {
      ...state,
      history,
      reactions,
      matrix: written,
      // selecting: [-1, -1, -1, -1],
    };
  },
};

const slice = createSlice({
  name: "operations",
  initialState,
  reducers,
});


export default slice.reducer;
export const {
  setMatrix,
  blur,
  escape,
  choose,
  setChoosingLast,
  setCutting,
  setEditingCell,
  copy,
  cut,
  refocus,
  paste,
  select,
  drag,
  selectAll,
  selectRows,
  selectCols,
  initHistory,
  undo,
  redo,
  arrow,
  walk,
  write,
  clear,
} = slice.actions;
