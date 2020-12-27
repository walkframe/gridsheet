import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import styled from "styled-components";

import {
  MatrixType,
  OptionsType,
} from "../types";

import { Cell } from "./Cell";
import { HorizontalHeaderCell } from "./HorizontalHeaderCell";
import { VerticalHeaderCell } from "./VerticalHeaderCell";
import { convertNtoA } from "../api/converters";

import {
  makeSequence,

} from "../api/arrays";

import {
  choose,
  selectAll,
} from "../store/inside";

import {
  OutsideState,
} from "../store/outside"

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
      color: #666666;
      font-size: 13px;
      font-weight: normal;
      box-sizing: border-box;
      background-color: #eeeeee;

      &.col-number {
        min-height: 20px;
        &.selecting {
          background-color: #dddddd;
        }
        &.choosing {
          background-color: #bbbbbb;
        }
        &.header-selecting {
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
        &.selecting {
          background-color: #dddddd;
        }
        &.choosing {
          background-color: #bbbbbb;
        }
        &.header-selecting {
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
  } = options;

  const clipboardRef = React.createRef<HTMLTextAreaElement>();

  const dispatch = useDispatch();
  const {
    rowInfo,
    colInfo,
    numRows,
    numCols,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);

  return (<GridTableLayout>
    <textarea className="clipboard" ref={clipboardRef} />
    <table className="grid-table">
      <thead>
        <tr>
          <th onClick={(e) => {
            dispatch(choose([0, 0]));
            dispatch(selectAll({numRows, numCols}));
          }} />
          {makeSequence(0, numCols).map((x) => {
            const colOption = colInfo[x] || {};
            return (<HorizontalHeaderCell
              key={x}
              x={x}
              defaultWidth={defaultWidth}
              headerHeight={headerHeight}
              colOption={colOption}
            />);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        const rowOption = rowInfo[y] || {};
        const rowId = `${y + 1}`;
        const height = rowOption.height || defaultHeight;

        return (<tr key={y}>
          <VerticalHeaderCell
            key={y}
            y={y}
            defaultHeight={defaultHeight}
            headerWidth={headerWidth}
            rowOption={rowOption}
          />
          {makeSequence(0, numCols).map((x) => {
            const colOption = colInfo[x] || {};
            const width = colOption.width || defaultWidth;
            const colId = convertNtoA(x + 1);
            const cellId = `${colId}${rowId}`;
            return (<Cell
                key={cellId}
                y={y}
                x={x}
                rowId={rowId}
                colId={colId}
                height={height}
                width={width}
                clipboardRef={clipboardRef}
                verticalAlign={verticalAlign}
                rowOption={rowOption}
                colOption={colOption}
            />);
          })}
        </tr>);
      })
      }</tbody>
    </table>
  </GridTableLayout>);
};



