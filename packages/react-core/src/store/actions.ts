import {
  StoreType,
  RectType,
  ZoneType,
  PointType,
  RangeType,
  FeedbackType,
  CellsByAddressType,
  AreaType,
  PositionType,
  ModeType,
  RawCellType,
  OperatorType,
} from '../types';
import { zoneToArea, superposeArea, matrixShape, areaShape, areaToZone, zoneShape, restrictZone } from '../lib/structs';
import { Table } from '../lib/table';

import { p2a, a2p } from '../lib/converters';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../constants';
import { initSearchStatement, restrictPoints } from './helpers';
import { smartScroll } from '../lib/virtualization';
import * as prevention from '../lib/operation';
import { Autofill } from '../lib/autofill';

const resetZone: ZoneType = { startY: -1, startX: -1, endY: -1, endX: -1 };

const actions: { [s: string]: CoreAction<any> } = {};

type StoreWithCallback = StoreType & {
  callback?: (store: StoreType) => void;
};

export const reducer = <T>(store: StoreType, action: { type: number; value: T }): StoreType => {
  const act: CoreAction<T> | undefined = actions[action.type];
  if (act == null) {
    return store;
  }

  const { callback, ...newStore } = act.reduce(store, action.value);
  callback?.(newStore);
  return { ...store, ...newStore };
};

export class CoreAction<T> {
  static head = 1;
  private actionId: number = 1;

  public reduce(store: StoreType, payload: T): StoreWithCallback {
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
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchQuery = payload;
    const { tableReactive: tableRef } = store;
    if (tableRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(tableRef.current, { ...store, searchQuery }),
      searchQuery,
    };
  }
}
export const setSearchQuery = new SetSearchQueryAction().bind();

class SetSearchCaseSensitiveAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchCaseSensitive = payload;
    const { tableReactive: tableRef } = store;
    if (tableRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(tableRef.current, { ...store, searchCaseSensitive }),
      searchCaseSensitive,
    };
  }
}
export const setSearchCaseSensitive = new SetSearchCaseSensitiveAction().bind();

class SetEditingAddressAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      editingAddress: payload,
    };
  }
}
export const setEditingAddress = new SetEditingAddressAction().bind();

class SetAutofillDraggingToAction<T extends PointType | null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      autofillDraggingTo: payload,
    };
  }
}
export const setAutofillDraggingTo = new SetAutofillDraggingToAction().bind();

class SubmitAutofillAction<T extends PointType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const autofill = new Autofill(store, payload);
    const table = autofill.applied;
    const selectingZone = areaToZone(autofill.wholeArea);

    return {
      ...store,
      tableReactive: { current: table },
      ...initSearchStatement(table, store),
      ...restrictPoints(store, table),
      selectingZone,
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
      autofillDraggingTo: null,
    };
  }
}
export const submitAutofill = new SubmitAutofillAction().bind();

class SetContextMenuPositionAction<T extends PositionType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      contextMenuPosition: payload,
    };
  }
}
export const setContextMenuPosition = new SetContextMenuPositionAction().bind();

class SetResizingPositionYAction<T extends [number, number, number]> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      resizingPositionY: payload,
    };
  }
}
export const setResizingPositionY = new SetResizingPositionYAction().bind();

class SetResizingPositionXAction<T extends [number, number, number]> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      resizingPositionX: payload,
    };
  }
}
export const setResizingPositionX = new SetResizingPositionXAction().bind();

class SetEnteringAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      entering: payload,
    };
  }
}
export const setEntering = new SetEnteringAction().bind();

class UpdateTableAction<T extends Table> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      tableReactive: { current: payload },
      ...initSearchStatement(payload, store),
      ...restrictPoints(store, payload),
    };
  }
}
export const updateTable = new UpdateTableAction().bind();

class SetEditorRectAction<T extends RectType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      editorRect: payload,
    };
  }
}
export const setEditorRect = new SetEditorRectAction().bind();

class SetDragging<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      dragging: payload,
    };
  }
}
export const setDragging = new SetDragging().bind();

class BlurAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      editingAddress: '',
    };
  }
}
export const blur = new BlurAction().bind();

class CopyAction<T extends ZoneType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { tableReactive: tableRef } = store;
    const table = tableRef.current;
    if (!table) {
      return store;
    }
    return {
      ...store,
      callback: ({ tableReactive: tableRef }) => {
        table.wire.transmit({
          copyingSheetId: table.sheetId,
          copyingZone: payload,
          cutting: false,
        });
      },
    };
  }
}
export const copy = new CopyAction().bind();

