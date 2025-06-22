import type { ContextMenuProps, RawCellType } from '../types';
import { parseHTML, parseText } from '../lib/paste';
import { copy, cut, paste, redo, undo, updateTable } from './actions';
import { clip } from '../lib/clipboard';
import { areaToZone, zoneShape, zoneToArea } from '../lib/structs';

export const copier = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  dispatch(copy(areaToZone(area)));
  editorRef.current?.focus();
};

export const cutter = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  dispatch(cut(areaToZone(area)));
  editorRef.current?.focus();
};

export const paster = async ({ store, dispatch }: ContextMenuProps, onlyValue = false) => {
  const { editorRef } = store;
  const items = await navigator.clipboard.read();
  let cells: RawCellType[][] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.types.indexOf('text/html') !== -1) {
      const blob = await item.getType('text/html');
      const html = await blob.text();
      if (html) {
        cells = parseHTML(html, onlyValue);
        break;
      }
    } else if (item.types.indexOf('text/plain') !== -1) {
      const blob = await item.getType('text/plain');
      const text = await blob.text();
      if (text) {
        cells = parseText(text);
        break;
      }
    }
  }
  dispatch(paste({ matrix: cells, onlyValue }));
  editorRef.current?.focus();
};

export const undoer = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  dispatch(undo(null));
  editorRef.current?.focus();
};

export const redoer = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  dispatch(redo(null));
  editorRef.current?.focus();
};

export const rowsInserterAbove = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;

  const newTable = table.insertRows({
    y: top,
    numRows,
    baseY: top,
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
  dispatch(updateTable(newTable));
  editorRef.current?.focus();
};

export const rowsInserterBelow = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { bottom } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;
  selectingZone.startY += numRows;
  selectingZone.endY += numRows;

  const newTable = table.insertRows({
    y: bottom + 1,
    numRows,
    baseY: bottom,
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
  dispatch(updateTable(newTable));
  editorRef.current?.focus();
};

export const colsInserterLeft = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;

  const newTable = table.insertCols({
    x: left,
    numCols,
    baseX: left,
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
  dispatch(updateTable(newTable));
  editorRef.current?.focus();
};

export const colsInserterRight = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { right } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;
  selectingZone.startX += numCols;
  selectingZone.endX += numCols;

  const newTable = table.insertCols({
    x: right + 1,
    numCols,
    baseX: right,
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
  dispatch(updateTable(newTable.clone()));
  editorRef.current?.focus();
};

export const rowsRemover = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;

  const newTable = table.removeRows({
    y: top,
    numRows,
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
  dispatch(updateTable(newTable));
  editorRef.current?.focus();
};

export const colsRemover = async ({ store, dispatch }: ContextMenuProps) => {
  const { table, selectingZone, choosing, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;

  const newTable = table.removeCols({
    x: left,
    numCols,
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
  dispatch(updateTable(newTable));
  editorRef.current?.focus();
};
