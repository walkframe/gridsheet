import {
  StoreType,
  RectType,
  ZoneType,
  PointType,
  RangeType,
  FeedbackType,
  DiffType,
  AreaType,
  PositionType,
} from "../types";
import {
  zoneToArea,
  superposeArea,
  matrixShape,
  areaShape,
  areaToZone,
} from "../api/structs";
import { Table } from "../api/table";

import { tsv2matrix, x2c, pointToAddress, y2r } from "../api/converters";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";
import { restrictPoints } from "./utils";

const actions: { [s: string]: CoreAction<any> } = {};

export const reducer = <T>(
  store: StoreType,
  action: { type: number; value: T }
): StoreType => {
  const act: CoreAction<T> | undefined = actions[action.type];
  if (act == null) {
    return store;
  }
  return { ...store, ...act.reduce(store, action.value) };
};

export class CoreAction<T> {
  static head = 1;
  private actionId: number = 1;

  public reduce(store: StoreType, payload: T): StoreType {
    return store;
  }
  public call(payload: T): { type: number; value: T } {
    return {
      type: this.actionId,
      value: payload,
    };
  }
  public bind() {
    this.actionId = CoreAction.head++;
    actions[this.actionId] = this;
    return this.call.bind(this);
  }
}

class SetSearchQueryAction<T extends string | undefined> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const searchQuery = payload;
    const matchingCells: string[] = [];
    if (!searchQuery) {
      return { ...store, searchQuery, matchingCells, matchingCellIndex: 0 };
    }
    const { table } = store;
    for (let x = 1; x <= table.right; x++) {
      for (let y = 1; y <= table.bottom; y++) {
        const s = table.stringify({ y, x }, undefined, true);
        if (s.indexOf(searchQuery as string) !== -1) {
          matchingCells.push(`${x2c(x)}${y2r(y)}`);
        }
      }
    }
    return { ...store, searchQuery, matchingCells, matchingCellIndex: 0 };
  }
}
export const setSearchQuery = new SetSearchQueryAction().bind();

class SetEditingCellAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: payload,
    };
  }
}
export const setEditingCell = new SetEditingCellAction().bind();

class SetEditingOnEnterAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingOnEnter: payload,
    };
  }
}
export const setEditingOnEnter = new SetEditingOnEnterAction().bind();

class SetCellLabelAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      cellLabel: payload,
    };
  }
}
export const setCellLabel = new SetCellLabelAction().bind();

class SetContextMenuPositionAction<
  T extends PositionType
> extends CoreAction<T> {
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
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingPositionX: payload,
    };
  }
}
export const setResizingPositionX = new SetResizingPositionXAction().bind();

class SetOnSaveAction<T extends FeedbackType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      onSave: payload,
    };
  }
}
export const setOnSave = new SetOnSaveAction().bind();

class SetEnteringAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      entering: payload,
    };
  }
}
export const setEntering = new SetEnteringAction().bind();

class SetHeaderHeightAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerHeight: payload,
    };
  }
}
export const setHeaderHeight = new SetHeaderHeightAction().bind();

class SetHeaderWidthAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerWidth: payload,
    };
  }
}
export const setHeaderWidth = new SetHeaderWidthAction().bind();

class SetSheetHeightAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetHeight: payload,
    };
  }
}
export const setSheetHeight = new SetSheetHeightAction().bind();

class SetSheetWidthAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetWidth: payload,
    };
  }
}
export const setSheetWidth = new SetSheetWidthAction().bind();

class InitializeTableAction<T extends Table> extends CoreAction<T> {
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
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      table: payload,
      ...restrictPoints(store, payload),
    };
  }
}
export const updateTable = new UpdateTableAction().bind();

class SetEditorRectAction<T extends RectType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editorRect: payload,
    };
  }
}
export const setEditorRect = new SetEditorRectAction().bind();

class SetResizingRectAction<T extends RectType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingRect: payload,
    };
  }
}
export const setResizingRect = new SetResizingRectAction().bind();

class BlurAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: "",
    };
  }
}
export const blur = new BlurAction().bind();

class CopyAction<T extends ZoneType> extends CoreAction<T> {
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
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, copyingZone, selectingZone, cutting, table } = store;
    let selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);

    if (cutting) {
      const src = copyingArea;
      const { height: h, width: w } = areaShape(copyingArea);
      const dst: AreaType =
        selectingArea.top !== -1
          ? {
              top: selectingArea.top,
              left: selectingArea.left,
              bottom: selectingArea.top + h,
              right: selectingArea.left + w,
            }
          : {
              top: choosing.y,
              left: choosing.x,
              bottom: choosing.y + h,
              right: choosing.x + w,
            };
      const newTable = table.move({
        src,
        dst,
        reflection: {
          selectingZone: areaToZone(dst),
          copyingZone,
          cutting,
        },
      });
      return {
        ...store,
        cutting: false,
        table: newTable,
        selectingZone: areaToZone(dst),
        copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      };
    }

    let newTable: Table;
    let { y, x } = choosing;
    const { text } = payload;
    if (copyingArea.top === -1) {
      const matrixFrom = tsv2matrix(text);
      let { height, width } = matrixShape(matrixFrom, -1);
      selectingArea = {
        top: y,
        left: x,
        bottom: y + height,
        right: x + width,
      };
      newTable = table.writeMatrix({
        point: { y, x },
        matrix: matrixFrom,
        reflection: {
          selectingZone: areaToZone(selectingArea),
        },
      });
    } else {
      let { height, width } = areaShape(copyingArea);
      if (selectingArea.top !== -1) {
        y = selectingArea.top;
        x = selectingArea.left;
        const superposed = superposeArea(selectingArea, copyingArea);
        height = superposed.height;
        width = superposed.width;
      }
      selectingArea = { top: y, left: x, bottom: y + height, right: x + width };
      newTable = table.copy({
        src: copyingArea,
        dst: selectingArea,
        reflection: {
          copyingZone,
          selectingZone,
        },
      });
    }
    return {
      ...store,
      table: newTable,
      selectingZone: areaToZone(selectingArea),
      copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    };
  }
}
export const paste = new PasteAction().bind();

class EscapeAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      cutting: false,
      editingCell: "",
      horizontalHeadersSelecting: false,
      verticalHeadersSelecting: false,
    };
  }
}
export const escape = new EscapeAction().bind();

class ChooseAction<T extends PointType> extends CoreAction<T> {
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
  reduce(store: StoreType, payload: T): StoreType {
    const { range, numCols } = payload;
    const { start, end } = range;
    const selectingZone = {
      startY: start,
      startX: 1,
      endY: end,
      endX: numCols,
    };
    return {
      ...store,
      selectingZone,
      choosing: { y: start, x: 0 } as PointType,
      verticalHeadersSelecting: true,
      horizontalHeadersSelecting: false,
    };
  }
}
export const selectRows = new SelectRowsAction().bind();

class SelectColsAction<
  T extends { range: RangeType; numRows: number }
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { range, numRows } = payload;
    const { start, end } = range;
    const selectingZone = {
      startY: 1,
      startX: start,
      endY: numRows,
      endX: end,
    };

    return {
      ...store,
      selectingZone,
      choosing: { y: 0, x: start } as PointType,
      verticalHeadersSelecting: false,
      horizontalHeadersSelecting: true,
    };
  }
}
export const selectCols = new SelectColsAction().bind();

class DragAction<T extends PointType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { y, x } = store.choosing;
    const selectingZone = {
      startY: y,
      startX: x,
      endY: payload.y,
      endX: payload.x,
    };
    return { ...store, selectingZone };
  }
}
export const drag = new DragAction().bind();

class SearchAction<T extends number> extends CoreAction<T> {
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
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, selectingZone, table } = store;
    const newTable = table.write({
      point: choosing,
      value: payload,
      reflection: {
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      table: newTable,
      copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    };
  }
}
export const write = new WriteAction().bind();

class ClearAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, selectingZone, table } = store;

    let selectingArea = zoneToArea(selectingZone);
    if (selectingArea.top === -1) {
      const { y, x } = choosing;
      selectingArea = { top: y, left: x, bottom: y, right: x };
    }
    const { top, left, bottom, right } = selectingArea;
    const diff: DiffType = {};
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        diff[pointToAddress({ y, x })] = { value: null };
      }
    }
    const newTable = table.update({
      diff,
      partial: true,
      reflection: {
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,

      table: newTable,
    };
  }
}
export const clear = new ClearAction().bind();

class UndoAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { table } = store;
    const { history, newTable } = table.undo();
    if (history == null) {
      return store;
    }
    const { reflection, operation } = history;
    return {
      ...store,
      ...restrictPoints(store, table),
      ...reflection,
      table: newTable,
    };
  }
}
export const undo = new UndoAction().bind();

class RedoAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { table } = store;
    const { history, newTable } = table.redo();
    if (history == null) {
      return store;
    }
    const { reflection, operation } = history;
    return {
      ...store,
      ...reflection,
      ...restrictPoints(store, table),
      table: newTable,
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
  reduce(store: StoreType, payload: T): StoreType {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = payload;
    let { choosing, selectingZone, table, gridRef } = store;
    const { y, x } = choosing;
    if (shiftKey) {
      let [dragEndY, dragEndX] = [
        selectingZone.endY === -1 ? y : selectingZone.endY,
        selectingZone.endX === -1 ? x : selectingZone.endX,
      ];
      const [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
      if (nextY < 1 || numRows < nextY || nextX < 1 || numCols < nextX) {
        return store;
      }
      selectingZone =
        y === nextY && x === nextX
          ? { startY: -1, startX: -1, endY: -1, endX: -1 }
          : { startY: y, startX: x, endY: nextY, endX: nextX };
      return {
        ...store,
        selectingZone,
      };
    }
    const [nextY, nextX] = [y + deltaY, x + deltaX];
    if (nextY < 1 || numRows < nextY || nextX < 1 || numCols < nextX) {
      return store;
    }
    let { y: editorTop, x: editorLeft, height, width } = store.editorRect;
    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += table.getByPoint({ y: i, x: 0 })?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getByPoint({ y: i, x: 0 })?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getByPoint({ y: 0, x: i })?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getByPoint({ y: 0, x: i })?.width || DEFAULT_WIDTH;
      }
    }

    const cell = table.getByPoint({ y: nextY, x: nextX });
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
    gridRef.current?.scrollToItem({
      rowIndex: nextY - 1,
      columnIndex: nextX - 1,
      align: "auto",
    });
    return {
      ...store,
      selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      choosing: { y: nextY, x: nextX } as PointType,
      editorRect: { y: editorTop, x: editorLeft, height, width },
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
  reduce(store: StoreType, payload: T): StoreType {
    let { deltaY, deltaX, numRows, numCols } = payload;
    let { choosing, selectingZone, table, gridRef } = store;
    let { y: editorTop, x: editorLeft, height, width } = store.editorRect;
    const { y, x } = choosing;
    const selectingArea = zoneToArea(selectingZone);
    const { top, left, bottom, right } = selectingArea;
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
        editorTop += table.getByPoint({ y: i, x: 0 })?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getByPoint({ y: i, x: 0 })?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getByPoint({ y: 0, x: i })?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getByPoint({ y: 0, x: i })?.width || DEFAULT_WIDTH;
      }
    }
    const cell = table.getByPoint({ y: nextY, x: nextX });
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
    gridRef.current?.scrollToItem({
      rowIndex: nextY - 1,
      columnIndex: nextX - 1,
      align: "auto",
    });
    return {
      ...store,
      choosing: { y: nextY, x: nextX } as PointType,
      editorRect: { y: editorTop, x: editorLeft, height, width },
    };
  }
}
export const walk = new WalkAction().bind();