class CutAction<T extends ZoneType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { tableReactive: tableRef } = store;
    const table = tableRef.current;
    if (!table) {
      return store;
    }
    return {
      ...store,
      callback: ({ tableReactive: tableRef }) => {
        table.wire.transmit({
          copyingSheetId: table.sheetId,
          copyingZone: payload,
          cutting: true,
        });
      },
    };
  }
}
export const cut = new CutAction().bind();

class PasteAction<T extends { matrix: RawCellType[][]; onlyValue: boolean }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { choosing, selectingZone, tableReactive: dstTableRef } = store;
    const dstTable = dstTableRef.current;
    if (!dstTable) {
      return store;
    }
    const { wire } = dstTable;
    const { copyingSheetId, copyingZone, cutting } = wire;
    const srcTable = dstTable.getTableBySheetId(copyingSheetId);

    let selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const { matrix, onlyValue } = payload;

    if (cutting) {
      if (!srcTable) {
        return store;
      }
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

      const nextSelectingZone = restrictZone(areaToZone(dst));
      const newTable = dstTable.move({
        srcTable,
        src,
        dst,
        operator: 'USER',
        undoReflection: {
          sheetId: srcTable.sheetId,
          selectingZone: nextSelectingZone,
          choosing,
          transmit: { copyingSheetId: srcTable.sheetId, copyingZone, cutting: true },
        },
        redoReflection: {
          sheetId: srcTable.sheetId,
          choosing,
          transmit: { copyingSheetId: srcTable.sheetId, copyingZone: resetZone },
        },
      });

      return {
        ...store,
        ...initSearchStatement(newTable, store),
        tableReactive: { current: newTable },
        selectingZone: nextSelectingZone,
        inputting: newTable.stringify({ point: choosing, refEvaluation: 'RAW' }),
        callback: ({ tableReactive: tableRef }) => {
          wire.transmit({
            cutting: false,
            copyingZone: resetZone,
          });
        },
      };
    }

    let newTable: Table;
    let { y, x } = choosing;

    if (copyingArea.top === -1) {
      const { height, width } = matrixShape({ matrix, base: -1 });
      selectingArea = {
        top: y,
        left: x,
        bottom: y + height,
        right: x + width,
      };
      const nextSelectingZone = restrictZone(areaToZone(selectingArea));
      newTable = dstTable.writeRawCellMatrix({
        point: { y, x },
        matrix,
        onlyValue,
        undoReflection: {
          sheetId: dstTable.sheetId,
          selectingZone: nextSelectingZone,
          choosing,
        },
        redoReflection: {
          sheetId: dstTable.sheetId,
          selectingZone: nextSelectingZone,
          choosing,
        },
      });
    } else {
      if (srcTable == null) {
        return store;
      }
      let { height, width } = areaShape(copyingArea);
      if (selectingArea.top !== -1) {
        y = selectingArea.top;
        x = selectingArea.left;
        const superposed = superposeArea(selectingArea, copyingArea);
        height = superposed.height;
        width = superposed.width;
      }
      selectingArea = { top: y, left: x, bottom: y + height, right: x + width };
      newTable = dstTable.copy({
        srcTable,
        src: copyingArea,
        dst: selectingArea,
        onlyValue,
        operator: 'USER',
        undoReflection: {
          sheetId: srcTable.sheetId,
          transmit: { copyingZone },
          choosing,
          selectingZone,
        },
        redoReflection: {
          sheetId: srcTable.sheetId,
          transmit: { copyingSheetId: srcTable.sheetId, copyingZone: resetZone },
          choosing,
          selectingZone: areaToZone(selectingArea),
        },
      });
    }

    const nextSelectingZone = restrictZone(areaToZone(selectingArea));
    return {
      ...store,
      tableReactive: { current: newTable },
      selectingZone: nextSelectingZone,
      inputting: newTable.stringify({ point: choosing, refEvaluation: 'RAW' }),
      ...initSearchStatement(newTable, store),
      callback: ({ tableReactive: tableRef }) => {
        wire.transmit({
          copyingZone: resetZone,
        });
      },
    };
  }
}
export const paste = new PasteAction().bind();

class EscapeAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { tableReactive: tableRef } = store;
    return {
      ...store,
      editingAddress: '',
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
      callback: ({ tableReactive: tableRef }) => {
        tableRef.current!.wire.transmit({
          copyingZone: resetZone,
          cutting: false,
        });
      },
    };
  }
}
export const escape = new EscapeAction().bind();

class ChooseAction<T extends PointType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      choosing: payload,
      entering: true,
    };
  }
}
export const choose = new ChooseAction().bind();

class SelectAction<T extends ZoneType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      selectingZone: payload,
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
    };
  }
}
export const select = new SelectAction().bind();

