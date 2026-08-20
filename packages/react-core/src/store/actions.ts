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
  FilterConfig,
  PendingAsyncOp,
} from '../types';
import { zoneToArea, superposeArea, matrixShape, areaShape, areaDiff, areaToZone, restrictZone } from '@gridsheet/web';
import { Sheet } from '@gridsheet/web';

import { p2a, a2p } from '@gridsheet/web';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@gridsheet/web';
import { initSearchStatement, restrictPoints, flashSheet, flashWithCallback, compactReflection } from './helpers';
import { smartScroll } from '@gridsheet/web';
import { focus } from '@gridsheet/web';
import { operations as prevention } from '@gridsheet/web';
import { Autofill } from '@gridsheet/web';

const resetZone: ZoneType = { startY: -1, startX: -1, endY: -1, endX: -1 };

// Yield between async-mutation chunks. Using rAF for every chunk throttled the whole
// op to 60fps (each chunk waited a full frame). Instead yield via a MessageChannel
// macrotask (near-zero overhead, so throughput isn't frame-capped) and only force a
// real paint via rAF every ~80ms so the progress bar still advances smoothly.
const rafYield = (() => {
  let ch: MessageChannel | null = null;
  let waiting: (() => void) | null = null;
  let lastPaint = 0;
  return (): Promise<void> =>
    new Promise<void>((resolve) => {
      const now = Date.now();
      if (now - lastPaint >= 80) {
        lastPaint = now;
        requestAnimationFrame(() => resolve());
        return;
      }
      if (ch == null) {
        ch = new MessageChannel();
        ch.port1.onmessage = () => {
          const w = waiting;
          waiting = null;
          w?.();
        };
      }
      waiting = resolve;
      ch.port2.postMessage(null);
    });
})();

// Above this many target cells, fill/paste run as a chunked async op with a progress
// bar instead of a blocking write.
const ASYNC_MUTATION_THRESHOLD = 20000;

// Build a pending async op that undoes/redoes a large same-sheet UPDATE (paste/fill)
// in chunks with a progress bar, restoring the selection/cursor from the reflection.
const makeUndoRedoOp = (sheet: Sheet, history: any, store: StoreType, isRedo: boolean): PendingAsyncOp => {
  const reflection = isRedo ? history.redoReflection : history.undoReflection;
  return {
    run: async (onProgress) => {
      const opts = {
        onProgress: (p: { done: number; total: number }) => onProgress(p.total > 0 ? p.done / p.total : 1),
        yieldControl: rafYield,
      };
      if (isRedo) {
        await sheet.redoAsync(opts);
      } else {
        await sheet.undoAsync(opts);
      }
      return sheet.__raw__;
    },
    selectingZone: reflection?.selectingZone ?? store.selectingZone,
    label: isRedo ? 'Redoing' : 'Undoing',
    finalize: reflection?.choosing ? { choosing: reflection.choosing } : {},
    postCommit: () => {
      sheet.registry.transmit(reflection?.transmit);
      flashSheet(store.flashRef.current);
    },
  };
};

const actions: { [s: string]: CoreAction<any> } = {};

type StoreWithCallback = StoreType & {
  callback?: (store: StoreType) => void;
};

export const reducer = <T>(store: StoreType, action: { type: number; value: T }): StoreType => {
  const act: CoreAction<T> | undefined = actions[action.type];
  if (act == null) {
    return store;
  }

  // React StrictMode calls reducers twice per dispatch to detect side effects.
  // Since Sheet is a mutable object, the second call re-applies operations (double undo, etc.).
  // Guard: React passes the SAME action object reference to both calls, so we use object identity
  // to distinguish a StrictMode second-call (same reference) from a new dispatch (new reference).
  // Using a Map allows multiple batched dispatches to each have their own cached result,
  // preventing the single-slot cache from being overwritten when actions are processed together.
  const registry = store.sheetReactive.current?.registry;
  if (registry?._strictModeCache?.has(action)) {
    const cached = registry._strictModeCache.get(action) as StoreType;
    registry._strictModeCache.delete(action);
    return cached;
  }

  const { callback, ...newStore } = act.reduce(store, action.value);
  callback?.(newStore);
  const result = { ...store, ...newStore };

  if (registry) {
    if (!registry._strictModeCache) {
      registry._strictModeCache = new Map();
    }
    registry._strictModeCache.set(action, result);
    queueMicrotask(() => {
      registry._strictModeCache?.delete(action);
    });
  }

  return result;
};

