import React from "react";
import styled from "styled-components";

import {
  MatrixType,
  OptionsType,
  PositionType,
  AreaType,
  DraggingType,
  RowInfoType,
  ColInfoType,
} from "../types";
import { DUMMY_IMG } from "../constants";

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
import { draggingToArea, between, among, shape, makeSequence } from "../api/arrays";

interface Props {
  data: MatrixType;
  options: OptionsType;
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
      background-color: #eeeeee;

      &.col-number {
        min-height: 20px;
        &.choosing {
          background-color: #dddddd;
        }
        &.selecting {
          background-color: #555555;
          color: #ffffff;
        }
      }
      &.row-number {
        min-width: 30px;
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

export const GridTable: React.FC<Props> = ({data, options}) => {
  const {
    historySize = 10,
    headerHeight = "auto",
    headerWidth = "auto",
    defaultHeight = "20px",
    defaultWidth = "100px",
    cols = [],
    rows = [],
  } = options;

  const rowInfo: RowInfoType = {};
  const colInfo: ColInfoType = {};

  rows.map((row, i) => (rowInfo[typeof row.key === "undefined" ? i : row.key] = row));
  cols.map((col, i) => (colInfo[typeof col.key === "undefined" ? i : col.key] = col));

  const [matrix, setMatrix] = React.useState(data);
  const [choosing, choose] = React.useState<PositionType>([0, 0]);
  const [choosingLast, setChoosingLast] = React.useState<PositionType>([0, 0]);
  const [cutting, setCutting] = React.useState(false);

  const [rowsSelecting, rowsSelect] = React.useState<[number, number]>([-1, -1]);
  const [colsSelecting, colsSelect] = React.useState<[number, number]>([-1, -1]);

  const [selecting, select] = React.useState<DraggingType>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const [copying, copy] = React.useState<DraggingType>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const selectingArea = draggingToArea(selecting); // (top, left) -> (bottom, right)
  const copyingArea = draggingToArea(copying); // (top, left) -> (bottom, right)

  const [history] = React.useState(new History(historySize));
  const clipboardRef = React.createRef<HTMLTextAreaElement>();

  const [numRows, numCols] = [data.length, data[0].length];

  const handleProps = {
    history,
    matrix, setMatrix,
    choosing, choose, setChoosingLast,
    cutting, setCutting,
    numRows, numCols,
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
          {makeSequence(0, numCols).map((x) => {
            const colOption = colInfo[x] || {};
            return (<th 
              key={x}
              className={`col-number ${choosing[1] === x ? "choosing" : ""} ${between(colsSelecting, x) ? "selecting" : ""}`}
              style={{ width: colOption.width || defaultWidth, height: headerHeight }}
              onClick={(e) => {
                const [_, xLast] = choosingLast;
                if (e.shiftKey) {
                  select([0, xLast, numRows - 1, x]);
                  choose(choosingLast);
                  colsSelect([xLast, x]);
                } else {
                  select([0, x, numRows - 1, x]);
                  choose([0, x]);
                  colsSelect([x, x]);
                }
                rowsSelect([-1, -1]);
                return false;
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
                select([0, x, numRows - 1, x]);
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
            >{ colOption.label || convertNtoA(x + 1) }</th>);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        const rowOption = rowInfo[y] || {};
        return (<tr key={y}>
          <th
            className={`row-number ${choosing[0] === y ? "choosing" : ""} ${between(rowsSelecting, y) ? "selecting" : ""}`}
            style={{ height: rowOption.height || defaultHeight, width: headerWidth }}
            onClick={(e) => {
              const [yLast, _] = choosingLast;
              if (e.shiftKey) {
                select([yLast, 0, y, numCols - 1]);
                choose(choosingLast);
                rowsSelect([yLast, y]);
              } else {
                select([y, 0, y, numCols - 1]);
                choose([y, 0]);
                rowsSelect([y, y]);
              }
              colsSelect([-1, -1]);
              return false;
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              select([y, 0, y, numCols - 1]);
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
          >{ rowOption.label ||  y + 1 }</th>
          {makeSequence(0, numCols).map((x) => {
            const colOption = colInfo[x] || {};
            const value = matrix[y][x];
            return (<td
              key={x}
              className={`${among(selectingArea, [y, x]) ? "selecting": ""} ${among(copyingArea, [y, x]) ? cutting ? "cutting" : "copying" : ""}`}
              style={{
                ... getCellStyle(y, x, copyingArea),
                ... rowOption.style, ... colOption.style
              }}
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
                const [height, width] = shape(selecting);
                if (height + width === 0) {
                  select([-1, -1, -1, -1]);
                }
              }}
              onDragEnter={(e) => {
                const [startY, startX] = selecting;
                if (colsSelecting[0] !== -1) {
                  colsSelect([colsSelecting[0], x]);
                  select([startY, startX, numRows - 1, x]);
                  return false;
                }
                if (rowsSelecting[0] !== -1) {
                  rowsSelect([rowsSelecting[0], y]);
                  select([startY, startX, y, numCols - 1]);
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


