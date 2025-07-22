import type { ContextMenuProps, RawCellType } from '../types';
import { areaToZone, zoneShape, zoneToArea } from '../lib/structs';
import {
  copy,
  cut,
  paste,
  undo,
  redo,
  insertRowsAbove,
  insertRowsBelow,
  insertColsLeft,
  insertColsRight,
  removeRows,
  removeCols,
} from './actions';
import { clip } from '../lib/clipboard';
import { parseHTML, parseText } from '../lib/paste';

export const copier = async ({ store, sync }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  sync(copy(areaToZone(area)));
  editorRef.current?.focus();
};

export const cutter = async ({ store, sync }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  sync(cut(areaToZone(area)));
  editorRef.current?.focus();
};

export const paster = async ({ store, sync }: ContextMenuProps, onlyValue = false) => {
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
  sync(paste({ matrix: cells, onlyValue }));
  editorRef.current?.focus();
};

export const undoer = async ({ store, sync }: ContextMenuProps) => {
  const { editorRef } = store;
  sync(undo(null));
  editorRef.current?.focus();
};

export const redoer = async ({ store, sync }: ContextMenuProps) => {
  const { editorRef } = store;
  sync(redo(null));
  editorRef.current?.focus();
};

export const rowsInserterAbove = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;
  sync(insertRowsAbove({ numRows, y: top, operator: 'USER' }));
  editorRef.current?.focus();
};

export const rowsInserterBelow = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { bottom } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;
  sync(insertRowsBelow({ numRows, y: bottom, operator: 'USER' }));
  editorRef.current?.focus();
};

export const colsInserterLeft = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;
  sync(insertColsLeft({ numCols, x: left, operator: 'USER' }));
  editorRef.current?.focus();
};

export const colsInserterRight = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { right } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;
  sync(insertColsRight({ numCols, x: right, operator: 'USER' }));
  editorRef.current?.focus();
};

export const rowsRemover = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).height;
  sync(removeRows({ numRows, y: top, operator: 'USER' }));
  editorRef.current?.focus();
};

export const colsRemover = async ({ store, sync }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).width;
  sync(removeCols({ numCols, x: left, operator: 'USER' }));
  editorRef.current?.focus();
};

export const syncers = {
  copy: copier,
  cut: cutter,
  paste: paster,
  undo: undoer,
  redo: redoer,
  insertRowsAbove: rowsInserterAbove,
  insertRowsBelow: rowsInserterBelow,
  insertColsLeft: colsInserterLeft,
  insertColsRight: colsInserterRight,
  removeRows: rowsRemover,
  removeCols: colsRemover,
};
