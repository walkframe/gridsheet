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
        }
        &.pointed {
          border: solid 2px #0077ff;
          &.editing {
            overflow: visible;
            border: none;
            background-color: #ffffff;
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

const arrayToInfo = (options: any[]) => {
  const info = {};
  // @ts-ignore
  options.map((opt, i) => info[typeof opt.key === "undefined" ? i : opt.key] = opt);
  return info;
}; 

export const GridTable: React.FC<Props> = ({data, options}) => {
  const {
    historySize = 10,
    headerHeight = "auto",
    headerWidth = "auto",
    defaultHeight = "20px",
    defaultWidth = "80px",
    verticalAlign = "middle",
    cols = [],
    rows = [],
  } = options;

  const [rowInfo, setRowInfo] = React.useState(arrayToInfo(rows) as RowInfoType);
  const [colInfo, setColInfo] = React.useState(arrayToInfo(cols) as ColInfoType);

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
            >
              <div
                className="resizer"
                style={{ width: colOption.width || defaultWidth, height: headerHeight }}>{ colOption.label || convertNtoA(x + 1) }
              </div>
            </th>);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        const rowOption = rowInfo[y] || {};
        const height = rowOption.height || defaultHeight;
        return (<tr key={y}>
          <th
            className={`row-number ${choosing[0] === y ? "choosing" : ""} ${between(rowsSelecting, y) ? "selecting" : ""}`}
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
              setRowInfo({... rowInfo, [y]: {... rowOption, height: `${e.currentTarget.clientHeight - 2}px`}});
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
          >
            <div
              className="resizer"
              style={{ height, width: headerWidth }}
            >
              { rowOption.label ||  y + 1 }
            </div></th>
          {makeSequence(0, numCols).map((x) => {
            const pointed = choosing[0] === y && choosing[1] === x;
            const colOption = colInfo[x] || {};
            const width = colOption.width || defaultWidth;
            const value = matrix[y][x];
            const [editing, setEditing] = React.useState(false);
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
            >
              <div 
                className={`cell-wrapper-outer ${among(selectingArea, [y, x]) ? "selected": ""} ${pointed ? "pointed" : ""} ${editing ? "editing" : ""}`}
                style={{ height }}
              >
                <div 
                  className={`cell-wrapper-inner`}
                  style={{
                    width,
                    height,
                    verticalAlign: rowOption.verticalAlign || colOption.verticalAlign || verticalAlign,
                  }}
                >
                  <Cell
                    value={value}
                    editing={editing}
                    setEditing={setEditing}
                    x={x}
                    y={y}
                    height={height}
                    width={width}
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


