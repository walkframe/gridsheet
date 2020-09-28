import {
  handlePropsType,
} from "../types";

import { cropMatrix, makeMatrix, writeMatrix, spreadMatrix, superposeArea } from "../api/matrix";
import { convertArrayToTSV, convertTSVToArray} from "./converters";
import { undo, redo } from "./histories";

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
  history,
  matrix, setMatrix,
  selectingArea,
}: handlePropsType) => {
  return () => {
    const [top, left, bottom, right] = selectingArea;
    if (top === -1) {
      selectingArea = [y, x, y, x];
    }
    history.append({
      command: "replace",
      src: [-1, -1, -1, -1],
      dst: selectingArea,
      before: cropMatrix(matrix, selectingArea),
      after: makeMatrix("", bottom - top + 1, right - left + 1),
    });
    writeMatrix([[""]], [0, 0, 0, 0], matrix, selectingArea);
    setMatrix([... matrix]);
  };
};

export const handleCopy = ({
  y, x,
  matrix,
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
    const copyingRows = cropMatrix(matrix, area);
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
  history,
  matrix,
  selectingArea, copyingArea,
  cutting,
  select,
  copy,
  setMatrix,
}: handlePropsType) => {
  const [selectingTop, selectingLeft, selectingBottom, selectingRight] = selectingArea;
  const [copyingTop, copyingLeft, copyingBottom, copyingRight] = copyingArea;
  const [selectingHeight, selectingWidth] = [selectingBottom - selectingTop, selectingRight - selectingLeft];
  const [copyingHeight, copyingWidth] = [copyingBottom - copyingTop, copyingRight - copyingLeft];

  return (text: string) => {
    const copyingMatrix = cropMatrix(matrix, copyingArea);
    if (cutting) {
      writeMatrix([[""]], [0, 0, 0, 0], matrix, copyingArea);
    }
    if (selectingTop === -1) {
      if (copyingTop === -1) {
        const tsvMatrix = convertTSVToArray(text);
        const [height, width] = [tsvMatrix.length - 1, tsvMatrix[0].length - 1];
        history.append({
          command: "replace",
          src: [-1, -1, -1, -1],
          dst: [y, x, y + height, x + width],
          before: cropMatrix(matrix, [y, x, y + height, x + width]),
          after: tsvMatrix,
        });
        writeMatrix(tsvMatrix, [0, 0, height, width], matrix, [y, x, y + height, x + width]);
        select([y, x, y + height, x + width]);
      } else {
        history.append({
          command: "replace",
          src: [-1, -1, -1, -1],
          dst: [y, x, y + copyingHeight, x + copyingWidth],
          before: cropMatrix(matrix, [y, x, y + copyingHeight, x + copyingWidth]),
          after: copyingMatrix,
        });
        writeMatrix(copyingMatrix, [0, 0, copyingHeight, copyingWidth], matrix, [y, x, y + copyingHeight, x + copyingWidth]);
        if (copyingHeight > 0 || copyingWidth > 0) {
          select([y, x, y + copyingHeight, x + copyingWidth]);
        }
      }
    } else {
      if (copyingTop === -1) {
        const tsvMatrix = convertTSVToArray(text);
        const [height, width] = superposeArea([0, 0, tsvMatrix.length - 1, tsvMatrix[0].length - 1], [0, 0, selectingHeight, selectingWidth]);
        const after = spreadMatrix(tsvMatrix, height, width);
        history.append({
          command: "replace",
          src: [-1, -1, -1, -1],
          dst: [y, x, y + height, x + width],
          before: cropMatrix(matrix, [selectingTop, selectingLeft, selectingTop + height, selectingLeft + width]),
          after,
        });
        writeMatrix(after, [0, 0, height, width], matrix, [selectingTop, selectingLeft, selectingTop + height, selectingLeft + width]);
        select([y, x, y + height, x + width]);
      } else {
        const [height, width] = superposeArea(copyingArea, selectingArea);
        const after = spreadMatrix(copyingMatrix, height, width);
        history.append({
          command: "replace",
          src: [-1, -1, -1, -1],
          dst: [y, x, y + height, x + width],
          before: cropMatrix(matrix, [selectingTop, selectingLeft, selectingTop + height, selectingLeft + width]),
          after,
        });
        writeMatrix(after, [0, 0, height, width], matrix, [y, x, y + height, x + width]);
        select([y, x, y + height, x + width]);
      }
    }
    setMatrix([... matrix]);
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
  history,
  matrix, setMatrix,
}: handlePropsType) => {
  return (value: string) => {
    history.append({
      command: "replace",
      src: [-1, -1, -1, -1],
      dst: [y, x, y, x],
      before: [[matrix[y][x]]],
      after: [[value]],
    });
    writeMatrix([[value]], [0, 0, 0, 0], matrix, [y, x, y, x]);
    setMatrix([... matrix]);
  };
};

export const handleUndo = ({
  history,
  matrix, setMatrix,
}: handlePropsType) => {
  return () => {
    const operation = history.prev();
    if (typeof operation === "undefined") {
      return;
    }
    undo(operation, matrix);
    setMatrix([... matrix]);
  };
};

export const handleRedo = ({
  history,
  matrix, setMatrix,
}: handlePropsType) => {
  return () => {
    const operation = history.next();
    if (typeof operation === "undefined") {
      return;
    }
    redo(operation, matrix);
    setMatrix([... matrix]);
  };
};
