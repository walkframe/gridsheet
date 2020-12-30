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

import {
  makeSequence,
} from "../api/arrays";

import {
  choose,
  select,
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
      &.copying {
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
        opacity: 0.7;
        font-weight: normal;
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
    verticalAlign = "middle",
    cellLabel = true,
  } = options;

  const clipboardRef = React.createRef<HTMLTextAreaElement>();
  const dispatch = useDispatch();
  const {
    cellsOption,
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
            dispatch(select([0, 0, numRows - 1, numCols - 1]));
          }} />
          {makeSequence(0, numCols).map((x) => {
            return (<HorizontalHeaderCell
              key={x}
              x={x}
            />);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        return (<tr key={y}>
          <VerticalHeaderCell
            key={y}
            y={y}
          />
          {makeSequence(0, numCols).map((x) => {
            return (<Cell
                key={`${y}-${x}`}
                y={y}
                x={x}
                clipboardRef={clipboardRef}
            />);
          })}
        </tr>);
      })
      }</tbody>
    </table>
  </GridTableLayout>);
};



