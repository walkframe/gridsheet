import React from "react";
import { useDispatch, useSelector } from 'react-redux';
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
import {
  draggingToArea,
  between,
  among,
  shape,
  makeSequence,
  arrayToInfo,
} from "../api/arrays";

import { 
  choose,
  select,
  selectCols,
  selectRows,
  OperationState,
} from "../store/operations";

import {
  setRowInfo,
  setColInfo,
  ConfigState,
} from "../store/config"

import { RootState } from "../store";

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
      box-sizing: border-box;
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
        .resizer {
          resize: horizontal;
          overflow: hidden;
        }
      }
      &.row-number {
        overflow: hidden;
        min-width: 30px;
        &.choosing {
          background-color: #dddddd;
        }
        &.selecting {
          background-color: #555555;
          color: #ffffff;
        }
        .resizer {
          box-sizing: border-box;
          padding: 0 10px;
          resize: vertical;
          overflow: hidden;
        }
      }
    }
    td {
      padding: 0;
      margin: 0;
      position: relative;
      border: solid 1px #cccccc;
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
      .label {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 8px;
        background-color: rgba(0, 128, 255, 0.3);
        color: #ffffff;
        padding: 0 2px;
        display: none;
      }
      .cell-wrapper-outer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        &.selected {
          background-color: rgba(0, 128, 255, 0.2);
          .label {
            display: block;
          }
        }
        &.pointed {
          border: solid 2px #0077ff;
          &.editing {
            overflow: visible;
            border: none;
            background-color: #ffffff;
          }
          .label {
            display: block;
          }

        }
      }
      .cell-wrapper-inner {
        display: table-cell;


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
    defaultWidth = "80px",
    verticalAlign = "middle",
    cellLabel = true,
    cols = [],
    rows = [],
  } = options;

  const [matrix, setMatrix] = React.useState(data);

  const dispatch = useDispatch();
  const {
    choosing,
    choosingLast,
    selecting,
    colsSelecting,
    rowsSelecting,
    cutting,
    copying,
    clipboardRef,
    editingCell,
  } = useSelector<RootState, OperationState>(state => state.operations);
  const { rowInfo, colInfo } = useSelector<RootState, ConfigState>(state => state.config);

  const [numRows, numCols] = [data.length, data[0].length];
  const selectingArea = draggingToArea(selecting); // (top, left) -> (bottom, right)
  const copyingArea = draggingToArea(copying); // (top, left) -> (bottom, right)

  return (<GridTableLayout>
    <textarea className="clipboard" ref={clipboardRef}></textarea>
    <table className="grid-table">
      <thead>
        <tr>
          <th onClick={(e) => {
            handleSelectAll();
            choose([0, 0]);
          }}></th>
          {makeSequence(0, numCols).map((x) => {
            const colOption = colInfo[x] || {};
            return (<th 
              key={x}
              className={`col-number ${choosing[1] === x ? "choosing" : ""} ${between(colsSelecting, x) ? "selecting" : ""}`}
              onClick={(e) => {
                const [_, xLast] = choosingLast;
                if (e.shiftKey) {
                  select([0, xLast, numRows - 1, x]);
                  choose(choosingLast);
                  selectCols([xLast, x]);
                } else {
                  select([0, x, numRows - 1, x]);
                  choose([0, x]);
                  selectCols([x, x]);
                }
                selectRows([-1, -1]);
                return false;
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
                select([0, x, numRows - 1, x]);
                choose([0, x]);
                selectCols([x, -1]);
                selectRows([-1, -1]);
                return false;
              }}
              onDragEnter={(e) => {
                const [startY, startX, endY] = selecting;
                select([startY, startX, endY, x]);
                selectCols([colsSelecting[0], x]);
                return false;
              }}
            >
              <div
                className="resizer"
                style={{ width: colOption.width || defaultWidth, height: headerHeight }}
                onMouseLeave={(e) => {
                  const width = e.currentTarget.clientWidth;
                  setColInfo({... colInfo, [x]: {... colOption, width: `${width}px`}});;
                }}  
              >{ colOption.label || convertNtoA(x + 1) }
              </div>
            </th>);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        const rowOption = rowInfo[y] || {};
        const rowId = y + 1;
        const height = rowOption.height || defaultHeight;
        return (<tr key={y}>
          <th
            className={`row-number ${choosing[0] === y ? "choosing" : ""} ${between(rowsSelecting, y) ? "selecting" : ""}`}
            onClick={(e) => {
              const [yLast, _] = choosingLast;
              if (e.shiftKey) {
                select([yLast, 0, y, numCols - 1]);
                choose(choosingLast);
                selectRows([yLast, y]);
              } else {
                select([y, 0, y, numCols - 1]);
                choose([y, 0]);
                selectRows([y, y]);
              }
              selectCols([-1, -1]);
              return false;
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              select([y, 0, y, numCols - 1]);
              choose([y, 0]);
              selectRows([y, -1]);
              selectCols([-1, -1]);
              return false;
            }}
            onDragEnter={(e) => {
              const [startY, startX, endY, endX] = selecting;
              select([startY, startX, y, endX]);
              selectRows([rowsSelecting[0], y]);
              return false;
            }}
          >
            <div
              className="resizer"
              style={{ height, width: headerWidth }}
              onMouseLeave={(e) => {
                const height = e.currentTarget.clientHeight;
                setRowInfo({... rowInfo, [y]: {... rowOption, height: `${height}px`}});
              }}
            >
              { rowOption.label ||  y + 1 }
            </div></th>
          {makeSequence(0, numCols).map((x) => {
            const pointed = choosing[0] === y && choosing[1] === x;
            const colOption = colInfo[x] || {};
            const width = colOption.width || defaultWidth;
            const value = matrix[y][x];
            const colId = convertNtoA(x + 1);
            const cellId = `${colId}${rowId}`;
            const editing = editingCell == cellId;

            return (<td
              key={x}
              className={` ${
                among(copyingArea, [y, x]) ? cutting ? "cutting" : "copying" : ""}`}
              style={{
                ... getCellStyle(y, x, copyingArea),
                ... rowOption.style, ... colOption.style, // MEMO: prior to col style
              }}
              draggable={!editing}
              onClick={(e) => {
                if (e.shiftKey) {
                  choose(choosingLast);
                  select([... choosingLast, y, x]);
                  e.preventDefault();
                  return false;
                } else {
                  console.log("debug:", y, x, choosing);
                  dispatch(choose([y, x]));
                  select([-1, -1, -1, -1]);
                }
                selectCols([-1, -1]);
                selectRows([-1, -1]);
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
                  selectCols([colsSelecting[0], x]);
                  select([startY, startX, numRows - 1, x]);
                  return false;
                }
                if (rowsSelecting[0] !== -1) {
                  selectRows([rowsSelecting[0], y]);
                  select([startY, startX, y, numCols - 1]);
                  return false;
                }
                select([startY, startX, y, x])
              }}
            >
              <div 
                className={`cell-wrapper-outer ${among(selectingArea, [y, x]) ? "selected": ""} ${pointed ? "pointed" : ""} ${editing ? "editing" : ""}`}
              >
                <div 
                  className={`cell-wrapper-inner`}
                  style={{
                    width,
                    height,
                    verticalAlign: rowOption.verticalAlign || colOption.verticalAlign || verticalAlign,
                  }}
                >
                  { cellLabel && (<div className="label">{ cellId }</div>)}
                  <Cell
                    value={value}
                    x={x}
                    y={y}
                    height={height}
                    width={width}
                    write={handleWrite({matrix, setMatrix})}
                    copy={handleCopy({matrix})}
                    escape={handleEscape}
                    clear={handleClear({matrix, setMatrix})}
                    paste={handlePaste({matrix, setMatrix})}
                    select={handleSelect()}
                    selectAll={handleSelectAll}
                    blur={handleBlur}
                    choose={handleChoose()}
                    undo={handleUndo({matrix, setMatrix})}
                    redo={handleRedo({matrix, setMatrix})}
                    pointed={pointed}
                  />
                </div>
              </div>
            </td>);
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