export class CoreAction<T> {
  static head = 1;
  private actionId: number = 1;
  /** Whether this action mutates sheet data (triggers loading indicator). */
  public mutation = false;
  /** Whether this action kicks off a chunked async mutation (fill/paste): its reduce
   *  sets `pendingAsyncOp` and GridSheet runs it with a progress bar. Locked while one runs. */
  public asyncMutation = false;

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

/** Returns true if the given action type is a mutation (heavy operation). */
export const isMutationAction = (type: number): boolean => {
  return actions[type]?.mutation === true;
};

/** Returns true if the action starts a chunked async mutation (fill/paste). */
export const isAsyncMutationAction = (type: number): boolean => {
  return actions[type]?.asyncMutation === true;
};

class SetSearchQueryAction<T extends string | undefined> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchQuery = payload;
    const { sheetReactive: sheetRef } = store;
    if (sheetRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(sheetRef.current, { ...store, searchQuery }),
      searchQuery,
    };
  }
}
export const setSearchQuery = new SetSearchQueryAction().bind();

class SetSearchCaseSensitiveAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchCaseSensitive = payload;
    const { sheetReactive: sheetRef } = store;
    if (sheetRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(sheetRef.current, { ...store, searchCaseSensitive }),
      searchCaseSensitive,
    };
  }
}
export const setSearchCaseSensitive = new SetSearchCaseSensitiveAction().bind();

class SetSearchRegexAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchRegex = payload;
    const { sheetReactive: sheetRef } = store;
    if (sheetRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(sheetRef.current, { ...store, searchRegex }),
      searchRegex,
    };
  }
}
export const setSearchRegex = new SetSearchRegexAction().bind();

class SetSearchRangeAction<T extends ZoneType | undefined> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const searchRange = payload;
    const { sheetReactive: sheetRef } = store;
    if (sheetRef.current == null) {
      return store;
    }
    return {
      ...store,
      ...initSearchStatement(sheetRef.current, { ...store, searchRange }),
      searchRange,
    };
  }
}
export const setSearchRange = new SetSearchRangeAction().bind();

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
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    try {
      const autofill = new Autofill(store, payload);
      const sheet = autofill.applied;
      const selectingZone = areaToZone(autofill.wholeArea);

      const result = {
        ...store,
        sheetReactive: { current: sheet },
        ...initSearchStatement(sheet, store),
        ...restrictPoints(store, sheet),
        selectingZone,
        leftHeaderSelecting: false,
        topHeaderSelecting: false,
        autofillDraggingTo: null,
      };
      // A drag-fill starts on the fill handle (mousedown there, not on a cell), so the editor
      // was blurred and nothing refocuses it — leaving the grid unresponsive to the keyboard
      // right after a fill. Restore focus after the re-render.
      return {
        ...result,
        callback: (next: StoreType) => requestAnimationFrame(() => focus(next.editorRef.current)),
      };
    } catch (e) {
      // The fill may fail (e.g. a target beyond the sheet). Never leave
      // autofillDraggingTo set — a stuck value blocks all future clicks
      // (handleDragStart early-returns while it is set).
      // eslint-disable-next-line no-console
      console.error('[gridsheet] autofill failed:', e);
      return { ...store, autofillDraggingTo: null };
    }
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

class UpdateSheetAction<T extends Sheet> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      sheetReactive: { current: payload },
      ...initSearchStatement(payload, store),
      ...restrictPoints(store, payload),
    };
  }
}
export const updateSheet = new UpdateSheetAction().bind();

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
    const { sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (!sheet) {
      return store;
    }
    return {
      ...store,
      callback: ({ sheetReactive: sheetRef }) => {
        sheet.registry.transmit({
          copyingSheetId: sheet.id,
          copyingZone: payload,
          cutting: false,
        });
      },
    };
  }
}
export const copy = new CopyAction().bind();

class CutAction<T extends ZoneType> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (!sheet) {
      return store;
    }
    return {
      ...store,
      callback: ({ sheetReactive: sheetRef }) => {
        sheet.registry.transmit({
          copyingSheetId: sheet.id,
          copyingZone: payload,
          cutting: true,
        });
      },
    };
  }
}
export const cut = new CutAction().bind();

