import {
  StoreType,
  MatrixType,
  RectType,
  CellsOptionType,
  CellOptionType,
  ZoneType,
  AreaType,
  PositionType,
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
  slideFlattened,
  applyFlattened,
  inverseFlattened,
  matrixShape,
} from "../api/arrays";

import * as histories from "../api/histories";

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

class SetEnteringAction<T extends boolean> extends CoreAction<T> {
  code = "SET_ENTERING";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      entering: payload,
    };
  }
}

class SetHeaderHeightAction<T extends number> extends CoreAction<T> {
  code = "SET_HEADER_HEIGHT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerHeight: payload,
    };
  }
}

class SetHeaderWidthAction<T extends number> extends CoreAction<T> {
  code = "SET_HEADER_WIDTH";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      headerWidth: payload,
    };
  }
}

class SetSheetHeightAction<T extends number> extends CoreAction<T> {
  code = "SET_SHEET_HEIGHT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetHeight: payload,
    };
  }
}

class SetSheetWidthAction<T extends number> extends CoreAction<T> {
  code = "SET_SHEET_WIDTH";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      sheetWidth: payload,
    };
  }
}

class SetMatrixAction<T extends MatrixType> extends CoreAction<T> {
  code = "SET_MATRIX";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      matrix: payload,
    };
  }
}

class SetEditorRectAction<T extends RectType> extends CoreAction<T> {
  code = "SET_EDITOR_RECT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editorRect: payload,
    };
  }
}

class SetResizingRectAction<T extends RectType> extends CoreAction<T> {
  code = "SET_RESIZING_RECT";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      resizingRect: payload,
    };
  }
}

class SetCellsOptionAction<T extends CellsOptionType> extends CoreAction<T> {
  code = "SET_CELLS_OPTION";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      cellsOption: payload,
    };
  }
}

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

class BlurAction<T extends any> extends CoreAction<T> {
  code = "BLUR";
  reduce(store: StoreType): StoreType {
    return {
      ...store,
      editingCell: "",
    };
  }
}

class SetEditingAction<T extends string> extends CoreAction<T> {
  code = "SET_EDITING_CELL";
  reduce(store: StoreType, payload: T): StoreType {
    return {
      ...store,
      editingCell: payload,
    };
  }
}

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

class DragAction<T extends PositionType> extends CoreAction<T> {
  code = "DRAG";
  reduce(store: StoreType, payload: T): StoreType {
    const [y, x] = store.choosing;
    const selectingZone = [y, x, payload[0], payload[1]] as ZoneType;
    return { ...store, selectingZone };
  }
}

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

export const search = new SearchAction().bind();
export const setEntering = new SetEnteringAction().bind();

export const drag = new DragAction().bind();
export const write = new WriteAction().bind();
export const clear = new ClearAction().bind();
export const undo = new UndoAction().bind();
export const redo = new RedoAction().bind();
