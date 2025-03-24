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
  Renderers,
} from '../types';
import { zoneToArea, superposeArea, matrixShape, areaShape, areaToZone } from '../lib/structs';
import { Table } from '../lib/table';

import { tsv2matrix, p2a, a2p } from '../lib/converters';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../constants';
import { initSearchStatement, restrictPoints } from './helpers';
import { smartScroll } from '../lib/virtualization';
import * as prevention from '../lib/prevention';

const actions: { [s: string]: CoreAction<any> } = {};

export const reducer = <T>(store: StoreType, action: { type: number; value: T }): StoreType => {
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
    const { table } = store;
    return {
      ...store,
      ...initSearchStatement(table, { ...store, searchQuery }),
      searchQuery,
    };
  }
}
export const setSearchQuery = new SetSearchQueryAction().bind();

class SetSearchCaseSensitiveAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const searchCaseSensitive = payload;
    const { table } = store;
    return {
      ...store,
      ...initSearchStatement(table, { ...store, searchCaseSensitive }),
      searchCaseSensitive,
    };
  }
}
export const setSearchCaseSensitive = new SetSearchCaseSensitiveAction().bind();

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

class SetAutofillDraggingToAction<T extends PointType | null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      autofillDraggingTo: payload,
    };
  }
}
export const setAutofillDraggingTo = new SetAutofillDraggingToAction().bind();

class SetShowAddressAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      showAddress: payload,
    };
  }
}
export const setShowAddress = new SetShowAddressAction().bind();

class SetContextMenuPositionAction<T extends PositionType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      contextMenuPosition: payload,
    };
  }
}
export const setContextMenuPosition = new SetContextMenuPositionAction().bind();

class SetResizingPositionYAction<T extends [number, number, number]> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingPositionY: payload,
    };
  }
}
export const setResizingPositionY = new SetResizingPositionYAction().bind();

class SetResizingPositionXAction<T extends [number, number, number]> extends CoreAction<T> {
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
      ...initSearchStatement(payload, store),
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
      editingCell: '',
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
        operator: 'USER',
        reflection: {
          selectingZone: areaToZone(dst),
          copyingZone,
          cutting,
        },
      });
      return {
        ...store,
        ...initSearchStatement(newTable, store),
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
      const { height, width } = matrixShape({ matrix: matrixFrom, base: -1 });
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
        operator: 'USER',
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
      ...initSearchStatement(newTable, store),
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
      editingCell: '',
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
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
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
    };
  }
}
export const select = new SelectAction().bind();

class SelectRowsAction<T extends { range: RangeType; numCols: number }> extends CoreAction<T> {
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
      choosing: { y: start, x: 0 },
      leftHeaderSelecting: true,
      topHeaderSelecting: false,
    };
  }
}
export const selectRows = new SelectRowsAction().bind();

class SelectColsAction<T extends { range: RangeType; numRows: number }> extends CoreAction<T> {
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
      choosing: { y: 0, x: start },
      leftHeaderSelecting: false,
      topHeaderSelecting: true,
    };
  }
}
export const selectCols = new SelectColsAction().bind();

class DragAction<T extends PointType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { startY, startX } = store.selectingZone;
    const selectingZone = {
      startY,
      startX,
      endY: payload.y,
      endX: payload.x,
    };
    return { ...store, selectingZone };
  }
}
export const drag = new DragAction().bind();

class SearchAction<T extends number> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
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

class WriteAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { choosing, selectingZone, table } = store;
    const newTable = table.write({
      point: choosing,
      value: payload,
      operator: 'USER',
      reflection: {
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      ...initSearchStatement(newTable, store),
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
    const diff: CellsByAddressType = {};
    let diffCount = 0;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = table.getByPoint({ y, x });
        const address = p2a({ y, x });
        if (prevention.isPrevented(cell?.prevention, prevention.Write)) {
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
    const newTable = table.update({
      diff,
      partial: true,
      operator: 'USER',
      reflection: {
        selectingZone,
        choosing,
      },
    });
    return {
      ...store,
      ...initSearchStatement(newTable, store),
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
    const { reflection } = history;
    return {
      ...store,
      ...restrictPoints(store, table),
      ...reflection,
      ...initSearchStatement(newTable, store),
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
    const { reflection } = history;
    return {
      ...store,
      ...reflection,
      ...restrictPoints(store, table),
      ...initSearchStatement(newTable, store),
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
  },
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    const { shiftKey, deltaY, deltaX, numRows, numCols } = payload;
    const { choosing, table, tabularRef } = store;
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
  reduce(store: StoreType, payload: T): StoreType {
    const { numRows, numCols } = payload;
    let { deltaY, deltaX } = payload;
    const { choosing, selectingZone, table, tabularRef: gridOuterRef } = store;
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
    smartScroll(table, gridOuterRef.current, { y: nextY, x: nextX });
    return {
      ...store,
      choosing: { y: nextY, x: nextX } as PointType,
      editorRect: { y: editorTop, x: editorLeft, height, width },
    };
  }
}
export const walk = new WalkAction().bind();

class SetLastEditedAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      lastEdited: payload,
    };
  }
}
export const setLastEdited = new SetLastEditedAction().bind();

class SetLastFocusedRefAction<T extends React.RefObject<HTMLTextAreaElement>> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      lastFocusedRef: payload,
    };
  }
}

export const setLastFocusedRef = new SetLastFocusedRefAction().bind();

class SetInputtingAction<T extends string> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      inputting: payload,
    };
  }
}

export const setInputting = new SetInputtingAction().bind();

class SetModeAction<T extends ModeType> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      mode: payload,
    };
  }
}
export const setMode = new SetModeAction().bind();