class PasteAction<T extends { matrix: RawCellType[][]; onlyValue: boolean }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { choosing, selectingZone, sheetReactive: dstSheetRef } = store;
    const dstSheet = dstSheetRef.current;
    if (!dstSheet) {
      return store;
    }
    const { registry } = dstSheet;
    const { copyingSheetId, copyingZone, cutting } = registry;
    const srcSheet = dstSheet.getSheetBySheetId(copyingSheetId);

    let selectingArea = zoneToArea(selectingZone);
    const copyingArea = zoneToArea(copyingZone);
    const { matrix, onlyValue } = payload;

    if (cutting) {
      if (!srcSheet) {
        return store;
      }
      const src = copyingArea;
      const { rows: dy, cols: dx } = areaDiff(copyingArea);
      const dst: AreaType =
        selectingArea.top !== -1
          ? {
              top: selectingArea.top,
              left: selectingArea.left,
              bottom: selectingArea.top + dy,
              right: selectingArea.left + dx,
            }
          : {
              top: choosing.y,
              left: choosing.x,
              bottom: choosing.y + dy,
              right: choosing.x + dx,
            };

      const nextSelectingZone = restrictZone(areaToZone(dst));
      const newSheet = dstSheet.move({
        srcSheet,
        src,
        dst,
        operator: 'USER',
        undoReflection: compactReflection({
          sheetId: srcSheet.id,
          selectingZone: nextSelectingZone,
          choosing,
          transmit: { copyingSheetId: srcSheet.id, copyingZone, cutting: true },
        }),
        redoReflection: compactReflection({
          sheetId: srcSheet.id,
          choosing,
          transmit: { copyingSheetId: srcSheet.id, copyingZone: resetZone },
        }),
      });

      return {
        ...store,
        ...initSearchStatement(newSheet, store),
        sheetReactive: { current: newSheet },
        selectingZone: nextSelectingZone,
        inputting: newSheet.getSerializedValue({ point: choosing, resolution: 'RAW' }),
        callback: ({ sheetReactive: sheetRef }) => {
          registry.transmit({
            cutting: false,
            copyingZone: resetZone,
          });
        },
      };
    }

    let newSheet: Sheet;
    let { y, x } = choosing;

    if (copyingArea.top === -1) {
      const { rows: height, cols: width } = matrixShape({ matrix, base: -1 });
      selectingArea = {
        top: y,
        left: x,
        bottom: y + height,
        right: x + width,
      };
      const nextSelectingZone = restrictZone(areaToZone(selectingArea));
      newSheet = dstSheet.writeRawCellMatrix({
        point: { y, x },
        matrix,
        onlyValue,
        undoReflection: compactReflection({
          sheetId: dstSheet.id,
          selectingZone: nextSelectingZone,
          choosing,
        }),
        redoReflection: compactReflection({
          sheetId: dstSheet.id,
          selectingZone: nextSelectingZone,
          choosing,
        }),
      });
    } else {
      if (srcSheet == null) {
        return store;
      }
      let { rows: dy, cols: dx } = areaDiff(copyingArea);
      if (selectingArea.top !== -1) {
        y = selectingArea.top;
        x = selectingArea.left;
        const superposed = superposeArea(selectingArea, copyingArea);
        dy = superposed.rows;
        dx = superposed.cols;
      }
      selectingArea = { top: y, left: x, bottom: y + dy, right: x + dx };
      const copyProps = {
        srcSheet,
        src: copyingArea,
        dst: selectingArea,
        onlyValue,
        operator: 'USER' as OperatorType,
        undoReflection: compactReflection({
          sheetId: srcSheet.id,
          transmit: { copyingZone },
          choosing,
          selectingZone,
        }),
        redoReflection: compactReflection({
          sheetId: srcSheet.id,
          transmit: { copyingSheetId: srcSheet.id, copyingZone: resetZone },
          choosing,
          selectingZone: areaToZone(selectingArea),
        }),
      };
      // A large paste writes millions of cells — run it as a chunked async op with a
      // progress bar (paste doesn't change the sheet's dimensions, so the target
      // selection is known up front). Small pastes stay synchronous.
      if ((dy + 1) * (dx + 1) > ASYNC_MUTATION_THRESHOLD) {
        const nextSelectingZone = restrictZone(areaToZone(selectingArea));
        nextSelectingZone.endX = Math.min(nextSelectingZone.endX, dstSheet.numCols);
        nextSelectingZone.endY = Math.min(nextSelectingZone.endY, dstSheet.numRows);
        return {
          ...store,
          pendingAsyncOp: {
            run: (onProgress) =>
              dstSheet.copyAsync(copyProps, {
                onProgress: (p) => onProgress(p.total > 0 ? p.done / p.total : 1),
                yieldControl: rafYield,
              }),
            selectingZone: nextSelectingZone,
            label: 'Pasting',
            postCommit: () => registry.transmit({ copyingZone: resetZone }),
          },
        };
      }
      newSheet = dstSheet.copy(copyProps);
    }

    const nextSelectingZone = restrictZone(areaToZone(selectingArea));
    nextSelectingZone.endX = Math.min(nextSelectingZone.endX, newSheet.numCols);
    nextSelectingZone.endY = Math.min(nextSelectingZone.endY, newSheet.numRows);
    return {
      ...store,
      sheetReactive: { current: newSheet },
      selectingZone: nextSelectingZone,
      inputting: newSheet.getSerializedValue({ point: choosing, resolution: 'RAW' }),
      ...initSearchStatement(newSheet, store),
      callback: ({ sheetReactive: sheetRef }) => {
        registry.transmit({
          copyingZone: resetZone,
        });
      },
    };
  }
}
export const paste = new PasteAction().bind();

