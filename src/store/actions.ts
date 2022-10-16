import {
  StoreType,
  RectType,
  ZoneType,
  PositionType,
  RangeType,
  Feedback,
  HistoryType,
  CellType,
  DiffType,
  HistoryOperationType,
  AreaType,
} from "../types";
import {
  zoneToArea,
  zoneShape,
  superposeArea,
  matrixShape,
} from "../api/matrix";
import { Table } from "../api/table";

import { tsv2matrix, x2c, positionToAddress, y2r } from "../api/converters";
import { Area, DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

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
    actions[this.code] = this;
    return this.call.bind(this);
  }
}

class InitHistoryAction<T extends number> extends CoreAction<T> {
  code = "INIT_HISTORY";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      history: {
        operations: [],
        index: -1,
        size: payload,
        direction: "FORWARD",
      },
    };
  }
}
export const initHistory = new InitHistoryAction().bind();

class SetSearchQueryAction<T extends string | undefined> extends CoreAction<T> {
  code = "SET_SEARCH_QUERY";
  reduce(store: StoreType, payload: T): StoreType {
    const searchQuery = payload;
    const matchingCells: string[] = [];
    if (!searchQuery) {
      return { ...store, searchQuery, matchingCells, matchingCellIndex: 0 };
    }
    const { table } = store;
    for (let x = 1; x <= table.numCols(); x++) {
      for (let y = 1; y <= table.numRows(); y++) {
        if (table.stringify([y, x]).indexOf(searchQuery as string) !== -1) {
          matchingCells.push(`${x2c(x)}${y2r(y)}`);
        }
      }
    }
    return { ...store, searchQuery, matchingCells, matchingCellIndex: 0 };
  }
}
export const setSearchQuery = new SetSearchQueryAction().bind();

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

class SetEditingOnEnterAction<T extends boolean> extends CoreAction<T> {
  code = "SET_EDITING_ON_ENTER";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingOnEnter: payload,
    };
  }
}
export const setEditingOnEnter = new SetEditingOnEnterAction().bind();

class SetCellLabelAction<T extends boolean> extends CoreAction<T> {
  code = "SET_CELL_LABEL";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      cellLabel: payload,
    };
  }
}
export const setCellLabel = new SetCellLabelAction().bind();

class SetContextMenuPositionAction<
  T extends [number, number]
> extends CoreAction<T> {
  code = "SET_CONTEXT_MENU_POSITION";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      contextMenuPosition: payload,
    };
  }
}
export const setContextMenuPosition = new SetContextMenuPositionAction().bind();

class SetResizingPositionYAction<
  T extends [number, number, number]
> extends CoreAction<T> {
  code = "SET_RESIZING_POSITION_Y";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingPositionY: payload,
    };
  }
}
export const setResizingPositionY = new SetResizingPositionYAction().bind();

class SetResizingPositionXAction<
  T extends [number, number, number]
> extends CoreAction<T> {
  code = "SET_RESIZING_POSITION_X";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingPositionX: payload,
    };
  }
}
export const setResizingPositionX = new SetResizingPositionXAction().bind();

class SetOnSaveAction<T extends Feedback> extends CoreAction<T> {
  code = "SET_ON_SAVE";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      onSave: payload,
    };
  }
}
export const setOnSave = new SetOnSaveAction().bind();

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

class InitializeTableAction<T extends Table> extends CoreAction<T> {
  code = "INITIALIZE_TABLE";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      table: payload,
      tableInitialized: true,
    };
  }
}
export const initializeTable = new InitializeTableAction().bind();

class UpdateTableAction<T extends Table> extends CoreAction<T> {
  code = "UPDATE_TABLE";
  reduce(store: StoreType, payload: T): StoreType {
    const { table, history } = store;
    const diffs = [payload];
    //const before = table.backDiffWithTable(diffs);
    return {
      ...store,
      table: payload,
      /*history: histories.pushHistory(history, {
        command: "SET_TABLE",
        before,
        after: diffs,
      }),*/
    };
  }
}
export const updateTable = new UpdateTableAction().bind();

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

class BlurAction<T extends null> extends CoreAction<T> {
  code = "BLUR";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: "",
    };
  }
}
export const blur = new BlurAction().bind();

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

