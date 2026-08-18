import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  OVERSCAN_X,
  OVERSCAN_Y,
  range,
  binarySearch,
  type BinarySearchPredicate,
  Sheet,
  type AreaType,
  type PointType,
  type Virtualization,
} from '@gridsheet/engine';

// Browsers lose integer-pixel precision (and get very slow) once content is laid out past
// 2^24 = 16,777,216 px, so a million 24px rows (~24M px) render broken/slow at the bottom.
// Cap the PHYSICAL scroll height just below 2^24 and map the DOM's physical scrollTop to the
// sheet's VIRTUAL scroll space; the (few) visible rows are then placed at physical offsets
// that stay under the limit (so still crisp). Identity when the sheet fits under the cap.
// Kept as high as precision allows so the physical→virtual ratio — and thus how many rows a
// given scroll gesture covers — stays as close to 1:1 as possible (~1.65× at 1M rows).
export const SCROLL_CAP = 16_000_000;

export const physicalScrollHeight = (sheet: Sheet): number => Math.min(sheet.totalHeight, SCROLL_CAP);

/** DOM (capped) physical scrollTop -> the virtual scrollTop the coordinate logic uses. */
export const toVirtualScrollTop = (sheet: Sheet, physicalTop: number, viewH: number): number => {
  const totalV = sheet.totalHeight;
  if (totalV <= SCROLL_CAP) {
    return physicalTop;
  }
  const physRange = Math.max(1, SCROLL_CAP - viewH);
  const virtRange = Math.max(0, totalV - viewH);
  return (physicalTop / physRange) * virtRange;
};

/** Virtual scrollTop -> physical scrollTop (for scrollTo / smartScroll). */
export const toPhysicalScrollTop = (sheet: Sheet, virtualTop: number, viewH: number): number => {
  const totalV = sheet.totalHeight;
  if (totalV <= SCROLL_CAP) {
    return virtualTop;
  }
  const physRange = Math.max(1, SCROLL_CAP - viewH);
  const virtRange = Math.max(1, totalV - viewH);
  return (virtualTop / virtRange) * physRange;
};

export const getCellRectPositions = (sheet: Sheet, { y, x }: PointType) => {
  const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
  const rowCell = sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' });
  const left = sheet.getSystem({ y: 0, x })?.offsetLeft ?? 0;
  const top = sheet.getOffsetTop(y);
  const w = colCell?.width || DEFAULT_WIDTH;
  const h = rowCell?.filtered ? 0 : rowCell?.height || DEFAULT_HEIGHT;
  return {
    top,
    left,
    bottom: top + h,
    right: left + w,
    width: w,
    height: h,
  };
};

export const getScreenRect = (e: HTMLDivElement) => {
  const top = e.scrollTop,
    left = e.scrollLeft;
  const height = e.clientHeight,
    width = e.clientWidth;
  const bottom = top + height,
    right = left + width;
  return { top, left, bottom, right, height, width };
};