class EscapeAction<T extends null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { sheetReactive: sheetRef } = store;
    return {
      ...store,
      editingAddress: '',
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
      callback: ({ sheetReactive: sheetRef }) => {
        sheetRef.current!.registry.transmit({
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
    const sheet = store.sheetReactive.current;
    const selectingZone = {
      startY: start,
      startX: 1,
      endY: end,
      endX: numCols,
    };
    // Find the first non-filtered row in the selection for choosing
    let choosingY = start;
    if (sheet) {
      for (let y = start; y <= end; y++) {
        if (!sheet.isRowFiltered(y)) {
          choosingY = y;
          break;
        }
      }
    }
    return {
      ...store,
      selectingZone,
      choosing: { y: choosingY, x: 1 },
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
    const sheet = store.sheetReactive.current;
    const selectingZone = {
      startY: 1,
      startX: start,
      endY: numRows,
      endX: end,
    };
    // Find the first non-filtered row (y=1 is always visible for columns, use y=1)
    // For columns there is no column-level filter, so choosing y=1 (first data row visible)
    let choosingY = 1;
    if (sheet) {
      for (let y = 1; y <= numRows; y++) {
        if (!sheet.isRowFiltered(y)) {
          choosingY = y;
          break;
        }
      }
    }
    return {
      ...store,
      selectingZone,
      choosing: { y: choosingY, x: start },
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
    const { choosing, selectingZone, sheetReactive: sheetRef } = store;
    if (point == null) {
      point = choosing;
    }
    const sheet = sheetRef.current;
    if (!sheet) {
      return store;
    }
    const newSheet = sheet.write({
      point: point,
      value,
      operator: 'USER',
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing: point,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing: point,
      }),
    });
    return {
      ...store,
      ...initSearchStatement(newSheet, store),
      sheetReactive: { current: newSheet },
      callback: ({ sheetReactive: sheetRef }) => {
        sheet.registry.transmit({
          copyingZone: resetZone,
        });
      },
    };
  }
}
export const write = new WriteAction().bind();

class ClearAction<T extends null> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { choosing, selectingZone, sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (!sheet) {
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
      if (sheet.isRowFiltered(y)) {
        continue;
      }
      for (let x = left; x <= right; x++) {
        const cell = sheet.getCell({ y, x }, { resolution: 'SYSTEM' });
        const address = p2a({ y, x });
        if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
          continue;
        }
        // Spilled cells are derived from the origin cell's formula and should
        // not be cleared independently — doing so would blank the FormulaBar
        // while the spill re-populates the value on next evaluation.
        if (sheet.getSystem({ y, x })?.spilledFrom != null) {
          continue;
        }
        if (cell?.value != null) {
          diff[address] = { value: undefined };
          diffCount++;
        }
      }
    }
    if (diffCount === 0) {
      return store;
    }
    sheet.update({
      diff,
      partial: true,
      operator: 'USER',
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
    });
    return {
      ...store,
      ...initSearchStatement(sheet, store),
      sheetReactive: { current: sheet },
    };
  }
}
export const clear = new ClearAction().bind();

class UndoAction<T extends null> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (!sheet) {
      return store;
    }
    // Route a large same-sheet paste/fill undo through the chunked async path (progress bar).
    const peeked = sheet.peekUndo();
    if (
      peeked != null &&
      peeked.operation === 'UPDATE' &&
      peeked.dstSheetId === sheet.id &&
      Object.keys(peeked.diffBefore ?? {}).length > ASYNC_MUTATION_THRESHOLD
    ) {
      return { ...store, pendingAsyncOp: makeUndoRedoOp(sheet, peeked, store, false) };
    }
    const { history, callback } = sheet.undo();
    if (history == null) {
      return store;
    }
    if (history.dstSheetId !== sheet.id) {
      const { dispatch, store: dstStore } = sheet.registry.contextsBySheetId[history.dstSheetId];
      dispatch(
        setStore({
          ...dstStore,
          ...history.undoReflection,
          sheetReactive: { current: dstStore.sheetReactive.current },
        }),
      );
      flashSheet(dstStore.flashRef.current);
      // For cross-sheet MOVE: the src (current) sheet's lastChangedAddresses was also updated.
      // Return updated sheetReactive so this sheet's Emitter fires onChange.
      if (history.srcSheetId === sheet.id) {
        return flashWithCallback(store, sheet, callback);
      }
      return store;
    }
    return {
      ...store,
      ...restrictPoints(store, sheet),
      ...history.undoReflection,
      ...initSearchStatement(sheet, store),
      sheetReactive: { current: sheet },
      callback: (s: StoreType) => {
        callback?.(s);
        flashSheet(store.flashRef.current);
      },
    };
  }
}
export const undo = new UndoAction().bind();