class SelectRowsAction<T extends { range: RangeType; numCols: number }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
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
      choosing: { y: start, x: 0 },
      leftHeaderSelecting: true,
      topHeaderSelecting: false,
    };
  }
}
export const selectRows = new SelectRowsAction().bind();

class SelectColsAction<T extends { range: RangeType; numRows: number }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
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
      choosing: { y: 0, x: start },
      leftHeaderSelecting: false,
      topHeaderSelecting: true,
    };
  }
}
export const selectCols = new SelectColsAction().bind();

class DragAction<T extends PointType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { startY, startX } = store.selectingZone;
    const selectingZone = {
      startY,
      startX,
      endY: payload.y,
      endX: payload.x,
    };
    if (startY === payload.y && startX === payload.x) {
      selectingZone.endY = -1;
      selectingZone.endX = -1;
    }
    return { ...store, selectingZone };
  }
}
export const drag = new DragAction().bind();

class SearchAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { matchingCells } = store;
    let { matchingCellIndex, choosing } = store;
    matchingCellIndex += payload;
    if (matchingCellIndex >= matchingCells.length) {
      matchingCellIndex = 0;
    } else if (matchingCellIndex < 0) {
      matchingCellIndex = matchingCells.length - 1;
    }

    if (matchingCells.length > 0) {
      const address = matchingCells[matchingCellIndex];
      choosing = a2p(address);
    }
    return { ...store, matchingCells, matchingCellIndex, choosing };
  }
}
export const search = new SearchAction().bind();

class WriteAction<T extends { value: string; point?: PointType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    let { value, point } = payload;
    const { choosing, selectingZone, tableReactive: tableRef } = store;
    if (point == null) {
      point = choosing;
    }
    const table = tableRef.current;
    if (!table) {
      return store;
    }
    const newTable = table.write({
      point: point,
      value,
      operator: 'USER',
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing: point,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing: point,
      },
    });
    return {
      ...store,
      ...initSearchStatement(newTable, store),
      tableReactive: { current: newTable },
      callback: ({ tableReactive: tableRef }) => {
        table.wire.transmit({
          copyingZone: resetZone,
        });
      },
    };
  }
}
export const write = new WriteAction().bind();

class ClearAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { choosing, selectingZone, tableReactive: tableRef } = store;
    const table = tableRef.current;
    if (!table) {
      return store;
    }

    let selectingArea = zoneToArea(selectingZone);
    if (selectingArea.top === -1) {
      const { y, x } = choosing;
      selectingArea = { top: y, left: x, bottom: y, right: x };
    }
    const { top, left, bottom, right } = selectingArea;
    const diff: CellsByAddressType = {};
    let diffCount = 0;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = table.getCellByPoint({ y, x }, 'SYSTEM');
        const address = p2a({ y, x });
        if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
          continue;
        }
        if (cell?.value != null) {
          diff[address] = { value: null };
          diffCount++;
        }
      }
    }
    if (diffCount === 0) {
      return store;
    }
    table.update({
      diff,
      partial: true,
      operator: 'USER',
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      ...initSearchStatement(table, store),
      tableReactive: { current: table },
    };
  }
}
export const clear = new ClearAction().bind();

class UndoAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { tableReactive: tableRef } = store;
    const table = tableRef.current;
    if (!table) {
      return store;
    }
    const { history, callback } = table.undo();
    if (history == null) {
      return store;
    }
    if (history.dstSheetId !== table.sheetId) {
      const { dispatch, store: dstStore } = table.wire.contextsBySheetId[history.dstSheetId];
      dispatch(setStore({ ...dstStore, ...history.undoReflection }));
      return store;
    }
    return {
      ...store,
      ...restrictPoints(store, table),
      ...history.undoReflection,
      ...initSearchStatement(table, store),
      tableReactive: { current: table },
      callback,
    };
  }
}
export const undo = new UndoAction().bind();

class RedoAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { tableReactive: tableRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }
    const { history, newTable, callback } = table.redo();
    if (history == null) {
      return store;
    }
    if (history.dstSheetId !== table.sheetId) {
      const { dispatch, store: dstStore } = table.wire.contextsBySheetId[history.dstSheetId];
      dispatch(setStore({ ...dstStore, ...history.redoReflection }));
      return store;
    }
    return {
      ...store,
      ...restrictPoints(store, table),
      ...history.redoReflection,
      ...initSearchStatement(table, store),
      tableReactive: { current: table },
      callback,
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
  },
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = payload;
    const { choosing, tableReactive: tableRef, tabularRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }
    let { selectingZone } = store;
    const { y, x } = choosing;
    if (shiftKey) {
      const [dragEndY, dragEndX] = [
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
        editorTop += table.getCellByPoint({ y: i, x: 0 }, 'SYSTEM')?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getCellByPoint({ y: i, x: 0 }, 'SYSTEM')?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getCellByPoint({ y: 0, x: i }, 'SYSTEM')?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getCellByPoint({ y: 0, x: i }, 'SYSTEM')?.width || DEFAULT_WIDTH;
      }
    }

    const cell = table.getCellByPoint({ y: nextY, x: nextX }, 'SYSTEM');
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;

    smartScroll(table, tabularRef.current, { y: nextY, x: nextX });
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
  },
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, numCols } = payload;
    let { deltaY, deltaX } = payload;
    const { choosing, selectingZone, tableReactive: tableRef, tabularRef: gridOuterRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }

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
        editorTop += table.getCellByPoint({ y: i, x: 0 }, 'SYSTEM')?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= table.getCellByPoint({ y: i, x: 0 }, 'SYSTEM')?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += table.getCellByPoint({ y: 0, x: i }, 'SYSTEM')?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= table.getCellByPoint({ y: 0, x: i }, 'SYSTEM')?.width || DEFAULT_WIDTH;
      }
    }
    const cell = table.getCellByPoint({ y: nextY, x: nextX }, 'SYSTEM');
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
    smartScroll(table, gridOuterRef.current, { y: nextY, x: nextX });
    return {
      ...store,
      choosing: { y: nextY, x: nextX } as PointType,
      editorRect: { y: editorTop, x: editorLeft, height, width },
    };
  }
}
export const walk = new WalkAction().bind();

class SetInputtingAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      inputting: payload,
    };
  }
}

export const setInputting = new SetInputtingAction().bind();

class InsertRowsAboveAction<T extends { numRows: number; y: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }
    table.insertRows({
      y,
      numRows,
      baseY: y,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      tableReactive: { current: table },
    };
  }
}
export const insertRowsAbove = new InsertRowsAboveAction().bind();

class InsertRowsBelowAction<T extends { numRows: number; y: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing, editorRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }
    const nextSelectingZone = {
      ...selectingZone,
      startY: selectingZone.startY + numRows,
      endY: selectingZone.endY + numRows,
    };
    const nextChoosing = { ...choosing, y: choosing.y + numRows };

    table.insertRows({
      y: y + 1,
      numRows,
      baseY: y,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone: nextSelectingZone,
        choosing: nextChoosing,
      },
    });
    return {
      ...store,
      selectingZone: nextSelectingZone,
      choosing: nextChoosing,
      tableReactive: { current: table },
    };
  }
}
export const insertRowsBelow = new InsertRowsBelowAction().bind();

class InsertColsLeftAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing, editorRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }

    table.insertCols({
      x,
      numCols,
      baseX: x,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      tableReactive: { current: table },
    };
  }
}
export const insertColsLeft = new InsertColsLeftAction().bind();

class InsertColsRightAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }
    const nextSelectingZone = {
      ...selectingZone,
      startX: selectingZone.startX + numCols,
      endX: selectingZone.endX + numCols,
    };
    const nextChoosing = { ...choosing, x: choosing.x + numCols };

    selectingZone.startX += numCols;
    selectingZone.endX += numCols;

    table.insertCols({
      x: x + 1,
      numCols,
      baseX: x,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone: nextSelectingZone,
        choosing: nextChoosing,
      },
    });
    return {
      ...store,
      selectingZone: nextSelectingZone,
      choosing: nextChoosing,
      tableReactive: { current: table },
    };
  }
}
export const insertColsRight = new InsertColsRightAction().bind();

class RemoveRowsAction<T extends { numRows: number; y: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing, editorRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }

    table.removeRows({
      y,
      numRows,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
        sheetHeight: store.sheetHeight,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
    });

    return {
      ...store,
      tableReactive: { current: table },
    };
  }
}
export const removeRows = new RemoveRowsAction().bind();

class RemoveColsAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { tableReactive: tableRef, selectingZone, choosing, editorRef } = store;
    const table = tableRef.current;
    if (table == null) {
      return store;
    }

    table.removeCols({
      x,
      numCols,
      operator,
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
        sheetWidth: store.sheetWidth,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone,
        choosing,
      },
    });

    return {
      ...store,
      tableReactive: { current: table },
    };
  }
}
export const removeCols = new RemoveColsAction().bind();

class setStoreAction<T extends Partial<StoreType>> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      ...payload,
    };
  }
}
export const setStore = new setStoreAction().bind();

export const userActions = {
  blur,
  copy,
  cut,
  paste,
  escape,
  choose,
  select,
  selectRows,
  selectCols,
  drag,
  search,
  write,
  clear,
  undo,
  redo,
  arrow,
  walk,
  insertRowsAbove,
  insertRowsBelow,
  insertColsLeft,
  insertColsRight,
  removeRows,
  removeCols,
};
