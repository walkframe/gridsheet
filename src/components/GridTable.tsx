import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthsType,
  HeightsType,
  PositionType,
  AreaType,
} from "../types";
import { Y_START, Y_END, X_START, X_END, DUMMY_IMG } from "../constants";

import {
  Cell,
} from "./Cell";
import { convertNtoA } from "../api/converters";
import {
  handleBlur,
  handleChoose,
  handleClear,
  handleCopy,
  handleEscape,
  handlePaste,
  handleSelect,
  handleSelectAll,
  handleWrite,
  handleUndo,
  handleRedo,
} from "../api/handlers";
import { History } from "../api/histories";

interface Props {
  data: DataType;
  widths: WidthsType;
  heights: HeightsType;
  setWidths: (widths: WidthsType) => void;
  setHeights: (heights: HeightsType) => void;
};



const GridTableLayout = styled.div`
  height: auto;
  overflow: auto;

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
  const [matrix, setMatrix] = React.useState(data);
  const [choosing, choose] = React.useState<PositionType>([0, 0]);
  const [choosingLast, setChoosingLast] = React.useState<PositionType>([0, 0]);
  const [cutting, setCutting] = React.useState(false);

  const [rowsSelecting, rowsSelect] = React.useState<[number, number]>([-1, -1]);
  const [colsSelecting, colsSelect] = React.useState<[number, number]>([-1, -1]);

  const [selecting, select] = React.useState<AreaType>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const selectingArea: AreaType = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [selectingArea[0], selectingArea[2]] = selecting[Y_START] < selecting[Y_END] ? [selecting[Y_START], selecting[Y_END]] : [selecting[Y_END], selecting[Y_START]];
  [selectingArea[1], selectingArea[3]] = selecting[X_START] < selecting[X_END] ? [selecting[X_START], selecting[X_END]] : [selecting[X_END], selecting[X_START]];

  const [copying, copy] = React.useState<AreaType>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const copyingArea: AreaType = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [copyingArea[0], copyingArea[2]] = copying[Y_START] < copying[Y_END] ? [copying[Y_START], copying[Y_END]] : [copying[Y_END], copying[Y_START]];
  [copyingArea[1], copyingArea[3]] = copying[X_START] < copying[X_END] ? [copying[X_START], copying[X_END]] : [copying[X_END], copying[X_START]];

  const [history] = React.useState(new History(10));

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
    history,
    matrix, setMatrix,
    choosing, choose, setChoosingLast,
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
                const [_, xLast] = choosingLast;
                if (e.shiftKey) {
                  select([0, xLast, heights.length - 1, x]);
                  choose(choosingLast);
                  colsSelect([xLast, x]);
                } else {
                  select([0, x, heights.length - 1, x]);
                  choose([0, x]);
                  colsSelect([x, x]);
                }
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
              const [yLast, _] = choosingLast;
              if (e.shiftKey) {
                select([yLast, 0, y, widths.length - 1]);
                choose(choosingLast);
                rowsSelect([yLast, y]);
              } else {
                select([y, 0, y, widths.length - 1]);
                choose([y, 0]);
                rowsSelect([y, y]);
              }
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
            const value = matrix[y][x];
            return (<td
              key={x}
              className={`${isSelecting(y, x) ? "selecting": ""} ${isCopying(y, x) ? cutting ? "cutting" : "copying" : ""}`}
              style={getCellStyle(y, x, copyingArea)}
              draggable
              onClick={(e) => {
                if (e.shiftKey) {
                  choose(choosingLast);
                  select([... choosingLast, y, x]);
                  e.preventDefault();
                  return false;
                } else {
                  choose([y, x]);
                  select([-1, -1, -1, -1]);
                }
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
              undo={handleUndo({... handleProps, y, x})}
              redo={handleRedo({... handleProps, y, x})}
              choosing={choosing[0] === y && choosing[1] === x}
            /></td>);
          })}
        </tr>);
      })
      }</tbody>
    </table>
  </GridTableLayout>);
};


const getCellStyle = (y: number, x: number, copyingArea: AreaType): React.CSSProperties => {
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