class PasteAction<T extends { text: string }> extends CoreAction<T> {
  code = "PASTE";
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, copyingZone, cutting, table } = store;
    let { selectingZone, history } = store;
    let [y, x] = choosing;
    let selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const { text } = payload;

    const diff: DiffType = {};
    if (copyingArea[0] === -1) {
      const matrixFrom = tsv2matrix(text);
      let [height, width] = matrixShape(matrixFrom, -1);
      if (selectingArea[0] !== -1) {
        [y, x] = selectingArea;
        [height, width] = superposeArea(selectingArea, [0, 0, height, width]);
      }
      selectingArea = [y, x, y + height, x + width];
      const [top, left, bottom, right] = selectingArea;
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          diff[positionToAddress([y, x])] = {
            value: matrixFrom[y - top][x - left],
          };
        }
      }
      table.update(diff, true, {
        selectingZone,
        choosing,
      });
    } else {
      let [height, width] = zoneShape(copyingArea);
      if (selectingArea[0] !== -1) {
        [y, x] = selectingArea;
        [height, width] = superposeArea(selectingArea, copyingArea);
      }
      selectingArea = [y, x, y + height, x + width];
      if (cutting) {
        const src = copyingArea;
        const [h, w] = zoneShape(copyingArea);
        const dst: AreaType =
          selectingArea[0] !== -1
            ? [
                selectingArea[Area.Top],
                selectingArea[Area.Left],
                selectingArea[Area.Top] + h,
                selectingArea[Area.Left] + w,
              ]
            : [
                choosing[Area.Top],
                choosing[Area.Left],
                choosing[Area.Top] + h,
                choosing[Area.Left] + w,
              ];
        table.move(src, dst);
        return {
          ...store,
          table: table.shallowCopy(),
          selectingZone: selectingArea,
          copyingZone: [-1, -1, -1, -1] as ZoneType,
        };
      }
      {
        const [maxHeight, maxWidth] = zoneShape(copyingArea, 1);
        const [topTo, leftTo, bottomTo, rightTo] = selectingArea;
        const [topFrom, leftFrom, bottomFrom, rightFrom] = copyingArea;
        for (let i = 0; i <= bottomTo - topTo; i++) {
          const y = topTo + i;
          if (y > table.numRows()) {
            continue;
          }
          for (let j = 0; j <= rightTo - leftTo; j++) {
            const x = leftTo + j;
            if (x > table.numCols()) {
              continue;
            }
            const cell = table.getByPosition([
              topFrom + (i % maxHeight),
              leftFrom + (j % maxWidth),
            ]);
            diff[positionToAddress([y, x])] = cell || {};
          }
        }
      }
      table.update(diff, false, {
        copyingZone,
        selectingZone,
        choosing,
        cutting,
      });
    }

    return {
      ...store,
      table: table.shallowCopy(),
      selectingZone: selectingArea,
      copyingZone: [-1, -1, -1, -1] as ZoneType,
    };
  }
}
export const paste = new PasteAction().bind();

class EscapeAction<T extends null> extends CoreAction<T> {
  code = "ESCAPE";
  reduce(store: StoreType, payload: T): StoreType {
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
    const selectingZone = [start, 1, end, numCols] as ZoneType;
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
    const selectingZone = [1, start, numRows, end] as ZoneType;

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

class WriteAction<T extends string> extends CoreAction<T> {
  code = "WRITE";
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, selectingZone, table } = store;
    table.write(choosing, payload, {
      selectingZone,
      choosing,
    });
    return {
      ...store,
      table: table.shallowCopy(),
      copyingZone: [-1, -1, -1, -1] as ZoneType,
    };
  }
}
export const write = new WriteAction().bind();

class ClearAction<T extends null> extends CoreAction<T> {
  code = "CLEAR";
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, selectingZone, history, table } = store;

    let selectingArea = zoneToArea(selectingZone);
    if (selectingArea[0] === -1) {
      selectingArea = [...choosing, ...choosing];
    }
    const [top, left, bottom, right] = selectingArea;
    const diff: DiffType = {};
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        diff[positionToAddress([y, x])] = { value: null };
      }
    }
    table.update(diff, true, {
      selectingZone,
      choosing,
    });
    return {
      ...store,
      table: table.shallowCopy(),
      /*history: pushHistory(history, {
        command: "SET_TABLE",
        before,
        after: [diff],
        choosing,
        selectingZone,
      }),*/
    };
  }
}
export const clear = new ClearAction().bind();

