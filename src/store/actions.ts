import {
  StoreType,
  MatrixType,
  RectType,
  CellsOptionType,
  CellOptionType,
  ZoneType,
  AreaType,
  PositionType,
  Renderers,
  Parsers,
  RangeType,
} from "../types";
import {
  makeSequence,
  cropMatrix,
  writeMatrix,
  slideArea,
  spreadMatrix,
  zoneToArea,
  zoneShape,
  superposeArea,
} from "../api/arrays";
import { ParserType } from "../parsers/core";

import * as histories from "../api/histories";
import { tsv2matrix, n2a } from "../api/converters";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

const actions: { [s: string]: CoreAction<any> } = {};

export const reducer = <T>(
  store: StoreType,
  action: { type: string; value: T }
): StoreType => {
  const act: CoreAction<T> | undefined = actions[action.type];
  if (act == null) {
    return store;
  }
  return { ...store, ...act.reduce(store, action.value) };
};

export class CoreAction<T> {
  public code = "";

  constructor() {
    actions[this.code] = this;
  }
  public reduce(store: StoreType, payload: T): StoreType {
    return store;
  }
  public call(payload: T): { type: string; value: T } {
    return {
      type: this.code,
      value: payload,
    };
  }
  public bind() {
    return this.call.bind(this);
  }
}

class InitHistoryAction<T extends number> extends CoreAction<T> {
  code = "SET_RENDERERS";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      history: { operations: [], index: -1, size: payload },
    };
  }
}
export const initHistory = new InitHistoryAction().bind();

class SetEditingCellAction<T extends string> extends CoreAction<T> {
  code = "SET_EDITING_CELL";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: payload,
    };
  }
}
export const setEditingCell = new SetEditingCellAction().bind();

class SetRenderersAction<T extends Renderers> extends CoreAction<T> {
  code = "SET_RENDERERS";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      renderers: payload,
    };
  }
}
export const setRenderers = new SetRenderersAction().bind();

class SetParsersAction<T extends Parsers> extends CoreAction<T> {
  code = "SET_PARSERS";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      parsers: payload,
    };
  }
}
export const setParsers = new SetParsersAction().bind();

class SetEnteringAction<T extends boolean> extends CoreAction<T> {
  code = "SET_ENTERING";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      entering: payload,
    };
  }
}
export const setEntering = new SetEnteringAction().bind();

class SetHeaderHeightAction<T extends number> extends CoreAction<T> {
  code = "SET_HEADER_HEIGHT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerHeight: payload,
    };
  }
}
export const setHeaderHeight = new SetHeaderHeightAction().bind();

class SetHeaderWidthAction<T extends number> extends CoreAction<T> {
  code = "SET_HEADER_WIDTH";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerWidth: payload,
    };
  }
}
export const setHeaderWidth = new SetHeaderWidthAction().bind();

class SetSheetHeightAction<T extends number> extends CoreAction<T> {
  code = "SET_SHEET_HEIGHT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetHeight: payload,
    };
  }
}
export const setSheetHeight = new SetSheetHeightAction().bind();

class SetSheetWidthAction<T extends number> extends CoreAction<T> {
  code = "SET_SHEET_WIDTH";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetWidth: payload,
    };
  }
}
export const setSheetWidth = new SetSheetWidthAction().bind();

class SetMatrixAction<T extends MatrixType> extends CoreAction<T> {
  code = "SET_MATRIX";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      matrix: payload,
    };
  }
}
export const setMatrix = new SetMatrixAction().bind();

class SetEditorRectAction<T extends RectType> extends CoreAction<T> {
  code = "SET_EDITOR_RECT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editorRect: payload,
    };
  }
}
export const setEditorRect = new SetEditorRectAction().bind();

class SetResizingRectAction<T extends RectType> extends CoreAction<T> {
  code = "SET_RESIZING_RECT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingRect: payload,
    };
  }
}
export const setResizingRect = new SetResizingRectAction().bind();

class SetCellsOptionAction<T extends CellsOptionType> extends CoreAction<T> {
  code = "SET_CELLS_OPTION";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      cellsOption: payload,
    };
  }
}
export const setCellsOption = new SetCellsOptionAction().bind();

class SetCellOptionAction<
  T extends {
    cell: string;
    option: CellOptionType;
  }
> extends CoreAction<T> {
  code = "SET_CELLS_OPTION";
  reduce(store: StoreType, payload: T): StoreType {
    const { cell, option } = payload;
    const history = histories.pushHistory(store.history, {
      command: "styling",
      src: [-1, -1, -1, -1],
      dst: [-1, -1, -1, -1],
      before: [],
      after: [],
      options: {
        [`-${cell}`]: store.cellsOption[cell] || {},
        [cell]: option,
      },
    });
    return {
      ...store,
      history,
      cellsOption: {
        ...store.cellsOption,
        [cell]: option,
      },
    };
  }
}
export const setCellOption = new SetCellOptionAction().bind();

