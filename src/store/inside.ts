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
  matrixShape, zoneToArea,
  zoneShape, superposeArea,
  makeReactions,
} from "../api/arrays"
import {tsv2matrix} from "../api/converters";
import { ParserType } from "../parsers/core";

export type InsideState = {
  matrix: MatrixType;
  choosing: PositionType;
  lastChoosing: PositionType;
  cutting: boolean;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  horizontalHeadersSelecting: boolean;
  verticalHeadersSelecting: boolean;
  editingCell: string;
  history: HistoryType;
  reactions: ReactionsType;
}

export const initialState: InsideState = {
  matrix: [],
  choosing: [-1, -1],
  lastChoosing: [-1, -1],
  cutting: false,
  selectingZone: [-1, -1, -1, -1],
  copyingZone: [-1, -1, -1, -1],
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
    const reactions = makeReactions(state.choosing, state.selectingZone);
    return {
      ...state,
      reactions,
      editingCell: "",
      /*
      choosing: [-1, -1] as PositionType,
      selectingZone: [-1, -1, -1, -1] as ZoneType,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
      */
    };
  },
  escape: (state: Draft<InsideState>) => {
    const reactions = makeReactions(state.selectingZone, state.copyingZone);
    return {
      ...state,
      reactions,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
      cutting: false,
      editingCell: "",
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  },
  copy: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload, state.copyingZone);
    return {...state, reactions, copyingZone: action.payload, cutting: false};
  },
  cut: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload, state.copyingZone);
    return {...state, reactions, copyingZone: action.payload, cutting: true};
  },
  choose: (state: Draft<InsideState>, action: PayloadAction<PositionType>) => {
    const [y, x] = action.payload;
    const reactions = makeReactions([y, x, y, x], state.selectingZone, state.choosing);
    return {
      ...state,
      reactions,
      choosing: action.payload,
      lastChoosing: state.choosing,
    };
  },
  reChoose: (state: Draft<InsideState>) => {
    const reactions = makeReactions(state.lastChoosing, state.choosing);
    return {
      ...state,
      reactions,
      choosing: state.lastChoosing,
    };
  },
  setEditingCell: (state: Draft<InsideState>, action: PayloadAction<string>) => {
    const [y, x] = state.choosing;
    const reactions = makeReactions(state.selectingZone, [y, x, y, x]);
    return {...state, reactions, editingCell: action.payload};
  },
  paste: (state: Draft<InsideState>, action: PayloadAction<{text: string, Parser: ParserType}>) => {
    const { choosing, copyingZone, cutting } = state;
    let { matrix, selectingZone } = state;
    const [y, x] = choosing;
    const selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const [selectingTop, selectingLeft] = selectingArea;
    const [copyingTop, copyingLeft] = copyingArea;
    const [selectingHeight, selectingWidth] = zoneShape(selectingArea);
    const [copyingHeight, copyingWidth] = zoneShape(copyingArea);
    const { text, Parser } = action.payload;

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
        after = tsv2matrix(text, Parser);
        [height, width] = [after.length - 1, after[0].length - 1];
      }
      dst = [y, x, y + height, x + width];
      before = cropMatrix(matrix, dst);
      matrix = writeMatrix(y, x, after, matrix);
      selectingZone = height === 0 && width === 0 ? [-1, -1, -1, -1] : [y, x, y + height, x + width];
    } else { // selecting destination
      if (copyingTop === -1) { // unselecting source
        after = tsv2matrix(text, Parser);
        [height, width] = superposeArea([0, 0, after.length - 1, after[0].length - 1], [0, 0, selectingHeight, selectingWidth]);
      } else { // selecting source
        [height, width] = superposeArea(copyingArea, selectingArea);
      }
      dst = selectingArea;
      after = spreadMatrix(after, height, width);
      before = cropMatrix(matrix, slideArea([0, 0, height, width], selectingTop, selectingLeft));
      matrix = writeMatrix(selectingTop, selectingLeft, after, matrix);
      selectingZone = slideArea([0, 0, height, width], selectingTop, selectingLeft);
    }
    const command = copyingArea[0] !== -1 ? cutting ? "cut" : "copy": "write";
    const history = pushHistory(state.history, {
      command,
      dst,
      src: copyingArea,
      before,
      after,
    });
    const reactions = makeReactions(copyingArea, selectingZone, dst);
    return {
      ...state,
      matrix,
      history,
      selectingZone,
      reactions,
      cutting: false,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
    };
  },
  select: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload);
    return {
      ...state,
      reactions,
      selectingZone: action.payload,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  },
  drag: (state: Draft<InsideState>, action: PayloadAction<PositionType>): InsideState => {
    const [y, x] = state.choosing;
    const selectingZone = [y, x, action.payload[0], action.payload[1]] as ZoneType;
    const reactions = makeReactions(selectingZone, state.selectingZone, state.choosing, [y, x]);
    return {...state, reactions, selectingZone};
  },
  selectRows: (state: Draft<InsideState>, action: PayloadAction<{range: RangeType, numCols: number}>) => {
    const { range, numCols } = action.payload;
    const [start, end] = range.sort();
    const selectingZone = [start, 0, end, numCols - 1] as ZoneType;
    const reactions = makeReactions(state.selectingZone, selectingZone);
    return {
      ...state,
      selectingZone,
      reactions,
      choosing: [start, 0] as PositionType,
      verticalHeadersSelecting: true,
      horizontalHeadersSelecting: false,
    };
  },
  selectCols: (state: Draft<InsideState>, action: PayloadAction<{range: RangeType, numRows: number}>) => {
    const { range, numRows} = action.payload;
    const [start, end] = range.sort();
    const selectingZone = [0, start, numRows - 1, end] as ZoneType;
    const reactions = makeReactions(state.selectingZone, selectingZone);
    return {
      ...state,
      selectingZone,
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
    const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
    let copyingZone = src as ZoneType;
    matrix = writeMatrix(y, x, before, matrix);

    switch(command) {
      case "copy":
        return {...state, matrix, selectingZone, history, choosing, copyingZone, reactions, cutting: false};

      case "cut":
        const [top, left] = src;
        matrix = writeMatrix(top, left, cropMatrix(after, slideArea(src, -top, -left)), matrix);
        return {...state, matrix, selectingZone, history, choosing, copyingZone, reactions, cutting: true};

      case "write":
        copyingZone = [-1, -1, -1, -1];
        return {... state, matrix, selectingZone, history, choosing, copyingZone, reactions, cutting: false};
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
    const selectingZone: ZoneType = h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
    const copyingZone = [-1, -1, -1, -1] as ZoneType;
    matrix = writeMatrix(y, x, after, matrix);

    switch(command) {
      case "copy":
        return {... state, matrix, selectingZone, copyingZone, history, choosing, reactions};
      case "cut":
        const [top, left, bottom, right] = src;
        const blank = spreadMatrix([[""]], bottom - top, right - left);
        matrix = writeMatrix(top, left, blank, matrix);
        matrix = writeMatrix(y, x, after, matrix);
        return {... state, matrix, selectingZone, copyingZone, history, choosing, reactions};
      case "write":
        return {... state, matrix, selectingZone, copyingZone, history, choosing, reactions};
    }
    return state;
  },
  walk: (state: Draft<InsideState>, action: PayloadAction<{
    deltaY: number; deltaX: number; numRows: number; numCols: number;
  }>) => {
    const { deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selectingZone } = state;
    const [y, x] = choosing;
    const selectingArea = zoneToArea(selectingZone);
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
      reactions: makeReactions([nextY, nextX, nextY, nextY], state.selectingZone, state.choosing),
      choosing: [nextY, nextX] as PositionType,
    };
  },
  arrow: (state: Draft<InsideState>, action: PayloadAction<{
    shiftKey: boolean; deltaY: number; deltaX: number; numRows: number; numCols: number;
  }>) => {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selectingZone } = state;
    const [y, x] = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [selectingZone[2] === -1 ? y : selectingZone[2], selectingZone[3] === -1 ? x : selectingZone[3]];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
        return state;
      }
      selectingZone = (y === nextY && x === nextX) ? [-1, -1, -1, -1] : [y, x, nextY, nextX];
      return {
        ... state,
        selectingZone,
        reactions: makeReactions(selectingZone, state.selectingZone, choosing),
      };
    }
    const [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
      return state;
    }
    return {
      ...state,
      reactions: makeReactions([nextY, nextX, nextY, nextY], state.selectingZone, choosing),
      selectingZone: [-1, -1, -1, -1] as ZoneType,
      choosing: [nextY, nextX] as PositionType,
    };
  },
  write: (state: Draft<InsideState>, action: PayloadAction<any>): InsideState => {
    const [y, x] = state.choosing;
    const value = action.payload;
    const matrix = writeMatrix(y, x, [[value]], state.matrix);
    const pointedArea = [y, x, y, x] as AreaType;
    const history = pushHistory(state.history, {
      command: "write",
      src: pointedArea,
      dst: pointedArea,
      before: [[state.matrix[y][x]]],
      after: [[value]],
    });
    const reactions = makeReactions(pointedArea, state.copyingZone);
    return {...state, matrix, history, reactions, copyingZone: [-1, -1, -1, -1]};
  },
  clear: (state: Draft<InsideState>): InsideState => {
    const { choosing, selectingZone, matrix } = state;

    let selectingArea = zoneToArea(selectingZone);
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
    const reactions = makeReactions(selectingArea, state.choosing, state.selectingZone);
    return {
      ...state,
      history,
      reactions,
      matrix: written,
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
  reChoose,
  setEditingCell,
  copy,
  cut,
  paste,
  select,
  drag,
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