class RedoAction<T extends null> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    // Route a large same-sheet paste/fill redo through the chunked async path (progress bar).
    const peeked = sheet.peekRedo();
    if (
      peeked != null &&
      peeked.operation === 'UPDATE' &&
      peeked.dstSheetId === sheet.id &&
      Object.keys(peeked.diffAfter ?? {}).length > ASYNC_MUTATION_THRESHOLD
    ) {
      return { ...store, pendingAsyncOp: makeUndoRedoOp(sheet, peeked, store, true) };
    }
    const { history, newSheet, callback } = sheet.redo();
    if (history == null) {
      return store;
    }
    if (history.dstSheetId !== sheet.id) {
      const { dispatch, store: dstStore } = sheet.registry.contextsBySheetId[history.dstSheetId];
      dispatch(
        setStore({
          ...dstStore,
          ...history.redoReflection,
          sheetReactive: { current: dstStore.sheetReactive.current },
        }),
      );
      flashSheet(dstStore.flashRef.current);
      // For cross-sheet MOVE: the src (current) sheet's lastChangedAddresses was also updated.
      // Return updated sheetReactive so this sheet's Emitter fires onChange.
      if (history.srcSheetId === sheet.id) {
        return flashWithCallback(store, sheet, callback);
      }
      return store;
    }
    return {
      ...store,
      ...restrictPoints(store, sheet),
      ...history.redoReflection,
      ...initSearchStatement(sheet, store),
      sheetReactive: { current: sheet },
      callback: (s: StoreType) => {
        callback?.(s);
        flashSheet(store.flashRef.current);
      },
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
    const { choosing, sheetReactive: sheetRef, tabularRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
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
    // Skip hidden rows
    let resolvedY = nextY;
    if (sheet.isRowFiltered(resolvedY)) {
      const dir = deltaY >= 0 ? 1 : -1;
      while (resolvedY >= 1 && resolvedY <= numRows && sheet.isRowFiltered(resolvedY)) {
        resolvedY += dir;
      }
      if (resolvedY < 1 || resolvedY > numRows) {
        return store; // no visible row in that direction
      }
    }
    let { y: editorTop, x: editorLeft, height, width } = store.editorRect;
    if (deltaY > 0) {
      for (let i = y; i < resolvedY; i++) {
        editorTop += sheet.getCell({ y: i, x: 0 }, { resolution: 'SYSTEM' })?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= resolvedY; i--) {
        editorTop -= sheet.getCell({ y: i, x: 0 }, { resolution: 'SYSTEM' })?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += sheet.getCell({ y: 0, x: i }, { resolution: 'SYSTEM' })?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= sheet.getCell({ y: 0, x: i }, { resolution: 'SYSTEM' })?.width || DEFAULT_WIDTH;
      }
    }

    const cell = sheet.getCell({ y: resolvedY, x: nextX }, { resolution: 'SYSTEM' });
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;

    smartScroll(sheet, tabularRef.current, { y: resolvedY, x: nextX });
    return {
      ...store,
      selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      choosing: { y: resolvedY, x: nextX } as PointType,
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
    const { choosing, selectingZone, sheetReactive: sheetRef, tabularRef: gridOuterRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
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

    // Skip hidden rows
    if (sheet.isRowFiltered(nextY)) {
      const dir = deltaY >= 0 ? 1 : -1;
      const lo = top !== -1 ? top : 1;
      const hi = bottom !== -1 ? bottom : numRows;
      while (nextY >= lo && nextY <= hi && sheet.isRowFiltered(nextY)) {
        nextY += dir;
      }
      if (nextY < lo || nextY > hi || sheet.isRowFiltered(nextY)) {
        return store; // no visible row in range
      }
    }

    if (deltaY > 0) {
      for (let i = y; i < nextY; i++) {
        editorTop += sheet.getCell({ y: i, x: 0 }, { resolution: 'SYSTEM' })?.height || DEFAULT_HEIGHT;
      }
    } else if (deltaY < 0) {
      for (let i = y - 1; i >= nextY; i--) {
        editorTop -= sheet.getCell({ y: i, x: 0 }, { resolution: 'SYSTEM' })?.height || DEFAULT_HEIGHT;
      }
    }
    if (deltaX > 0) {
      for (let i = x; i < nextX; i++) {
        editorLeft += sheet.getCell({ y: 0, x: i }, { resolution: 'SYSTEM' })?.width || DEFAULT_WIDTH;
      }
    } else if (deltaX < 0) {
      for (let i = x - 1; i >= nextX; i--) {
        editorLeft -= sheet.getCell({ y: 0, x: i }, { resolution: 'SYSTEM' })?.width || DEFAULT_WIDTH;
      }
    }
    const cell = sheet.getCell({ y: nextY, x: nextX }, { resolution: 'SYSTEM' });
    height = cell?.height || DEFAULT_HEIGHT;
    width = cell?.width || DEFAULT_WIDTH;
    smartScroll(sheet, gridOuterRef.current, { y: nextY, x: nextX });
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
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    sheet.insertRows({
      y,
      numRows,
      baseY: y,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
    });
    return {
      ...store,
      sheetReactive: { current: sheet },
    };
  }
}
export const insertRowsAbove = new InsertRowsAboveAction().bind();

class InsertRowsBelowAction<T extends { numRows: number; y: number; operator?: OperatorType }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing, editorRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    const nextSelectingZone = {
      ...selectingZone,
      startY: selectingZone.startY + numRows,
      endY: selectingZone.endY + numRows,
    };
    const nextChoosing = { ...choosing, y: choosing.y + numRows };

    sheet.insertRows({
      y: y + 1,
      numRows,
      baseY: y,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone: nextSelectingZone,
        choosing: nextChoosing,
      }),
    });
    return {
      ...store,
      selectingZone: nextSelectingZone,
      choosing: nextChoosing,
      sheetReactive: { current: sheet },
    };
  }
}
export const insertRowsBelow = new InsertRowsBelowAction().bind();

class InsertColsLeftAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing, editorRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }

    sheet.insertCols({
      x,
      numCols,
      baseX: x,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
    });
    return {
      ...store,
      sheetReactive: { current: sheet },
    };
  }
}
export const insertColsLeft = new InsertColsLeftAction().bind();

class InsertColsRightAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
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

    sheet.insertCols({
      x: x + 1,
      numCols,
      baseX: x,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone: nextSelectingZone,
        choosing: nextChoosing,
      }),
    });
    return {
      ...store,
      selectingZone: nextSelectingZone,
      choosing: nextChoosing,
      sheetReactive: { current: sheet },
    };
  }
}
export const insertColsRight = new InsertColsRightAction().bind();

class RemoveRowsAction<T extends { numRows: number; y: number; operator?: OperatorType }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numRows, y, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing, editorRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }

    sheet.removeRows({
      y,
      numRows,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
        sheetHeight: store.sheetHeight,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
    });

    // Move the selection to the adjacent row that shifted into the deleted position
    // (clamped to the last row), skipping filtered rows so it stays visible.
    const numRows2 = sheet.numRows;
    const numCols2 = sheet.numCols;
    let adjY = Math.max(1, Math.min(y, numRows2));
    if (sheet.isRowFiltered(adjY)) {
      let found = -1;
      for (let yy = adjY; yy <= numRows2; yy++) {
        if (!sheet.isRowFiltered(yy)) {
          found = yy;
          break;
        }
      }
      if (found === -1) {
        for (let yy = adjY; yy >= 1; yy--) {
          if (!sheet.isRowFiltered(yy)) {
            found = yy;
            break;
          }
        }
      }
      if (found !== -1) {
        adjY = found;
      }
    }

    return {
      ...store,
      sheetReactive: { current: sheet },
      selectingZone: { startY: adjY, startX: 1, endY: adjY, endX: numCols2 },
      choosing: { y: adjY, x: 1 },
      leftHeaderSelecting: true,
      topHeaderSelecting: false,
    };
  }
}
export const removeRows = new RemoveRowsAction().bind();

class RemoveColsAction<T extends { numCols: number; x: number; operator?: OperatorType }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { numCols, x, operator } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing, editorRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }

    sheet.removeCols({
      x,
      numCols,
      operator,
      undoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
        sheetWidth: store.sheetWidth,
      }),
      redoReflection: compactReflection({
        sheetId: sheet.id,
        selectingZone,
        choosing,
      }),
    });

    // Move the selection to the adjacent column that shifted into the deleted position
    // (clamped to the last column). choosing.y lands on the first visible row.
    const numCols2 = sheet.numCols;
    const numRows2 = sheet.numRows;
    const adjX = Math.max(1, Math.min(x, numCols2));
    let choosingY = 1;
    for (let yy = 1; yy <= numRows2; yy++) {
      if (!sheet.isRowFiltered(yy)) {
        choosingY = yy;
        break;
      }
    }

    return {
      ...store,
      sheetReactive: { current: sheet },
      selectingZone: { startY: 1, startX: adjX, endY: numRows2, endX: adjX },
      choosing: { y: choosingY, x: adjX },
      leftHeaderSelecting: false,
      topHeaderSelecting: true,
    };
  }
}
export const removeCols = new RemoveColsAction().bind();