class BlurAction<T extends any> extends CoreAction<T> {
  code = "BLUR";
  reduce(store: StoreType): StoreType {
    return {
      ...store,
      editingCell: "",
    };
  }
}
export const blur = new BlurAction().bind();

class SetEditingAction<T extends string> extends CoreAction<T> {
  code = "SET_EDITING_CELL";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: payload,
    };
  }
}
export const setEditing = new SetEditingAction().bind();

class CopyAction<T extends ZoneType> extends CoreAction<T> {
  code = "COPY";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      copyingZone: payload,
      cutting: false,
    };
  }
}
export const copy = new CopyAction().bind();

class CutAction<T extends ZoneType> extends CoreAction<T> {
  code = "CUT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      copyingZone: payload,
      cutting: true,
    };
  }
}
export const cut = new CutAction().bind();

class PasteAction<
  T extends { text: string; parser: ParserType }
> extends CoreAction<T> {
  code = "PASTE";
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, copyingZone, cutting } = store;
    let { matrix, selectingZone } = store;
    const [y, x] = choosing;
    const selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const [selectingTop, selectingLeft] = selectingArea;
    const [copyingTop, copyingLeft] = copyingArea;
    const [selectingHeight, selectingWidth] = zoneShape(selectingArea);
    const [copyingHeight, copyingWidth] = zoneShape(copyingArea);
    const { text, parser } = payload;

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
    const history = histories.pushHistory(store.history, {
      command,
      dst,
      src: copyingArea,
      before,
      after,
    });
    return {
      ...store,
      matrix,
      history,
      selectingZone,
      cutting: false,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
    };
  }
}
export const paste = new PasteAction().bind();

class EscapeAction<T extends any> extends CoreAction<T> {
  code = "ESCAPE";
  reduce(store: StoreType): StoreType {
    return {
      ...store,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
      cutting: false,
      editingCell: "",
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  }
}
export const escape = new EscapeAction().bind();

class ChooseAction<T extends PositionType> extends CoreAction<T> {
  code = "CHOOSE";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      choosing: payload,
      entering: true,
    };
  }
}
export const choose = new ChooseAction().bind();

class SelectAction<T extends ZoneType> extends CoreAction<T> {
  code = "SELECT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      selectingZone: payload,
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  }
}
export const select = new SelectAction().bind();

class SelectRowsAction<
  T extends { range: RangeType; numCols: number }
> extends CoreAction<T> {
  code = "SELECT_ROWS";
  reduce(store: StoreType, payload: T): StoreType {
    const { range, numCols } = payload;
    const [start, end] = range.sort();
    const selectingZone = [start, 0, end, numCols - 1] as ZoneType;
    return {
      ...store,
      selectingZone,
      choosing: [start, 0] as PositionType,
      verticalHeadersSelecting: true,
      horizontalHeadersSelecting: false,
    };
  }
}
export const selectRows = new SelectRowsAction().bind();

class SelectColsAction<
  T extends { range: RangeType; numRows: number }
> extends CoreAction<T> {
  code = "SELECT_COLS";
  reduce(store: StoreType, payload: T): StoreType {
    const { range, numRows } = payload;
    const [start, end] = range.sort();
    const selectingZone = [0, start, numRows - 1, end] as ZoneType;

    return {
      ...store,
      selectingZone,
      choosing: [0, start] as PositionType,
      verticalHeadersSelecting: false,
      horizontalHeadersSelecting: true,
    };
  }
}
export const selectCols = new SelectColsAction().bind();

class DragAction<T extends PositionType> extends CoreAction<T> {
  code = "DRAG";
  reduce(store: StoreType, payload: T): StoreType {
    const [y, x] = store.choosing;
    const selectingZone = [y, x, payload[0], payload[1]] as ZoneType;
    return { ...store, selectingZone };
  }
}
export const drag = new DragAction().bind();

class SearchAction<T extends number> extends CoreAction<T> {
  code = "SEARCH";
  reduce(store: StoreType, payload: T): StoreType {
    let { matchingCells, matchingCellIndex } = store;
    matchingCellIndex += payload;
    if (matchingCellIndex >= matchingCells.length) {
      matchingCellIndex = 0;
    } else if (matchingCellIndex < 0) {
      matchingCellIndex = matchingCells.length - 1;
    }
    return { ...store, matchingCells, matchingCellIndex };
  }
}
export const search = new SearchAction().bind();

class WriteAction<T extends any> extends CoreAction<T> {
  code = "WRITE";
  reduce(store: StoreType, payload: T): StoreType {
    const [y, x] = store.choosing;
    const value = payload;
    const matrix = writeMatrix(y, x, [[value]], store.matrix);
    const pointedArea = [y, x, y, x] as AreaType;
    const history = histories.pushHistory(store.history, {
      command: "write",
      src: pointedArea,
      dst: pointedArea,
      before: [[store.matrix[y][x]]],
      after: [[value]],
    });
    return {
      ...store,
      matrix,
      history,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
    };
  }
}
export const write = new WriteAction().bind();

