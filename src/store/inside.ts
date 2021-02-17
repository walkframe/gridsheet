import React from "react";
import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  MatrixType,
  CellsOptionType,
  CellOptionType,
  PositionType,
  RangeType,
  AreaType,
  ZoneType,
  InsideState,
  RectType,
} from "../types";

import * as histories from "../api/histories";

import {
  makeSequence,
  cropMatrix,
  writeMatrix,
  slideArea,
  spreadMatrix,
  zoneToArea,
  zoneShape,
  superposeArea,
  makeReactions,
  slideFlattened,
  applyFlattened,
} from "../api/arrays";
import { tsv2matrix, n2a } from "../api/converters";
import { ParserType } from "../parsers/core";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

export const initialState: InsideState = {
  matrix: [],
  cellsOption: {},
  choosing: [-1, -1],
  lastChoosing: [-1, -1],
  cutting: false,
  selectingZone: [-1, -1, -1, -1],
  copyingZone: [-1, -1, -1, -1],
  horizontalHeadersSelecting: false,
  verticalHeadersSelecting: false,
  editingCell: "",
  history: { index: -1, size: 0, operations: [] },
  reactions: {},
  editorRect: [0, 0, 0, 0],
  resizingRect: [-1, -1, -1, -1],
  sheetHeight: 0,
  sheetWidth: 0,
};

