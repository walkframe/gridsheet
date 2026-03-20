import type { ContextMenuProps, FilterConfig, RawCellType } from '../types';
import { areaToZone, zoneShape, zoneToArea } from '../lib/spatial';
import { focus } from '../lib/dom';
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
  sortRows,
  filterRows,
  setSearchQuery,
  setEntering,
} from './actions';
import { clip } from '../lib/clipboard';
import { parseHTML, parseText } from '../lib/paste';

export const copier = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  dispatch(copy(areaToZone(area)));
  focus(editorRef.current);
};

export const cutter = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  const area = clip(store);
  dispatch(cut(areaToZone(area)));
  focus(editorRef.current);
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
  focus(editorRef.current);
};

export const undoer = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  dispatch(undo(null));
  focus(editorRef.current);
};

export const redoer = async ({ store, dispatch }: ContextMenuProps) => {
  const { editorRef } = store;
  dispatch(redo(null));
  focus(editorRef.current);
};

export const rowsInserterAbove = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).rows;
  dispatch(insertRowsAbove({ numRows, y: top, operator: 'USER' }));
  focus(editorRef.current);
};

export const rowsInserterBelow = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { bottom } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).rows;
  dispatch(insertRowsBelow({ numRows, y: bottom, operator: 'USER' }));
  focus(editorRef.current);
};

export const colsInserterLeft = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).cols;
  dispatch(insertColsLeft({ numCols, x: left, operator: 'USER' }));
  focus(editorRef.current);
};

export const colsInserterRight = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { right } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).cols;
  dispatch(insertColsRight({ numCols, x: right, operator: 'USER' }));
  focus(editorRef.current);
};

export const rowsRemover = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { top } = zoneToArea(selectingZone);
  const numRows = zoneShape({ ...selectingZone, base: 1 }).rows;
  dispatch(removeRows({ numRows, y: top, operator: 'USER' }));
  focus(editorRef.current);
};

export const colsRemover = async ({ store, dispatch }: ContextMenuProps) => {
  const { selectingZone, editorRef } = store;
  const { left } = zoneToArea(selectingZone);
  const numCols = zoneShape({ ...selectingZone, base: 1 }).cols;
  dispatch(removeCols({ numCols, x: left, operator: 'USER' }));
  focus(editorRef.current);
};

export const rowsSorterAsc = async ({ store, dispatch }: ContextMenuProps, x: number) => {
  const table = store.tableReactive.current;
  if (table && (table.hasPendingCells() || table.wire.asyncPending.size > 0)) {
    await table.waitForPending();
  }
  dispatch(sortRows({ x, direction: 'asc' }));
  focus(store.editorRef.current);
};

export const rowsSorterDesc = async ({ store, dispatch }: ContextMenuProps, x: number) => {
  const table = store.tableReactive.current;
  if (table && (table.hasPendingCells() || table.wire.asyncPending.size > 0)) {
    await table.waitForPending();
  }
  dispatch(sortRows({ x, direction: 'desc' }));
  focus(store.editorRef.current);
};

export const rowsFilterer = async ({ store, dispatch }: ContextMenuProps, x: number, filter: FilterConfig) => {
  const table = store.tableReactive.current;
  if (table && (table.hasPendingCells() || table.wire.asyncPending.size > 0)) {
    await table.waitForPending();
  }
  dispatch(filterRows({ x, filter }));
  focus(store.editorRef.current);
};

export const rowsFilterClearer = async ({ store, dispatch }: ContextMenuProps, x?: number) => {
  dispatch(filterRows({ x }));
  focus(store.editorRef.current);
};

export const searcher = async ({ store, dispatch }: ContextMenuProps) => {
  if (typeof store.searchQuery === 'undefined') {
    dispatch(setSearchQuery(''));
  }
  dispatch(setEntering(false));
  requestAnimationFrame(() => focus(store.searchInputRef.current));
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
  sortRowsAsc: rowsSorterAsc,
  sortRowsDesc: rowsSorterDesc,
  filterRows: rowsFilterer,
  clearFilter: rowsFilterClearer,
  search: searcher,
};
