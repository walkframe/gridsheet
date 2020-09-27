import {
  handlePropsType,
} from "../types";

import { cropMatrix, writeMatrix } from "../api/matrix";
import { convertArrayToTSV, convertTSVToArray} from "./converters";


export const handleBlur = ({
  select,
  choose, choosing, setChoosingLast,
  colsSelect, rowsSelect,
}: handlePropsType) => {
  return () => {
    setChoosingLast(choosing);
    select([-1, -1, -1, -1]);
    choose([-1, -1]);
    colsSelect([-1, -1]);
    rowsSelect([-1, -1]);
  };
};

export const handleClear = ({
  x, y,
  rows, setRows,
  selecting,
  selectingArea,
}: handlePropsType) => {
  const [top, left, bottom, right] = selectingArea;
  return () => {
    if (selecting[0] === -1) {
      rows[y][x] = "";
    } else {
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          rows[y][x] = "";
        }
      }
    }
    setRows([... rows]);
  };
};

export const handleCopy = ({
  y, x,
  rows,
  clipboardRef,
  select, selecting, selectingArea,
  copy,
  choose,
  setCutting,
}: handlePropsType) => {
  let area = selectingArea;
  if (area[0] === -1) {
    area = [y, x, y, x];
  }
  return (cutting=false) => {
    const input = clipboardRef.current;
    copy(area);
    const copyingRows = cropMatrix(rows, area);
    const tsv = convertArrayToTSV(copyingRows);
    const selectingLast = selecting;
    if (input != null) {
      input.value = tsv;
      input.focus();
      input.select();
      document.execCommand("copy");
      input.value = "";
      input.blur();
      setTimeout(() => {
        choose([y, x]);
        select(selectingLast);
      }, 100); // refocus
    }
    setCutting(cutting);
  };
};

export const handleSelect = ({
  x, y,
  select, selecting,
  heights, widths,
}: handlePropsType) => {
  return (deltaY: number, deltaX: number) => {
    let [dragEndY, dragEndX] = [selecting[2] === -1 ? y : selecting[2], selecting[3] === -1 ? x : selecting[3]];
    let [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
    if (nextY < 0 || heights.length <= nextY || nextX < 0 || widths.length <= nextX) {
      return;
    }
    y === nextY && x === nextX ? select([-1, -1, -1, -1]) : select([y, x, nextY, nextX]);
  };
}

export const handleSelectAll = ({
  select, 
  heights, widths,
}: handlePropsType) => {
  return () => {
    select([0, 0, heights.length - 1, widths.length - 1]);
  };
};

export const handleEscape = ({
  copy,
  setCutting,
}: handlePropsType) => {
  return () => {
    copy([-1, -1, -1, -1]);
    setCutting(false);
  };
};

export const handlePaste = ({
  x, y,
  rows,
  selectingArea, copyingArea,
  cutting,
  select,
  copy,
  heights, widths,
  setRows,
}: handlePropsType) => {
  const [selectingTop, selectingLeft, selectingBottom, selectingRight] = selectingArea;
  const [copyingTop, copyingLeft, copyingBottom, copyingRight] = copyingArea;
  const [selectingHeight, selectingWidth] = [selectingBottom - selectingTop, selectingRight - selectingLeft];
  const [copyingHeight, copyingWidth] = [copyingBottom - copyingTop, copyingRight - copyingLeft];

  return (text: string) => {
    const copyingRows = cropMatrix(rows, copyingArea);
    if (cutting) {
      writeMatrix([[""]], [0, 0, 0, 0], rows, copyingArea);
    }
    if (selectingTop === -1) {
      if (copyingTop === -1) {
        const tsvRows = convertTSVToArray(text);
        const [height, width] = [tsvRows.length - 1, tsvRows[0].length - 1];
        writeMatrix(tsvRows, [0, 0, height, width], rows, [y, x, y + height, width]);
        select([y, x, y + height, x + width]);
      } else {
        writeMatrix(copyingRows, [0, 0, copyingHeight, copyingWidth], rows, [y, x, y + copyingHeight, x + copyingWidth]);
        if (copyingHeight > 0 || copyingWidth > 0) {
          select([y, x, y + copyingHeight, x + copyingWidth]);
        }
      }
    } else {
      if (copyingTop === -1) {
        const tsvRows = convertTSVToArray(text);
        const [height, width] = [tsvRows.length - 1, tsvRows[0].length - 1];
        writeMatrix(tsvRows, [0, 0, height, width], rows, [y, x, y + selectingHeight, x + selectingWidth]);
      } else {
        const [biggerHeight, biggerWidth] = [selectingHeight > copyingHeight ? selectingHeight : copyingHeight, selectingWidth > copyingWidth ? selectingWidth : copyingWidth];
        writeMatrix(copyingRows, [0, 0, copyingHeight, copyingWidth], rows, [y, x, y + biggerHeight, x + biggerWidth]);
        select([y, x, y + biggerHeight, x + biggerWidth]);
      }
    }
    setRows([...rows]);
    copy([-1, -1, -1, -1]);
  };
};

export const handleChoose = ({
  selectingArea,
  select,
  choose,
  colsSelect, rowsSelect,
  heights, widths,
}: handlePropsType) => {
  const [top, left, bottom, right] = selectingArea;

  return (nextY: number, nextX: number, breaking: boolean) => {
    if (breaking) {
      colsSelect([-1, -1]);
      rowsSelect([-1, -1]);
    }
    if (nextY < top && top !== -1 && !breaking) {
      nextY = bottom;
      nextX = nextX > left ? nextX - 1 : right;
    }
    if (nextY > bottom && bottom !== -1 && !breaking) {
      nextY = top;
      nextX = nextX < right ? nextX + 1 : left;
    }
    if (nextX < left && left !== -1 && !breaking) {
      nextX = right;
      nextY = nextY > top ? nextY - 1 : bottom;
    }
    if (nextX > right && right !== -1 && !breaking) {
      nextX = left;
      nextY = nextY < bottom ? nextY + 1 : top;
    }
    if (breaking) {
      select([-1, -1, -1, -1]);
    }
    if (nextY < 0 || heights.length <= nextY || nextX < 0 || widths.length <= nextX) {
      return;
    }
    choose([nextY, nextX]);
  };
};

export const handleWrite = ({
  y, x,
  rows, setRows,
}: handlePropsType) => {
  return (value: string) => {
    writeMatrix([[value]], [0, 0, 0, 0], rows, [y, x, y, x]);
    setRows([...rows]);
  };
};
