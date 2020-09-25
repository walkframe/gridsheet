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
      }
      &.row-number {
      }

    }
    td {
      position: relative;
      padding: 0;
      margin: 0;
      width: 150px;
      background-color: #ffffff;
      
      &.dragging {
        background-color: rgba(0, 128, 255, 0.2);
      }
      &.copying {
        border: dashed 2px #0077ff;
      }
    }
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [rows, setRows] = React.useState(data);
  const [selecting, select] = React.useState<[number, number]>([0, 0]);
  const [dragging, drag] = React.useState<[number, number, number, number]>([-1, -1, -1, -1]); // (y, x) -> (y, x)
  const [draggingTop, draggingBottom] = dragging[Y_START] < dragging[Y_END] ? [dragging[Y_START], dragging[Y_END]] : [dragging[Y_END], dragging[Y_START]];
  const [draggingLeft, draggingRight] = dragging[X_START] < dragging[X_END] ? [dragging[X_START], dragging[X_END]] : [dragging[X_END], dragging[X_START]];
  const [copying, copy] = React.useState<[number, number, number, number]>([-1, -1, -1, -1]); // (y, x) -> (y, x)
  const [copyingTop, copyingBottom] = copying[Y_START] < copying[Y_END] ? [copying[Y_START], copying[Y_END]] : [copying[Y_END], copying[Y_START]];
  const [copyingLeft, copyingRight] = copying[X_START] < copying[X_END] ? [copying[X_START], copying[X_END]] : [copying[X_END], copying[X_START]];

  const isDragging = (y: number, x: number) => draggingTop !== -1 && (draggingTop <= y && y <= draggingBottom && draggingLeft <= x && x <= draggingRight);
  const isCopying = (y: number, x: number) => (copyingTop <= y && y <= copyingBottom && copyingLeft <= x && x <= copyingRight);

  return (<GridTableLayout>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, x) => (<th 
            key={x}
            className="col-number"
            style={{ width }}
            onClick={(e) => {
              drag([0, x, heights.length - 1, x]);
              select([0, x]);
            }}
          >
          {x}
          </th>))
          }
        </tr>
      </thead>
      <tbody>{heights.map((height, y) => (<tr key={y}>
        <th
          className="row-number" 
          style={{ height }}
          onClick={(e) => {
            drag([y, 0, y, widths.length - 1]);
            select([y, 0]);
            e.preventDefault();
            return false;
          }}
        >{y + 1}</th>
        {widths.map((width, x) => {
          const value = rows[y][x];
          return (<td
            key={x}
            className={`${isDragging(y, x) ? "dragging": ""} ${isCopying(y, x) ? "copying" : ""}`}
            draggable
            onClick={(e) => {
              select([y, x]);
              drag([-1, -1, -1, -1]);
            }}
            onDragStart={(e) => {
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
            copy={(copying: boolean) => {
              if (copying) {
                (dragging[0] === -1) ? copy([y, x, y, x]) : copy(dragging);
              } else {
                copy([-1, -1, -1, -1]);
              }
            }}
            cut={(cutting: boolean) => {
              copy([-1, -1, -1, -1]);
            }}
            paste={() => {
              if (dragging[0] === -1) {
                if (copying[0] === -1) {
                  0;
                } else {
                  const [copyingHeight, copyingWidth] = [copyingBottom - copyingTop, copyingRight - copyingLeft];
                  for (let _y = 0; _y <= copyingHeight; _y++) {
                    for (let _x = 0; _x <= copyingWidth; _x++) {
                      const [dstY, dstX, srcY, srcX] = [y + _y, x + _x, copyingTop + _y, copyingLeft + _x];
                      if (dstY < heights.length && dstX < widths.length) {
                        rows[dstY][dstX] = rows[srcY][srcX];
                      }
                    }
                  }
                  drag([y, x, y + copyingHeight, x + copyingWidth]);
                }
              } else {
                if (copying[0] === -1) {
                  0;
                } else {
                  const [draggingHeight, draggingWidth] = [draggingBottom - draggingTop, draggingRight - draggingLeft];
                  const [copyingHeight, copyingWidth] = [copyingBottom - copyingTop, copyingRight - copyingLeft];
                  const [biggerHeight, biggerWidth] = [draggingHeight > copyingHeight ? draggingHeight : copyingHeight, draggingWidth > copyingWidth ? draggingWidth : copyingWidth]
                  for (let _y = 0; _y <= biggerHeight; _y++) {
                    for (let _x = 0; _x <= biggerWidth; _x++) {
                      const [dstY, dstX, srcY, srcX] = [y + _y, x + _x, copyingTop + (_y % (copyingHeight + 1)), copyingLeft + (_x % (copyingWidth + 1))];
                      if (dstY < heights.length && dstX < widths.length) {
                        rows[dstY][dstX] = rows[srcY][srcX];
                      }
                    }
                  }
                  drag([y, x, y + biggerHeight, x + biggerWidth]);
                }
              }
              setRows([...rows]);
              copy([-1, -1, -1, -1]);
            }}
            select={(deltaY: number, deltaX: number) => {
              let nextY = y + deltaY;
              let nextX = x + deltaX;

              if (nextY < draggingTop && draggingTop !== -1) {
                nextY = draggingBottom;
                nextX = nextX > draggingLeft ? nextX - 1 : draggingRight;
              }
              if (nextY > draggingBottom && draggingBottom !== -1) {
                nextY = draggingTop;
                nextX = nextX < draggingRight ? nextX + 1 : draggingLeft;
              }
              if (nextX < draggingLeft && draggingLeft !== -1) {
                nextX = draggingRight;
                nextY = nextY > draggingTop ? nextY - 1 : draggingBottom;
              }
              if (nextX > draggingRight && draggingRight !== -1) {
                nextX = draggingLeft;
                nextY = nextY < draggingBottom ? nextY + 1 : draggingTop;
              }
              if (nextY < 0 || heights.length <= nextY || nextX < 0 || widths.length <= nextX) {
                return;
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

