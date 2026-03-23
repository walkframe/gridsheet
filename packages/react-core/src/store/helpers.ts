import { a2p, x2c, y2r } from '../lib/coords';
import { Sheet } from '../lib/sheet';
import type { Address, PointType, StoreType } from '../types';

export const restrictPoints = (store: StoreType, sheet: Sheet) => {
  const { choosing, selectingZone } = store;
  let { y, x } = choosing;
  let { startY: y1, startX: x1, endY: y2, endX: x2 } = selectingZone;
  const [numRows, numCols] = [sheet.numRows, sheet.numCols];
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
  return {
    choosing: { y, x } as PointType,
    selectingZone: { startY: y1, startX: x1, endY: y2, endX: x2 },
  };
};

const FLASH_CLASS = 'gs-flash-overlay--active';
const FLASH_DURATION_MS = 600;
export const flashSheet = (el: HTMLElement | null) => {
  if (!el) {
    return;
  }
  el.classList.remove(FLASH_CLASS);
  // force reflow to restart animation when called consecutively
  void el.offsetWidth;
  el.classList.add(FLASH_CLASS);
  setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_DURATION_MS);
};

export const flashWithCallback = (
  store: StoreType,
  sheet: Sheet,
  callback: ((s: StoreType) => void) | undefined,
): StoreType & { callback?: (store: StoreType) => void } => ({
  ...store,
  sheetReactive: { current: sheet },
  callback: (s: StoreType) => {
    callback?.(s);
    flashSheet(store.flashRef.current);
  },
});

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
    case 'SORT_ROWS':
      return true;
  }
  return false;
};

export const initSearchStatement = (sheet: Sheet, store: StoreType) => {
  const { searchQuery, searchCaseSensitive, searchRegex, searchRange } = store;
  let { choosing } = store;
  if (!searchQuery) {
    return { matchingCells: [] };
  }
  const matchingCells: Address[] = [];

  let matcher: (value: string) => boolean;
  if (searchRegex) {
    try {
      const flags = searchCaseSensitive ? '' : 'i';
      const regex = new RegExp(searchQuery, flags);
      matcher = (v: string) => regex.test(v);
    } catch (e) {
      // Invalid regex, treat as literal string
      const q = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase();
      matcher = (v: string) => {
        const s = searchCaseSensitive ? v : v.toLowerCase();
        return s.indexOf(q) !== -1;
      };
    }
  } else {
    const q = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase();
    matcher = (v: string) => {
      const s = searchCaseSensitive ? v : v.toLowerCase();
      return s.indexOf(q) !== -1;
    };
  }

  // Determine search range
  let startY = 1,
    endY = sheet.bottom;
  let startX = 1,
    endX = sheet.right;
  if (searchRange) {
    startY = searchRange.startY;
    endY = searchRange.endY;
    startX = searchRange.startX;
    endX = searchRange.endX;
  }

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const v = sheet.getSerializedValue({ point: { y, x } });
      if (matcher(v)) {
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
  const { sheetId, sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;
  if (!sheet) {
    return false;
  }
  if (sheetId === sheet.registry.editingSheetId) {
    return false;
  }
  return !!sheet.registry.editingAddress;
};
