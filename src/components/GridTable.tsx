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

interface Props {
  data: DataType;
  widths: WidthsType;
  heights: HeightsType;
  setWidths: (widths: WidthsType) => void;
  setHeights: (heights: HeightsType) => void;
};

const GridTableLayout = styled.div`
  .grid-table {
    table-layout: fixed;
    border-collapse: collapse;
    th, td {
      border: solid 1px #bbbbbb;
    }
    th {
      font-weight: normal;
      width: 80px;
      background-color: #eeeeee;

      &.col-number {
        cursor: col-resize;
        resize: horizontal;
      }
      &.row-number {
        cursor: row-resize;
        resize: vertical;
      }

    }
    td {
      position: relative;
      padding: 0;
      margin: 0;
      width: 150px;
      background-color: #ffffff;
      
      &.selected {
        background-color: rgba(0, 128, 255, 0.2);
      }
      &.dragging {
        &:active {
          cursor: cell;
        }
      }
    }
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [rows, setRows] = React.useState(data);
  const [selecting, select] = React.useState<[number, number]>([0, 0]);
  const [dragging, drag] = React.useState<[number, number, number, number]>([-1, -1, -1, -1]); // (y, x) -> (y, x)
  const [top, bottom] = dragging[Y_START] < dragging[Y_END] ? [dragging[Y_START], dragging[Y_END]] : [dragging[Y_END], dragging[Y_START]];
  const [left, right] = dragging[X_START] < dragging[X_END] ? [dragging[X_START], dragging[X_END]] : [dragging[X_END], dragging[X_START]];

  const between = (y: number, x: number) => top !== -1 && (top <= y && y <= bottom && left <= x && x <= right);

  return (<GridTableLayout>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, x) => (<th key={x} className="col-number" style={{ width }}>
          {x}
          </th>))
          }
        </tr>
      </thead>
      <tbody>{heights.map((height, y) => (<tr key={y}>
        <th className="row-number" style={{ height }}>{y + 1}</th>  
        {widths.map((width, x) => {
          const value = rows[y][x];
          return (<td
            key={x}
            className={between(y, x) ? "selected": ""}
            draggable
            onClick={(e) => {
              select([y, x]);
              drag([-1, -1, -1, -1]);
            }}
            onDragStart={(e) => {
              e.currentTarget.classList.add("dragging");
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              select([y, x]);
              drag([y, x, -1, -1]);
            }}
            onDragEnter={(e) => {
              drag([dragging[0], dragging[1], y, x])
            }}
          ><Cell
            value={value}
            setValue={(value: string) => {
              rows[y][x] = value;
              setRows([...rows]);
            }}  
            select={(deltaY: number, deltaX: number) => {
              let nextY = y + deltaY;
              let nextX = x + deltaX;
              if (nextY > bottom && bottom !== -1) {
                nextY = top;
                if (nextX < right) {
                  nextX++;
                } else {
                  nextX = left;
                }
              }
              if (nextX > right && right !== -1) {
                nextX = left;
                if (nextY < bottom) {
                  nextY++;
                } else {
                  nextY = top;
                }
              }

              select([nextY, nextX]);
            }}
            selecting={selecting[0] === y && selecting[1] === x}
          /></td>);
        })}
      </tr>))
      }</tbody>
    </table>
  </GridTableLayout>);
};

