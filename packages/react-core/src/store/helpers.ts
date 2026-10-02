import { a2p, x2c, y2r } from '@gridsheet/web';
import { Sheet } from '@gridsheet/web';
import { zoneToArea } from '@gridsheet/web';
import type { Address, AreaType, PointType, StorePatchType, StoreType, ZoneType } from '../types';

/**
 * Strip redundant fields from a StorePatchType before recording in history.
 * - selectingZone with endY === -1 && endX === -1 is a no-selection sentinel and need not be stored.
 */
export const compactReflection = (reflection: StorePatchType): StorePatchType => {
  const result = { ...reflection };
  if (result.selectingZone != null && result.selectingZone.endY === -1 && result.selectingZone.endX === -1) {
    delete result.selectingZone;
  }
  return result;
};

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
    choosing: snapToMergeAnchor(sheet, { y, x }),
    selectingZone: fitZoneToMerges(sheet, { startY: y1, startX: x1, endY: y2, endX: x2 }),
  };
};

const NO_ZONE: ZoneType = { startY: -1, startX: -1, endY: -1, endX: -1 };

const sameArea = (a: AreaType, b: AreaType) =>
  a.top === b.top && a.left === b.left && a.bottom === b.bottom && a.right === b.right;

/** A point inside a merged range resolves to the range's anchor (top-left) cell. */
export const snapToMergeAnchor = (sheet: Sheet, point: PointType): PointType => {
  const merge = sheet.getMergeAt(point);
  if (merge == null || (merge.top === point.y && merge.left === point.x)) {
    return point;
  }
  return { y: merge.top, x: merge.left };
};

/**
 * Grow a selection so it never cuts through a merged range, keeping its direction (start
 * stays on the start side). A selection that collapses to a single merge becomes "no
 * selection", the same as selecting one plain cell.
 */
export const fitZoneToMerges = (sheet: Sheet, zone: ZoneType): ZoneType => {
  if (zone.startY === -1 || zone.endY === -1 || sheet.getMerges().length === 0) {
    return zone;
  }
  const area = sheet.expandAreaByMerges(zoneToArea(zone));
  const startMerge = sheet.getMergeAt({ y: zone.startY, x: zone.startX });
  if (startMerge != null && sameArea(startMerge, area)) {
    return NO_ZONE;
  }
  const [startY, endY] = zone.startY <= zone.endY ? [area.top, area.bottom] : [area.bottom, area.top];
  const [startX, endX] = zone.startX <= zone.endX ? [area.left, area.right] : [area.right, area.left];
  return { startY, startX, endY, endX };
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