class ClearAction<T extends any> extends CoreAction<T> {
  code = "CLEAR";
  reduce(store: StoreType): StoreType {
    const { choosing, selectingZone, matrix } = store;

    let selectingArea = zoneToArea(selectingZone);
    const [top, left, bottom, right] = selectingArea;
    let [y, x] = [top, left];
    if (top === -1) {
      [y, x] = choosing;
      selectingArea = [y, x, y, x];
    }
    const after = spreadMatrix([[""]], bottom - top, right - left);
    const written = writeMatrix(y, x, after, matrix);
    const history = histories.pushHistory(store.history, {
      command: "write",
      dst: [y, x, y, x] as AreaType,
      src: selectingArea,
      before: cropMatrix(matrix, selectingArea),
      after,
    });
    return {
      ...store,
      history,
      matrix: written,
    };
  }
}
export const clear = new ClearAction().bind();

class UndoAction<T extends any> extends CoreAction<T> {
  code = "UNDO";
  reduce(store: StoreType): StoreType {
    const history = { ...store.history };
    if (history.index < 0) {
      return store;
    }
    const operation = history.operations[history.index--];
    switch (operation.command) {
      case "copy":
        return { ...histories.undoCopy(store, operation), history };

      case "cut":
        return { ...histories.undoCut(store, operation), history };

      case "write":
        return { ...histories.undoWrite(store, operation), history };

      case "addRows":
        return { ...histories.undoAddRows(store, operation), history };

      case "addCols":
        return { ...histories.undoAddCols(store, operation), history };

      case "delRows":
        return { ...histories.undoRemoveRows(store, operation), history };

      case "delCols":
        return { ...histories.undoRemoveCols(store, operation), history };

      case "styling":
        return { ...histories.undoStyling(store, operation), history };
    }
    return store;
  }
}
export const undo = new UndoAction().bind();

class RedoAction<T extends any> extends CoreAction<T> {
  code = "REDO";
  reduce(store: StoreType): StoreType {
    const history = { ...store.history };
    if (history.index + 1 >= history.operations.length) {
      return store;
    }
    const operation = history.operations[++history.index];
    switch (operation.command) {
      case "copy":
        return { ...histories.redoCopy(store, operation), history };

      case "cut":
        return { ...histories.redoCut(store, operation), history };

      case "write":
        return { ...histories.redoWrite(store, operation), history };

      case "addRows":
        return { ...histories.redoAddRows(store, operation), history };

      case "addCols":
        return { ...histories.redoAddCols(store, operation), history };

      case "delRows":
        return { ...histories.redoRemoveRows(store, operation), history };

      case "delCols":
        return { ...histories.redoRemoveCols(store, operation), history };

      case "styling":
        return { ...histories.redoStyling(store, operation), history };
    }
    return store;
  }
}
export const redo = new RedoAction().bind();

class ArrowAction<
  T extends {
    shiftKey: boolean;
    deltaY: number;
    deltaX: number;
    numRows: number;
    numCols: number;
  }
> extends CoreAction<T> {
  code = "ARROW";
  reduce(store: StoreType, payload: T): StoreType {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = payload;
    let { choosing, selectingZone, cellsOption } = store;
    const [y, x] = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [
        selectingZone[2] === -1 ? y : selectingZone[2],
        selectingZone[3] === -1 ? x : selectingZone[3],
      ];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
        return store;
      }
      selectingZone =
        y === nextY && x === nextX ? [-1, -1, -1, -1] : [y, x, nextY, nextX];
      return {
        ...store,
        selectingZone,
      };
    }
    const [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < 0 || numRows <= nextY || nextX < 0 || numCols <= nextX) {
      return store;
    }
    let [editorTop, editorLeft, height, width] = store.editorRect;
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
        editorLeft += store.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= store.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    }
    height = cellsOption[nextY + 1]?.height || defaultHeight;
    width = cellsOption[n2a(nextX + 1)]?.width || defaultWidth;

    return {
      ...store,
      selectingZone: [-1, -1, -1, -1] as ZoneType,
      choosing: [nextY, nextX] as PositionType,
      editorRect: [editorTop, editorLeft, height, width] as RectType,
    };
  }
}
export const arrow = new ArrowAction().bind();

class WalkAction<
  T extends {
    deltaY: number;
    deltaX: number;
    numRows: number;
    numCols: number;
  }
> extends CoreAction<T> {
  code = "WALK";
  reduce(store: StoreType, payload: T): StoreType {
    const { deltaY, deltaX, numRows, numCols } = payload;
    let { choosing, selectingZone, cellsOption } = store;
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
      return store;
    }

    let [editorTop, editorLeft, height, width] = store.editorRect;
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
        editorLeft += store.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= store.cellsOption[n2a(i + 1)]?.width || defaultWidth;
      }
    }
    height = cellsOption[nextY + 1]?.height || defaultHeight;
    width = cellsOption[n2a(nextX + 1)]?.width || defaultWidth;

    return {
      ...store,
      choosing: [nextY, nextX] as PositionType,
      editorRect: [editorTop, editorLeft, height, width] as RectType,
    };
  }
}
export const walk = new WalkAction().bind();