export const virtualize = (sheet: Sheet, e: HTMLDivElement | null): Virtualization | null => {
  if (e == null) {
    return null;
  }
  let boundaryTop = 0,
    boundaryLeft = 0,
    boundaryBottom = sheet.numRows,
    boundaryRight = sheet.numCols;

  const { top: physTop, left, right, height: viewH } = getScreenRect(e);
  // Rows use the VIRTUAL scroll position (mapped from the DOM's capped physical scroll);
  // columns keep physical coordinates (few enough to never approach the cap).
  const top = toVirtualScrollTop(sheet, physTop, viewH);
  const bottom = top + viewH;
  let width = 0;
  for (let x = 1; x <= sheet.numCols; x++) {
    const w = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' })?.width || DEFAULT_WIDTH;
    width += w;
    if (boundaryLeft === 0 && width > left) {
      boundaryLeft = Math.max(x - OVERSCAN_X, 1);
    }
    if (width > right) {
      boundaryRight = Math.min(x + OVERSCAN_X, sheet.numCols);
      break;
    }
  }
  // Rows: binary-search the boundaries instead of accumulating heights from row 1.
  // The old linear scan was O(last-visible-row-index), so scrolling near the bottom
  // of a tall sheet cost O(numRows) per scroll event (~38ms at 1M rows). getOffsetTop(y)
  // is the pixel offset of row y's top edge (with row-height overrides and filtered rows
  // already folded in), so the running height through row y — matching the old accumulator,
  // header excluded — is getOffsetTop(y + 1) - headerHeight. That is monotonic in y, so we
  // binary-search it: O((overrides + filtered) * log numRows) regardless of scroll depth.
  const headerH = sheet.headerHeight;
  const numRows = sheet.numRows;
  const cumHeightThrough = (y: number) => sheet.getOffsetTop(y + 1) - headerH;
  // First row whose bottom edge passes the viewport top / bottom (binarySearch returns
  // numRows + 1 when none does, i.e. scrolled past all content / content shorter than view).
  const topIdx = binarySearch(1, numRows, (y) => cumHeightThrough(y) > top, true);
  boundaryTop = topIdx > numRows ? 0 : Math.max(topIdx - OVERSCAN_Y, 1);
  // Remap only: the visible block is placed at physical offset adjTop = physTop - top +
  // before.height (see below). Near the top of a tall (capped) sheet there isn't enough
  // physical room above the scroll position for the full top overscan, so adjTop would go
  // negative and get clamped — shifting the rendered cells down out from under the selection
  // overlay (which draws at the unclamped position). Trim the top overscan instead so
  // before.height (= getOffsetTop(boundaryTop) - headerH) >= top - physTop, keeping adjTop >= 0.
  if (boundaryTop > 0 && sheet.totalHeight > SCROLL_CAP) {
    const gap = top - physTop; // virtual scroll is >= physical scroll when remapped
    if (gap > 0 && sheet.getOffsetTop(boundaryTop) - headerH < gap) {
      const minTop = binarySearch(1, numRows, (y) => sheet.getOffsetTop(y) - headerH >= gap, true);
      boundaryTop = Math.min(Math.max(boundaryTop, minTop), topIdx);
    }
  }
  const bottomIdx = binarySearch(1, numRows, (y) => cumHeightThrough(y) > bottom, true);
  boundaryBottom = bottomIdx > numRows ? numRows : Math.min(bottomIdx + OVERSCAN_Y, numRows);
  const ys = boundaryTop === 0 ? [] : range(boundaryTop, boundaryBottom).filter((y) => !sheet.isRowFiltered(y));
  const xs = range(boundaryLeft, boundaryRight);
  const before = sheet.getRectSize({
    top: 1,
    left: 1,
    bottom: boundaryTop,
    right: boundaryLeft,
  });
  const after = sheet.getRectSize({
    top: boundaryBottom,
    left: boundaryRight,
    bottom: sheet.numRows,
    right: sheet.numCols,
  });
  // Vertical spacers: when remapping, place the visible block at a PHYSICAL offset near
  // the current physical scroll (so it renders well under 2^24 px) rather than at its
  // virtual offset (which can reach ~24M). before.height is the virtual height above the
  // first rendered row; the top spacer is that, shifted from virtual into physical space.
  let adjTop = before.height;
  let adjBottom = after.height;
  if (sheet.totalHeight > SCROLL_CAP) {
    adjTop = Math.max(0, physTop - top + before.height);
    const visibleHeight = sheet.totalHeight - sheet.headerHeight - before.height - after.height;
    adjBottom = Math.max(0, SCROLL_CAP - sheet.headerHeight - adjTop - visibleHeight);
  }
  return {
    ys,
    xs,
    adjuster: {
      top: adjTop,
      left: before.width,
      bottom: adjBottom,
      right: after.width,
    },
  };
};

// Inclusive [first, last] row indices whose vertical span intersects the viewport
// (scrollTop..scrollTop+viewH). Lets overlay/header drawing stay O(visible) instead
// of O(numRows) — the same binary-search trick virtualize() uses. `first > last`
// signals an empty range (e.g. a zero-row sheet).
export const getVisibleRowRange = (sheet: Sheet, scrollTop: number, viewH: number): [number, number] => {
  const numRows = sheet.numRows;
  if (numRows < 1) {
    return [1, 0];
  }
  const headerH = sheet.headerHeight;
  // getOffsetTop(y+1) - headerH == cumulative data height through row y (filtered rows = 0).
  const cum = (y: number) => sheet.getOffsetTop(y + 1) - headerH;
  const first = binarySearch(1, numRows, (y) => cum(y) > scrollTop, true);
  const last = binarySearch(1, numRows, (y) => cum(y) > scrollTop + viewH, true);
  // ±1 overscan so a partially-clipped edge row is never skipped.
  return [Math.max(1, first - 1), Math.min(last + 1, numRows)];
};

