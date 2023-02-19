import {DEFAULT_HEIGHT, DEFAULT_WIDTH, OVERSCAN_X, OVERSCAN_Y} from "../constants";
import {range} from "./structs";
import {Table} from "./table";
import {PointType} from "../types";

export const getCellRectPositions = (
  table: Table,
  e: HTMLDivElement,
  {y, x}: PointType,
) => {
  let { width, height} = table.getRectSize({top: 1, left: 1, bottom: y, right: x});
  width += table.headerWidth;
  height += table.headerHeight;
  const w = table.getByPoint({ y: 0, x })?.width || DEFAULT_WIDTH;
  const h = table.getByPoint({ y, x: 0 })?.height || DEFAULT_HEIGHT;
  return { top: height, left: width, bottom: height + h, right: width + w, width: w, height: h };
}

export const getScreenRect = (e: HTMLDivElement) => {
  const top = e.scrollTop, left = e.scrollLeft;
  const height = e.offsetHeight, width = e.offsetWidth;
  const bottom = top + height, right = left + width;
  return { top, left, bottom, right, height, width };
}

export const virtualize = (table: Table, e: HTMLDivElement) => {
  let boundaryTop = 0, boundaryLeft = 0,
    boundaryBottom = table.getNumRows(), boundaryRight = table.getNumCols();

  const { top, left, bottom, right } = getScreenRect(e);
  let width = 0, height = 0;
  for (let x = 1; x <= table.getNumCols(); x++) {
    const w = table.getByPoint({ y: 0, x })?.width || DEFAULT_WIDTH;
    width += w;
    if (boundaryLeft === 0 && width > left) {
      boundaryLeft = Math.max(x - OVERSCAN_X, 1);
    }
    if (width > right) {
      boundaryRight = Math.min(x + OVERSCAN_X, table.getNumCols());
      break;
    }
  }
  for (let y = 1; y <= table.getNumRows(); y++) {
    const h = table.getByPoint({y, x: 0})?.height || DEFAULT_HEIGHT;
    height += h;
    if (boundaryTop === 0 && height > top) {
      boundaryTop = Math.max(y - OVERSCAN_Y, 1);
    }
    if (height > bottom) {
      boundaryBottom = Math.min(y + OVERSCAN_Y, table.getNumRows());
      break;
    }
  }
  const ys = range(boundaryTop, boundaryBottom);
  const xs = range(boundaryLeft, boundaryRight);
  const before = table.getRectSize({top: 1, left: 1, bottom: boundaryTop, right: boundaryLeft});
  const after = table.getRectSize({top: boundaryBottom, left: boundaryRight, bottom: table.getNumRows(), right: table.getNumCols()});
  return {
    ys,
    xs,
    adjuster: {
      top: before.height,
      left: before.width,
      bottom: after.height,
      right: after.width,
    },
  };
}

export const smartScroll = (
  table: Table,
  e: HTMLDivElement,
  targetPoint: PointType,
  behavior: ScrollBehavior='auto',
) => {
  const screen = getScreenRect(e);
  const target = getCellRectPositions(table, e, targetPoint);

  // when header is sticky
  const up = target.top - table.headerHeight;
  const left = target.left - table.headerWidth;
  const down = target.bottom - (screen.height) + 1;
  const right = target.right - (screen.width) + 1;

  const isTopOver = up < screen.top;
  const isLeftOver = left < screen.left;
  const isBottomOver = target.bottom > screen.bottom;
  const isRightOver = target.right > screen.right;

  if (isLeftOver) {
    if (isTopOver) {
      // go left up
      e.scrollTo({left, top: up, behavior});
    } else if (isBottomOver) {
      // go left down
      e.scrollTo({left, top: down, behavior});
    } else {
      // go left
      e.scrollTo({left, top: screen.top, behavior});
    }
  } else if (isRightOver) {
    if (isTopOver) {
      // go right up
      e.scrollTo({left: right, top: up, behavior});
    } else if (isBottomOver) {
      // go right down
      e.scrollTo({left: right, top: down, behavior});
    } else {
      // go right
      e.scrollTo({left: right, top: screen.top, behavior});
    }
  } else {
    if (isTopOver) {
      // go up
      e.scrollTo({left: screen.left, top: up, behavior});
    } else if (isBottomOver) {
      // go down
      e.scrollTo({left: screen.left, top: down, behavior});
    } else {
      // go nowhere
    }
  }
};