class SortRowsAction<T extends { x: number; direction: 'asc' | 'desc' }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { x, direction } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    sheet.sortRows({ x, direction });
    const reflection = compactReflection({ sheetId: sheet.id, selectingZone, choosing });
    if (sheet.registry.lastHistory) {
      sheet.registry.lastHistory.undoReflection = reflection;
      sheet.registry.lastHistory.redoReflection = reflection;
    }
    return {
      ...store,
      sheetReactive: { current: sheet },
    };
  }
}
export const sortRows = new SortRowsAction().bind();

class FilterRowsAction<T extends { x?: number; filter?: FilterConfig }> extends CoreAction<T> {
  mutation = true;
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { x, filter } = payload;
    const { sheetReactive: sheetRef, selectingZone, choosing } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    sheet.filterRows({ x, filter });
    const reflection = compactReflection({ sheetId: sheet.id, selectingZone, choosing });
    if (sheet.registry.lastHistory) {
      sheet.registry.lastHistory.undoReflection = reflection;
      sheet.registry.lastHistory.redoReflection = reflection;
    }
    let newChoosing = choosing;
    if (sheet.isRowFiltered(choosing.y)) {
      for (let y = 1; y <= sheet.numRows; y++) {
        if (!sheet.isRowFiltered(y)) {
          newChoosing = { y, x: choosing.x };
          break;
        }
      }
    }
    return {
      ...store,
      choosing: newChoosing,
      selectingZone: newChoosing !== choosing ? resetZone : selectingZone,
      sheetReactive: { current: sheet },
      callback: ({ sheetReactive: sheetRef }) => {
        const t = sheetRef.current;
        if (t) {
          t.registry.transmit({
            cutting: false,
            copyingZone: resetZone,
          });
        }
      },
    };
  }
}
export const filterRows = new FilterRowsAction().bind();

class SetColumnMenuAction<
  T extends { x: number; position: { y: number; x: number }; focusLabel?: boolean } | null,
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      columnMenuState: payload,
    };
  }
}
export const setColumnMenu = new SetColumnMenuAction().bind();

class SetRowMenuAction<T extends { y: number; position: { y: number; x: number } } | null> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      rowMenuState: payload,
    };
  }
}
export const setRowMenu = new SetRowMenuAction().bind();

class SetEditorHoveringAction<T extends boolean> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      editorHovering: payload,
    };
  }
}
export const setEditorHovering = new SetEditorHoveringAction().bind();

class setStoreAction<T extends Partial<StoreType>> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    return {
      ...store,
      ...payload,
    };
  }
}
export const setStore = new setStoreAction().bind();

// The data-block edge reached by scanning from (y, x) in direction (dy, dx) — the
// Excel Ctrl+(Shift+)arrow semantics, generalized to all four directions: inside a
// run of filled cells → the run's last filled cell; at a boundary/gap → the next
// filled cell (skipping blanks), else the grid edge.
const dataEdge = (sheet: Sheet, y: number, x: number, dy: number, dx: number): PointType => {
  const numRows = sheet.numRows;
  const numCols = sheet.numCols;
  const inBounds = (yy: number, xx: number) => yy >= 1 && yy <= numRows && xx >= 1 && xx <= numCols;
  const filled = (yy: number, xx: number): boolean => {
    // peekRawValue avoids materializing each scanned cell — a full-column scan
    // through getCell populated (and stalled on) the whole column.
    const v = sheet.peekRawValue({ y: yy, x: xx });
    return v != null && v !== '';
  };
  if (!inBounds(y + dy, x + dx)) {
    return { y, x }; // already at the grid edge in this direction
  }
  if (filled(y, x) && filled(y + dy, x + dx)) {
    // Inside a run: advance to its last filled cell.
    let py = y;
    let px = x;
    while (inBounds(py + dy, px + dx) && filled(py + dy, px + dx)) {
      py += dy;
      px += dx;
    }
    return { y: py, x: px };
  }
  // At a boundary/gap: skip blanks to the next filled cell, else stop at the edge.
  let py = y + dy;
  let px = x + dx;
  while (!filled(py, px) && inBounds(py + dy, px + dx)) {
    py += dy;
    px += dx;
  }
  return { y: py, x: px };
};