// Column analogue of getVisibleRowRange, using the precomputed header offsetLeft.
export const getVisibleColRange = (sheet: Sheet, scrollLeft: number, viewW: number): [number, number] => {
  const numCols = sheet.numCols;
  if (numCols < 1) {
    return [1, 0];
  }
  const headerW = sheet.headerWidth;
  const cum = (x: number) => (sheet.getSystem({ y: 0, x: x + 1 })?.offsetLeft ?? sheet.totalWidth) - headerW;
  const first = binarySearch(1, numCols, (x) => cum(x) > scrollLeft, true);
  const last = binarySearch(1, numCols, (x) => cum(x) > scrollLeft + viewW, true);
  // ±1 overscan so a partially-clipped edge column is never skipped.
  return [Math.max(1, first - 1), Math.min(last + 1, numCols)];
};

export const smartScroll = (
  sheet: Sheet,
  e: HTMLDivElement | null,
  targetPoint: PointType,
  behavior: ScrollBehavior = 'auto',
) => {
  if (e == null) {
    return;
  }
  const screen = getScreenRect(e);
  const viewH = screen.height;
  // Vertical is done in virtual space (target.top/bottom are virtual), then mapped back to
  // the DOM's physical scroll; horizontal stays physical (columns aren't remapped).
  const virtTop = toVirtualScrollTop(sheet, screen.top, viewH);
  const target = getCellRectPositions(sheet, targetPoint);

  const upV = target.top - sheet.headerHeight;
  const downV = target.bottom - viewH + 1;
  const leftP = target.left - sheet.headerWidth;
  const rightP = target.right - screen.width + 1;

  const isTopOver = upV < virtTop;
  const isBottomOver = target.bottom > virtTop + viewH;
  const isLeftOver = leftP < screen.left;
  const isRightOver = target.right > screen.right;

  const toPhys = (vTop: number) => toPhysicalScrollTop(sheet, Math.max(0, vTop), viewH);
  let topDest = screen.top;
  if (isTopOver) {
    topDest = toPhys(upV);
  } else if (isBottomOver) {
    topDest = toPhys(downV);
  }
  let leftDest = screen.left;
  if (isLeftOver) {
    leftDest = leftP;
  } else if (isRightOver) {
    leftDest = rightP;
  }
  if (topDest !== screen.top || leftDest !== screen.left) {
    e.scrollTo({ left: leftDest, top: topDest, behavior });
  }
};

type PositionGetter = (rect: DOMRect) => number;

const findVisibleElement = (
  elements: HTMLTableHeaderCellElement[],
  getPosition: PositionGetter,
  boundary: number,
  dataKey: string,
): number => {
  const index = binarySearch(
    0,
    elements.length - 1,
    (mid) => getPosition(elements[mid].getBoundingClientRect()) < boundary,
    false,
  );
  return parseInt(elements[index]?.dataset[dataKey] ?? '1');
};

export const getAreaInTabular = (tabularElement: HTMLDivElement): AreaType => {
  const {
    top: topPosition,
    left: leftPosition,
    bottom: bottomPosition,
    right: rightPosition,
  } = tabularElement.getBoundingClientRect();

  const rows = Array.from(tabularElement.querySelectorAll('.gs-th-left')) as HTMLTableHeaderCellElement[];
  const cols = Array.from(tabularElement.querySelectorAll('.gs-th-top')) as HTMLTableHeaderCellElement[];

  const top = findVisibleElement(rows, (rect) => rect.top, topPosition, 'y');
  const bottom = findVisibleElement(rows, (rect) => rect.bottom, bottomPosition + 1, 'y');
  const left = findVisibleElement(cols, (rect) => rect.left, leftPosition, 'x');
  const right = findVisibleElement(cols, (rect) => rect.right, rightPosition + 1, 'x');

  return { top, left, bottom, right };
};
