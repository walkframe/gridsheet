import { a2p, x2c, y2r } from '../lib/converters';
import { Table } from '../lib/table';
import { Address, PointType, StoreType } from '../types';

export const restrictPoints = (store: StoreType, table: Table) => {
  const { choosing, selectingZone } = store;
  let { y, x } = choosing;
  let { startY: y1, startX: x1, endY: y2, endX: x2 } = selectingZone;
  let { startY: y3, startX: x3, endY: y4, endX: x4 } = table.wire.copyingZone;
  const [numRows, numCols] = [table.getNumRows(), table.getNumCols()];
  if (y > numRows) {
    y = numRows;
  }
  if (x > numCols) {
    x = numCols;
  }
  if (y1 > numRows) {
    y1 = numRows;
  }
  if (y2 > numRows) {
    y2 = numRows;
  }
  if (x1 > numCols) {
    x1 = numCols;
  }
  if (x2 > numCols) {
    x2 = numCols;
  }
  if (y3 > numRows) {
    y3 = numRows;
  }
  if (y4 > numRows) {
    y4 = numRows;
  }
  if (x3 > numCols) {
    x3 = numCols;
  }
  if (x4 > numCols) {
    x4 = numCols;
  }
  return {
    choosing: { y, x } as PointType,
    selectingZone: { startY: y1, startX: x1, endY: y2, endX: x2 },
    copyingZone: { startY: y3, startX: x3, endY: y4, endX: x4 },
  };
};

export const shouldTracking = (operation: string) => {
  switch (operation) {
    case 'INSERT_ROWS':
      return true;
    case 'INSERT_COLS':
      return true;
    case 'REMOVE_ROWS':
      return true;
    case 'REMOVE_COLS':
      return true;
    case 'MOVE':
      return true;
  }
  return false;
};

export const initSearchStatement = (table: Table, store: StoreType) => {
  const { searchQuery, searchCaseSensitive } = store;
  let { choosing } = store;
  if (!searchQuery) {
    return { matchingCells: [] };
  }
  const matchingCells: Address[] = [];
  for (let y = 1; y <= table.bottom; y++) {
    for (let x = 1; x <= table.right; x++) {
      const v = table.stringify({ point: { y, x } });
      const s = searchCaseSensitive ? v : v.toLowerCase();
      const q = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase();
      if (s.indexOf(q) !== -1) {
        matchingCells.push(`${x2c(x)}${y2r(y)}`);
      }
    }
  }
  const matchingCellIndex = matchingCells.length === store.matchingCells.length ? store.matchingCellIndex : 0;
  if (matchingCells.length > 0) {
    const address = matchingCells[matchingCellIndex];
    choosing = a2p(address);
  }
  return { matchingCells, searchQuery, matchingCellIndex, choosing };
};

export const isXSheetFocused = (store: StoreType) => {
  const { sheetId, tableReactive: tableRef } = store;
  const table = tableRef.current;
  if (!table) {
    return false;
  }
  if (sheetId === table.wire.editingSheetId) {
    return false;
  }
  return !!table.wire.editingAddress;
};