// Ctrl+Shift+arrow: extend the selection from the active cell to the data-block
// edge in the pressed direction — the drag-free way to select a large range.
class SelectToDataEdgeAction<T extends { deltaY: number; deltaX: number }> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const { deltaY, deltaX } = payload;
    const { choosing, selectingZone, sheetReactive: sheetRef, tabularRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null) {
      return store;
    }
    const curEndY = selectingZone.endY === -1 ? choosing.y : selectingZone.endY;
    const curEndX = selectingZone.endX === -1 ? choosing.x : selectingZone.endX;
    const { y: endY, x: endX } = dataEdge(sheet, curEndY, curEndX, deltaY, deltaX);
    smartScroll(sheet, tabularRef.current, { y: endY, x: endX });
    return {
      ...store,
      selectingZone: { startY: choosing.y, startX: choosing.x, endY, endX },
    };
  }
}
export const selectToDataEdge = new SelectToDataEdgeAction().bind();

// Ctrl+D: fill the selection's top row down through the rest of the selection.
// Reuses Autofill (src = top row, dragged down to the selection bottom), so
// sequences/formulas behave exactly like a manual drag-fill.
const makeFillOp = (autofill: Autofill, selectingZone: ZoneType, label: string): PendingAsyncOp => ({
  run: (onProgress) =>
    autofill.appliedAsync({
      onProgress: (p) => onProgress(p.total > 0 ? p.done / p.total : 1),
      yieldControl: rafYield,
    }),
  selectingZone,
  label,
});

class FillDownAction<T extends null> extends CoreAction<T> {
  asyncMutation = true;
  reduce(store: StoreType): StoreWithCallback {
    const { selectingZone, sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null || selectingZone.endY === -1) {
      return store;
    }
    const area = zoneToArea(selectingZone);
    if (area.top >= area.bottom) {
      return store; // single row — nothing below to fill
    }
    try {
      const synthetic: StoreType = {
        ...store,
        choosing: { y: area.top, x: area.left },
        selectingZone: { startY: area.top, startX: area.left, endY: area.top, endX: area.right },
      };
      const autofill = new Autofill(synthetic, { y: area.bottom, x: area.right });
      return { ...store, pendingAsyncOp: makeFillOp(autofill, selectingZone, 'Filling') };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[gridsheet] fill down failed:', e);
      return store;
    }
  }
}
export const fillDown = new FillDownAction().bind();

// Ctrl+R: fill the selection's left column right through the rest of the selection.
class FillRightAction<T extends null> extends CoreAction<T> {
  asyncMutation = true;
  reduce(store: StoreType): StoreWithCallback {
    const { selectingZone, sheetReactive: sheetRef } = store;
    const sheet = sheetRef.current;
    if (sheet == null || selectingZone.endX === -1) {
      return store;
    }
    const area = zoneToArea(selectingZone);
    if (area.left >= area.right) {
      return store; // single column — nothing to the right to fill
    }
    try {
      const synthetic: StoreType = {
        ...store,
        choosing: { y: area.top, x: area.left },
        selectingZone: { startY: area.top, startX: area.left, endY: area.bottom, endX: area.left },
      };
      const autofill = new Autofill(synthetic, { y: area.bottom, x: area.right });
      return { ...store, pendingAsyncOp: makeFillOp(autofill, selectingZone, 'Filling') };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[gridsheet] fill right failed:', e);
      return store;
    }
  }
}
export const fillRight = new FillRightAction().bind();

// Finalize the async op: adopt the mutated sheet, restore selection, clear the pending state.
class CommitAsyncOpAction<
  T extends { sheet: Sheet; selectingZone: ZoneType; finalize?: Partial<StoreType> },
> extends CoreAction<T> {
  reduce(store: StoreType, payload: T): StoreWithCallback {
    const next: StoreType = {
      ...store,
      sheetReactive: { current: payload.sheet },
      selectingZone: payload.selectingZone,
      pendingAsyncOp: null,
      ...(payload.finalize ?? {}),
    };
    return {
      ...next,
      ...initSearchStatement(payload.sheet, next),
      ...restrictPoints(next, payload.sheet),
      // The progress overlay (pointer-events blocking) ran over the grid while the chunked
      // fill/paste/undo committed; return focus to the editor so the keyboard works right after.
      callback: (committed: StoreType) => requestAnimationFrame(() => focus(committed.editorRef.current)),
    };
  }
}
export const commitAsyncOp = new CommitAsyncOpAction().bind();

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
  sortRows,
  filterRows,
  selectToDataEdge,
  fillDown,
  fillRight,
};