const shouldTracking = (operation: string) => {
  switch (operation) {
    case "ADD_ROW":
      return true;
    case "ADD_COL":
      return true;
    case "REMOVE_ROW":
      return true;
    case "REMOVE_COL":
      return true;
    case "MOVE":
      return true;
  }
  return false;
};

class UndoAction<T extends null> extends CoreAction<T> {
  code = "UNDO";
  reduce(store: StoreType, payload: T): StoreType {
    const { table } = store;
    const history = table.undo();
    if (history == null) {
      return store;
    }
    const { feedback, operation } = history;
    return {
      ...store,
      ...feedback,
      table: table.shallowCopy(shouldTracking(operation)),
    };
  }
}
export const undo = new UndoAction().bind();

class RedoAction<T extends null> extends CoreAction<T> {
  code = "REDO";
  reduce(store: StoreType, payload: T): StoreType {
    const { table } = store;
    const history = table.redo();
    if (history == null) {
      return store;
    }
    const { feedback, operation } = history;
    return {
      ...store,
      ...feedback,
      table: table.shallowCopy(shouldTracking(operation)),
    };
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
    let { choosing, selectingZone, table } = store;
    const [y, x] = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [
        selectingZone[Area.Bottom] === -1 ? y : selectingZone[Area.Bottom],
        selectingZone[Area.Right] === -1 ? x : selectingZone[Area.Right],
      ];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 1 || numRows < nextY || nextX < 1 || numCols < nextX) {
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
    if (nextY < 1 || numRows < nextY || nextX < 1 || numCols < nextX) {
      return store;
    }
    let [editorTop, editorLeft, height, width] = store.editorRect;
    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += table.getByPosition([i, 0])?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getByPosition([i, 0])?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getByPosition([0, i])?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getByPosition([0, i])?.width || DEFAULT_WIDTH;
      }
    }
    const cell = table.getByPosition([nextY, nextX]);
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
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
    let { deltaY, deltaX, numRows, numCols } = payload;
    let { choosing, selectingZone, table } = store;
    let [editorTop, editorLeft, height, width] = store.editorRect;
    const [y, x] = choosing;
    const selectingArea = zoneToArea(selectingZone);
    const [top, left, bottom, right] = selectingArea;
    let [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < top && top !== -1) {
      deltaY = bottom - nextY;
      nextY = bottom;
      if (nextX > left) {
        nextX--;
        deltaX--;
      } else {
        deltaX = right - nextX;
        nextX = right;
      }
    }
    if (nextY > bottom && bottom !== -1) {
      deltaY = top - nextY;
      nextY = top;
      if (nextX < right) {
        nextX++;
        deltaX++;
      } else {
        deltaX = left - nextX;
        nextX = left;
      }
    }
    if (nextX < left && left !== -1) {
      deltaX = right - nextX;
      nextX = right;
      if (nextY > top) {
        nextY--;
        deltaY--;
      } else {
        deltaY = bottom - nextY;
        nextY = bottom;
      }
    }
    if (nextX > right && right !== -1) {
      deltaX = left - nextX;
      nextX = left;
      if (nextY < bottom) {
        nextY++;
        deltaY++;
      } else {
        deltaY = top - nextY;
        nextY = top;
      }
    }
    if (nextY < 1 || numRows < nextY || nextX < 1 || numCols < nextX) {
      return store;
    }
    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += table.getByPosition([i, 0])?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getByPosition([i, 0])?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getByPosition([0, i])?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getByPosition([0, i])?.width || DEFAULT_WIDTH;
      }
    }
    const cell = table.getByPosition([nextY, nextX]);
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
    return {
      ...store,
      choosing: [nextY, nextX] as PositionType,
      editorRect: [editorTop, editorLeft, height, width] as RectType,
    };
  }
}
export const walk = new WalkAction().bind();
