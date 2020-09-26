import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthsType,
  HeightsType,
} from "../types";
import { Y_START, Y_END, X_START, X_END, DUMMY_IMG } from "../constants";

import {
  Cell,
} from "./Cell";
import {
  convertNtoA,
  convertArrayToTSV,
  convertTSVToArray,
} from "../utils/converters";

interface Props {
  data: DataType;
  widths: WidthsType;
  heights: HeightsType;
  setWidths: (widths: WidthsType) => void;
  setHeights: (heights: HeightsType) => void;
};

type Position = [number, number];
type Range = [number, number, number, number];

const GridTableLayout = styled.div`
  .grid-table {
    table-layout: fixed;
    border-collapse: collapse;
    th, td {
      border: solid 1px #bbbbbb;
    }
    th {
      color: #777777;
      font-size: 13px;
      font-weight: normal;
      width: 80px;
      background-color: #eeeeee;

      &.col-number {
        &.choosing {
          background-color: #dddddd;
        }
        &.selecting {
          background-color: #555555;
          color: #ffffff;
        }
      }
      &.row-number {
        &.choosing {
          background-color: #dddddd;
        }
        &.selecting {
          background-color: #555555;
          color: #ffffff;
        }
      }

    }
    td {
      position: relative;
      padding: 0;
      margin: 0;
      width: 150px;
      background-color: #ffffff;
      border: solid 1px #cccccc;
      
      &.selecting {
        background-color: rgba(0, 128, 255, 0.2);
      }
      &.cutting {
        border: dotted 2px #0077ff;
        textarea:focus {
          outline: solid 1px #0077ff;
        }
      }
      &.copying {
        border: dashed 2px #0077ff;
        textarea:focus {
          outline: solid 1px #0077ff;
        }
      }
    }
  }
  .clipboard {
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    color: transparent;
    background-color: transparent;
    position: absolute;
    top: -999999px;
    left: -999999px;
    margin-left: -9999px;
    margin-top: -9999px;
    z-index: -9999;
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [rows, setRows] = React.useState(data);
  const [choosing, choose] = React.useState<Position>([0, 0]);
  const [cutting, setCutting] = React.useState(false);

  const [rowsSelecting, rowsSelect] = React.useState<[number, number]>([-1, -1]);
  const [colsSelecting, colsSelect] = React.useState<[number, number]>([-1, -1]);

  const [selecting, select] = React.useState<Range>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const selectingArea: Range = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [selectingArea[0], selectingArea[2]] = selecting[Y_START] < selecting[Y_END] ? [selecting[Y_START], selecting[Y_END]] : [selecting[Y_END], selecting[Y_START]];
  [selectingArea[1], selectingArea[3]] = selecting[X_START] < selecting[X_END] ? [selecting[X_START], selecting[X_END]] : [selecting[X_END], selecting[X_START]];

  const [copying, copy] = React.useState<Range>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const copyingArea: Range = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [copyingArea[0], copyingArea[2]] = copying[Y_START] < copying[Y_END] ? [copying[Y_START], copying[Y_END]] : [copying[Y_END], copying[Y_START]];
  [copyingArea[1], copyingArea[3]] = copying[X_START] < copying[X_END] ? [copying[X_START], copying[X_END]] : [copying[X_END], copying[X_START]];

  const isSelecting = (y: number, x: number) => {
    const [top, left, bottom, right] = selectingArea;
    return top !== -1 && (top <= y && y <= bottom && left <= x && x <= right);
  };
  const isCopying = (y: number, x: number) => {
    const [top, left, bottom, right] = copyingArea;
    return (top <= y && y <= bottom && left <= x && x <= right);
  };

  const clipboardRef = React.createRef<HTMLTextAreaElement>();

  const handleProps = {
    rows, setRows,
    choosing, choose,
    cutting, setCutting,
    heights, widths,
    select, selecting, selectingArea,
    copy, copying, copyingArea, clipboardRef,
    colsSelect, rowsSelect, colsSelecting, rowsSelecting,
  };

  return (<GridTableLayout>
    <textarea className="clipboard" ref={clipboardRef}></textarea>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, x) => {
            const isSelectingCols = colsSelecting[0] !== -1 && colsSelecting[1] !== -1 && ((colsSelecting[0] <= x && x <= colsSelecting[1]) || (colsSelecting[1] <= x && x <= colsSelecting[0]));
            return (<th 
              key={x}
              className={`col-number ${choosing[1] === x ? "choosing" : ""} ${isSelectingCols ? "selecting" : ""}`}
              style={{ width }}
              onClick={(e) => {
                select([0, x, heights.length - 1, x]);
                choose([0, x]);
                colsSelect([x, x]);
                rowsSelect([-1, -1]);
                return false;
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
                select([0, x, heights.length - 1, x]);
                choose([0, x]);
                colsSelect([x, -1]);
                rowsSelect([-1, -1]);
                return false;
              }}
              onDragEnter={(e) => {
                const [startY, startX, endY] = selecting;
                select([startY, startX, endY, x]);
                colsSelect([colsSelecting[0], x]);
                return false;
              }}
            >{convertNtoA(x + 1)}</th>);
          })
        }
        </tr>
      </thead>
      <tbody>{heights.map((height, y) => {
        const isSelectingRows = rowsSelecting[0] !== -1 && rowsSelecting[1] !== -1 && ((rowsSelecting[0] <= y && y <= rowsSelecting[1]) || (rowsSelecting[1] <= y && y <= rowsSelecting[0]));
        return (<tr key={y}>
          <th
            className={`row-number ${choosing[0] === y ? "choosing" : ""} ${isSelectingRows ? "selecting" : ""}`}
            style={{ height }}
            onClick={(e) => {
              select([y, 0, y, widths.length - 1]);
              choose([y, 0]);
              rowsSelect([y, y]);
              colsSelect([-1, -1]);
              return false;
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              select([y, 0, y, widths.length - 1]);
              choose([y, 0]);
              rowsSelect([y, -1]);
              colsSelect([-1, -1]);
              return false;
            }}
            onDragEnter={(e) => {
              const [startY, startX, endY, endX] = selecting;
              select([startY, startX, y, endX]);
              rowsSelect([rowsSelecting[0], y]);
              return false;
            }}
          >{y + 1}</th>
          {widths.map((width, x) => {
            const value = rows[y][x];
            return (<td
              key={x}
              className={`${isSelecting(y, x) ? "selecting": ""} ${isCopying(y, x) ? cutting ? "cutting" : "copying" : ""}`}
              style={getCellStyle(y, x, copyingArea)}
              draggable
              onClick={(e) => {
                choose([y, x]);
                select([-1, -1, -1, -1]);
                colsSelect([-1, -1]);
                rowsSelect([-1, -1]);
              }}
              onDragStart={(e) => {
                e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
                choose([y, x]);
                select([y, x, -1, -1]);
              }}
              onDragEnd={() => {
                if (selecting[0] === selecting[2] && selecting[1] === selecting[3]) {
                  select([-1, -1, -1, -1]);
                }
              }}
              onDragEnter={(e) => {
                const [startY, startX] = selecting;
                if (colsSelecting[0] !== -1) {
                  colsSelect([colsSelecting[0], x]);
                  select([startY, startX, heights.length - 1, x]);
                  return false;
                }
                if (rowsSelecting[0] !== -1) {
                  rowsSelect([rowsSelecting[0], y]);
                  select([startY, startX, y, widths.length - 1]);
                  return false;
                }
                select([startY, startX, y, x])
              }}
            ><Cell
              value={value}
              x={x}
              y={y}
              write={handleWrite({... handleProps, y, x})}
              copy={handleCopy({... handleProps, y, x})}
              escape={handleEscape({... handleProps, y, x})}
              clear={handleClear({... handleProps, y, x})}
              paste={handlePaste({... handleProps, y, x})}
              select={handleSelect({... handleProps, y, x})}
              selectAll={handleSelectAll({... handleProps, y, x})}
              blur={handleBlur({... handleProps, y, x})}
              choose={handleChoose({... handleProps, y, x})}
              choosing={choosing[0] === y && choosing[1] === x}
            /></td>);
          })}
        </tr>);
      })
      }</tbody>
    </table>
  </GridTableLayout>);
};

type handlePropsType = {
  y: number;
  x: number;
  rows: DataType;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  selecting: Range;
  selectingArea: Range;
  copying: Range;
  copyingArea: Range;
  heights: string[];
  widths: string[];
  cutting: boolean,
  copy: (range: Range) => void;
  select: (range: Range) => void;
  choose: (position: Position) => void;
  setCutting: (cutting: boolean) => void;
  setRows: (rows: DataType) => void;
  colsSelect: (cols: [number, number]) => void;
  rowsSelect: (rows: [number, number]) => void;
  colsSelecting: [number, number];
  rowsSelecting: [number, number];
};

const handleBlur = ({
  select,
  choose,
  colsSelect, rowsSelect,
}: handlePropsType) => {
  return () => {
    choose([-1, -1]);
    select([-1, -1, -1, -1]);
    colsSelect([-1, -1]);
    rowsSelect([-1, -1]);
  };
};

const handleClear = ({
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

const handleCopy = ({
  x, y,
  rows,
  clipboardRef,
  selecting,
  selectingArea,
  copyingArea,
  copy,
  choose,
  setCutting,
}: handlePropsType) => {
  let [top, left, bottom, right] = copyingArea;
  if (top === -1) {
    [top, left, bottom, right] = selectingArea;
  }
  return (cutting=false) => {
    const input = clipboardRef.current;
    let tsv = "";
    if (top === -1) {
      copy([y, x, y, x]);
      tsv = rows[y][x];
    } else {
      copy([top, left, bottom, right]);
      const copyingRows = cropRows(rows, [top, left, bottom, right]);
      tsv = convertArrayToTSV(copyingRows);
    }
    if (input != null) {
      input.value = tsv;
      input.focus();
      input.select();
      document.execCommand("copy");
      input.value = "";
      input.blur();
      setTimeout(() => choose([y, x]), 100); // refocus
    }
    setCutting(cutting);
  };
};

const handleSelect = ({
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

const handleSelectAll = ({
  select, 
  heights, widths,
}: handlePropsType) => {
  return () => {
    select([0, 0, heights.length - 1, widths.length - 1]);
  };
};

const handleEscape = ({
  copy,
  setCutting,
}: handlePropsType) => {
  return () => {
    copy([-1, -1, -1, -1]);
    setCutting(false);
  };
};

const handlePaste = ({
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

  const copyingRows = cropRows(rows, copyingArea);
  return (text: string) => {
    if (cutting) {
      for (let _y = 0; _y <= copyingHeight; _y++) {
        for (let _x = 0; _x <= copyingWidth; _x++) {
          const [srcY, srcX] = [copyingTop + _y, copyingLeft + _x];
          rows[srcY][srcX] = "";
        }
      }
    }
    if (selectingTop === -1) {
      if (copyingTop === -1) {
        const tsvRows = convertTSVToArray(text);
        for (let _y = 0; _y < tsvRows.length; _y++) {
          for (let _x = 0; _x < tsvRows[_y].length; _x++) {
            rows[y + _y][x + _x] = tsvRows[_y][_x];
          }
        }
        select([y, x, y + tsvRows.length - 1, x + tsvRows[0].length - 1]);
      } else {
        for (let _y = 0; _y <= copyingHeight; _y++) {
          for (let _x = 0; _x <= copyingWidth; _x++) {
            const [dstY, dstX] = [y + _y, x + _x];
            if (dstY < heights.length && dstX < widths.length) {
              rows[dstY][dstX] = copyingRows[_y][_x];
            }
          }
        }
        if (copyingHeight > 0 || copyingWidth > 0) {
          select([y, x, y + copyingHeight, x + copyingWidth]);
        }
      }
    } else {
      if (copyingTop === -1) {
        const tsvRows = convertTSVToArray(text);
        for (let y = selectingTop; y <= selectingBottom; y++) {
          for (let x = selectingLeft; x <= selectingRight; x++) {
            rows[y][x] = tsvRows[y % tsvRows.length][x % tsvRows[0].length];
          }
        }
      } else {
        const [biggerHeight, biggerWidth] = [selectingHeight > copyingHeight ? selectingHeight : copyingHeight, selectingWidth > copyingWidth ? selectingWidth : copyingWidth]
        for (let _y = 0; _y <= biggerHeight; _y++) {
          for (let _x = 0; _x <= biggerWidth; _x++) {
            const [dstY, dstX] = [y + _y, x + _x];
            if (dstY < heights.length && dstX < widths.length) {
              rows[dstY][dstX] = copyingRows[_y][_x];
            }
          }
        }
        select([y, x, y + biggerHeight, x + biggerWidth]);
      }
    }
    setRows([...rows]);
    copy([-1, -1, -1, -1]);
  };
};

const handleChoose = ({
  selectingArea,
  select,
  choose,
  heights, widths,
}: handlePropsType) => {
  const [top, left, bottom, right] = selectingArea;

  return (nextY: number, nextX: number, breaking: boolean) => {
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

const handleWrite = ({
  y, x,
  rows, setRows,
}: handlePropsType) => {
  return (value: string) => {
    rows[y][x] = value;
    setRows([...rows]);
  };
};

const getCellStyle = (y: number, x: number, copyingArea: Range): React.CSSProperties => {
  let style: any = {};
  const [top, left, bottom, right] = copyingArea;

  if (top < y && y <= bottom) {
    style.borderTop = "solid 1px #dddddd";
  }
  if (top <= y && y < bottom) {
    style.borderBottom = "solid 1px #dddddd";
  }
  if (left < x && x <= right) {
    style.borderLeft = "solid 1px #dddddd";
  }
  if (left <= x && x < right) {
    style.borderRight = "solid 1px #dddddd";
  }
  return style;
};

const cropRows = (rows: DataType, area: Range): DataType => {
  const [top, left, bottom, right] = area;
  return rows.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
};