const reducers = {
  setCurrentStyle: (
    state: Draft<InsideState>,
    action: PayloadAction<React.CSSProperties>
  ) => {
    return { ...state, currentStyle: action.payload };
  },
  setSheetHeight: (
    state: Draft<InsideState>,
    action: PayloadAction<number>
  ) => {
    return { ...state, sheetHeight: action.payload };
  },
  setSheetWidth: (state: Draft<InsideState>, action: PayloadAction<number>) => {
    return { ...state, sheetWidth: action.payload };
  },
  setEditorRect: (
    state: Draft<InsideState>,
    action: PayloadAction<RectType>
  ) => {
    return { ...state, editorRect: [...action.payload] as RectType };
  },
  setResizingRect: (
    state: Draft<InsideState>,
    action: PayloadAction<RectType>
  ) => {
    return { ...state, resizingRect: [...action.payload] as RectType };
  },
  setMatrix: (state: Draft<InsideState>, action: PayloadAction<MatrixType>) => {
    return { ...state, matrix: [...action.payload] };
  },
  setCellsOption: (
    state: Draft<InsideState>,
    action: PayloadAction<CellsOptionType>
  ) => {
    return { ...state, cellsOption: action.payload };
  },
  setCellOption: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      cell: string;
      option: CellOptionType;
    }>
  ) => {
    const { cell, option } = action.payload;
    return {
      ...state,
      cellsOption: {
        ...state.cellsOption,
        [cell]: option,
      },
    };
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
    return { ...state, reactions, copyingZone: action.payload, cutting: false };
  },
  cut: (state: Draft<InsideState>, action: PayloadAction<ZoneType>) => {
    const reactions = makeReactions(action.payload, state.copyingZone);
    return { ...state, reactions, copyingZone: action.payload, cutting: true };
  },
  choose: (state: Draft<InsideState>, action: PayloadAction<PositionType>) => {
    const [y, x] = action.payload;
    const reactions = makeReactions(
      [y, x, y, x],
      state.selectingZone,
      state.choosing
    );
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
  setEditingCell: (
    state: Draft<InsideState>,
    action: PayloadAction<string>
  ) => {
    const [y, x] = state.choosing;
    const reactions = makeReactions(state.selectingZone, [y, x, y, x]);
    return { ...state, reactions, editingCell: action.payload };
  },
  paste: (
    state: Draft<InsideState>,
    action: PayloadAction<{ text: string; parser: ParserType }>
  ) => {
    const { choosing, copyingZone, cutting } = state;
    let { matrix, selectingZone } = state;
    const [y, x] = choosing;
    const selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const [selectingTop, selectingLeft] = selectingArea;
    const [copyingTop, copyingLeft] = copyingArea;
    const [selectingHeight, selectingWidth] = zoneShape(selectingArea);
    const [copyingHeight, copyingWidth] = zoneShape(copyingArea);
    const { text, parser } = action.payload;

    let before: MatrixType = [];
    let after = cropMatrix(matrix, copyingArea);
    let height = copyingHeight;
    let width = copyingWidth;
    let dst: AreaType;
    if (cutting) {
      const blank = spreadMatrix([[""]], copyingHeight, copyingWidth);
      matrix = writeMatrix(copyingTop, copyingLeft, blank, matrix);
    }
    if (selectingTop === -1) {
      // unselecting destination
      if (copyingTop === -1) {
        // unselecting source
        after = tsv2matrix(text, parser);
        [height, width] = [after.length - 1, after[0].length - 1];
      }
      dst = [y, x, y + height, x + width];
      before = cropMatrix(matrix, dst);
      matrix = writeMatrix(y, x, after, matrix);
      selectingZone =
        height === 0 && width === 0
          ? [-1, -1, -1, -1]
          : [y, x, y + height, x + width];
    } else {
      // selecting destination
      if (copyingTop === -1) {
        // unselecting source
        after = tsv2matrix(text, parser);
        [height, width] = superposeArea(
          [0, 0, after.length - 1, after[0].length - 1],
          [0, 0, selectingHeight, selectingWidth]
        );
      } else {
        // selecting source
        [height, width] = superposeArea(copyingArea, selectingArea);
      }
      dst = selectingArea;
      after = spreadMatrix(after, height, width);
      before = cropMatrix(
        matrix,
        slideArea([0, 0, height, width], selectingTop, selectingLeft)
      );
      matrix = writeMatrix(selectingTop, selectingLeft, after, matrix);
      selectingZone = slideArea(
        [0, 0, height, width],
        selectingTop,
        selectingLeft
      );
    }
    const command =
      copyingArea[0] !== -1 ? (cutting ? "cut" : "copy") : "write";
    const history = histories.pushHistory(state.history, {
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
  drag: (
    state: Draft<InsideState>,
    action: PayloadAction<PositionType>
  ): InsideState => {
    const [y, x] = state.choosing;
    const selectingZone = [
      y,
      x,
      action.payload[0],
      action.payload[1],
    ] as ZoneType;
    const reactions = makeReactions(
      selectingZone,
      state.selectingZone,
      state.choosing,
      [y, x]
    );
    return { ...state, reactions, selectingZone };
  },
  selectRows: (
    state: Draft<InsideState>,
    action: PayloadAction<{ range: RangeType; numCols: number }>
  ) => {
    const { range, numCols } = action.payload;
    const [start, end] = range.sort();
    const selectingZone = [start, 0, end, numCols - 1] as ZoneType;
    const reactions = makeReactions(
      state.selectingZone,
      state.choosing,
      selectingZone
    );
    return {
      ...state,
      selectingZone,
      reactions,
      choosing: [start, 0] as PositionType,
      verticalHeadersSelecting: true,
      horizontalHeadersSelecting: false,
    };
  },
  selectCols: (
    state: Draft<InsideState>,
    action: PayloadAction<{ range: RangeType; numRows: number }>
  ) => {
    const { range, numRows } = action.payload;
    const [start, end] = range.sort();
    const selectingZone = [0, start, numRows - 1, end] as ZoneType;
    const reactions = makeReactions(
      state.selectingZone,
      state.choosing,
      selectingZone
    );
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
    return {
      ...state,
      history: { operations: [], index: -1, size: action.payload },
    };
  },
  undo: (state: Draft<InsideState>) => {
    const history = { ...state.history };
    if (history.index < 0) {
      return state;
    }
    const operation = history.operations[history.index--];
    switch (operation.command) {
      case "copy":
        return { ...histories.undoCopy(state, operation), history };

      case "cut":
        return { ...histories.undoCut(state, operation), history };

      case "write":
        return { ...histories.undoWrite(state, operation), history };

      case "addRows":
        return { ...histories.undoAddRows(state, operation), history };

      case "addCols":
        return { ...histories.undoAddCols(state, operation), history };

      case "delRows":
        return { ...histories.undoRemoveRows(state, operation), history };

      case "delCols":
        return { ...histories.undoRemoveCols(state, operation), history };
    }
    return state;
  },
  redo: (state: Draft<InsideState>) => {
    const history = { ...state.history };
    if (history.index + 1 >= history.operations.length) {
      return state;
    }
    const operation = history.operations[++history.index];
    switch (operation.command) {
      case "copy":
        return { ...histories.redoCopy(state, operation), history };

      case "cut":
        return { ...histories.redoCut(state, operation), history };

      case "write":
        return { ...histories.redoWrite(state, operation), history };

      case "addRows":
        return { ...histories.redoAddRows(state, operation), history };

      case "addCols":
        return { ...histories.redoAddCols(state, operation), history };

      case "delRows":
        return { ...histories.redoRemoveRows(state, operation), history };

      case "delCols":
        return { ...histories.redoRemoveCols(state, operation), history };
    }
    return state;
  },
  walk: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      deltaY: number;
      deltaX: number;
      numRows: number;
      numCols: number;
    }>
  ) => {
    const { deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selectingZone, cellsOption } = state;
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

    let [editorTop, editorLeft, height, width] = state.editorRect;
    const defaultHeight = cellsOption.default?.height || DEFAULT_HEIGHT;
    const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;
    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += cellsOption[i + 1]?.height || defaultHeight;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= cellsOption[i + 1]?.height || defaultHeight;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += state.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= state.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    }
    height = cellsOption[nextY + 1]?.height || defaultHeight;
    width = cellsOption[n2a(nextX + 1)]?.width || defaultWidth;

    return {
      ...state,
      reactions: makeReactions(
        [nextY, nextX, nextY, nextY],
        state.selectingZone,
        state.choosing
      ),
      choosing: [nextY, nextX] as PositionType,
      editorRect: [editorTop, editorLeft, height, width] as RectType,
    };
  },
  arrow: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      shiftKey: boolean;
      deltaY: number;
      deltaX: number;
      numRows: number;
      numCols: number;
    }>
  ) => {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = action.payload;
    let { choosing, selectingZone, cellsOption } = state;
    const [y, x] = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [
        selectingZone[2] === -1 ? y : selectingZone[2],
        selectingZone[3] === -1 ? x : selectingZone[3],
      ];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
        return state;
      }
      selectingZone =
        y === nextY && x === nextX ? [-1, -1, -1, -1] : [y, x, nextY, nextX];
      return {
        ...state,
        selectingZone,
        reactions: makeReactions(selectingZone, state.selectingZone, choosing),
      };
    }
    const [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
      return state;
    }
    let [editorTop, editorLeft, height, width] = state.editorRect;
    const defaultHeight = cellsOption.default?.height || DEFAULT_HEIGHT;
    const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;
    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += cellsOption[i + 1]?.height || defaultHeight;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= cellsOption[i + 1]?.height || defaultHeight;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += state.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= state.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    }
    height = cellsOption[nextY + 1]?.height || defaultHeight;
    width = cellsOption[n2a(nextX + 1)]?.width || defaultWidth;

    return {
      ...state,
      reactions: makeReactions(
        [nextY, nextX, nextY, nextY],
        state.selectingZone,
        choosing
      ),
      selectingZone: [-1, -1, -1, -1] as ZoneType,
      choosing: [nextY, nextX] as PositionType,
      editorRect: [editorTop, editorLeft, height, width] as RectType,
    };
  },
  write: (
    state: Draft<InsideState>,
    action: PayloadAction<any>
  ): InsideState => {
    const [y, x] = state.choosing;
    const value = action.payload;
    const matrix = writeMatrix(y, x, [[value]], state.matrix);
    const pointedArea = [y, x, y, x] as AreaType;
    const history = histories.pushHistory(state.history, {
      command: "write",
      src: pointedArea,
      dst: pointedArea,
      before: [[state.matrix[y][x]]],
      after: [[value]],
    });
    const reactions = makeReactions(pointedArea, state.copyingZone);
    return {
      ...state,
      matrix,
      history,
      reactions,
      copyingZone: [-1, -1, -1, -1],
    };
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
    const history = histories.pushHistory(state.history, {
      command: "write",
      dst: [y, x, y, x] as AreaType,
      src: selectingArea,
      before: cropMatrix(matrix, selectingArea),
      after,
    });
    const reactions = makeReactions(
      selectingArea,
      state.choosing,
      state.selectingZone
    );
    return {
      ...state,
      history,
      reactions,
      matrix: written,
    };
  },
  addRows: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      numRows: number;
      y: number;
    }>
  ) => {
    const matrix = [...state.matrix];
    const numCols = matrix[0]?.length || 0;
    const { numRows, y } = action.payload;
    const diff = slideFlattened(state.cellsOption, numRows, null, y, null);
    const blanks = makeSequence(0, numRows).map(() =>
      makeSequence(0, numCols).map(() => "")
    );
    matrix.splice(y, 0, ...blanks);
    const history = histories.pushHistory(state.history, {
      command: "addRows",
      dst: [y, 0, y + numRows - 1, numCols - 1] as AreaType,
      src: [-1, -1, -1, -1] as AreaType,
      before: [] as MatrixType,
      after: [] as MatrixType,
      options: diff,
    });
    return {
      ...state,
      matrix: [...matrix],
      reactions: makeReactions([0, 0, matrix.length, matrix[0].length]),
      cellsOption: applyFlattened(state.cellsOption, diff),
      history,
    };
  },
  removeRows: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      numRows: number;
      y: number;
    }>
  ) => {
    const matrix = [...state.matrix];
    const { numRows, y } = action.payload;
    const numCols = matrix[0]?.length;
    const before = cropMatrix(matrix, [y, 0, y + numRows - 1, numCols - 1]);
    const diff = slideFlattened(state.cellsOption, -numRows, null, y, null);
    matrix.splice(y, numRows);
    const history = histories.pushHistory(state.history, {
      command: "delRows",
      dst: [-1, -1, -1, -1] as AreaType,
      src: [y, 0, y + numRows - 1, numCols - 1] as AreaType,
      before,
      after: [] as MatrixType,
      options: diff,
    });
    return {
      ...state,
      matrix: [...matrix],
      reactions: makeReactions([0, 0, matrix.length, numCols]),
      cellsOption: applyFlattened(state.cellsOption, diff),
      history,
    };
  },
  addCols: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      numCols: number;
      x: number;
    }>
  ) => {
    const { numCols, x } = action.payload;
    const matrix = [...state.matrix].map((cols) => {
      const blanks = makeSequence(0, numCols).map(() => "");
      cols = [...cols];
      cols.splice(x, 0, ...blanks);
      return cols;
    });
    const numRows = matrix.length;
    const diff = slideFlattened(
      { ...state.cellsOption },
      null,
      numCols,
      null,
      x
    );
    const history = histories.pushHistory(state.history, {
      command: "addCols",
      dst: [0, x, numRows, x + numCols - 1] as AreaType,
      src: [-1, -1, -1, -1] as AreaType,
      before: [] as MatrixType,
      after: [] as MatrixType,
      options: diff,
    });
    return {
      ...state,
      matrix,
      reactions: makeReactions([0, 0, numRows, matrix[0].length]),
      cellsOption: applyFlattened(state.cellsOption, diff),
      history,
    };
  },
  removeCols: (
    state: Draft<InsideState>,
    action: PayloadAction<{
      numCols: number;
      x: number;
    }>
  ) => {
    const { numCols, x } = action.payload;
    const numRows = state.matrix.length;
    const before = cropMatrix(state.matrix, [
      0,
      x,
      numRows - 1,
      x + numCols - 1,
    ]);
    const matrix = [...state.matrix].map((cols) => {
      cols = [...cols];
      cols.splice(x, numCols);
      return cols;
    });

    const diff = slideFlattened(
      { ...state.cellsOption },
      null,
      -numCols,
      null,
      x
    );
    const history = histories.pushHistory(state.history, {
      command: "delCols",
      dst: [-1, -1, -1, -1] as AreaType,
      src: [0, x, numRows - 1, x + numCols - 1] as AreaType,
      before,
      after: [] as MatrixType,
      options: diff,
    });
    return {
      ...state,
      matrix,
      reactions: makeReactions([0, 0, numRows, matrix[0].length]),
      cellsOption: applyFlattened(state.cellsOption, diff),
      history,
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
  setEditorRect,
  setSheetHeight,
  setSheetWidth,
  setResizingRect,
  setCurrentStyle,
  setCellsOption,
  setCellOption,
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
  addRows,
  removeRows,
  addCols,
  removeCols,
} = slice.actions;
