import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthsType,
  HeightsType,
} from "../types";
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
        transform: translate(0, 0);
      }
    }
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [pointsStart, setPointsStart] = React.useState<[number, number]>([0, 0]); // Y, X
  const [pointsEnd, setPointsEnd] = React.useState<[number, number]>([-1, -1]); // Y, X
  const [pointStartY, pointEndY] = pointsStart[0] < pointsEnd[0] ? [pointsStart[0], pointsEnd[0]] : [pointsEnd[0], pointsStart[0]];
  const [pointStartX, pointEndX] = pointsStart[1] < pointsEnd[1] ? [pointsStart[1], pointsEnd[1]] : [pointsEnd[1], pointsStart[1]];
  const between = (y: number, x: number) => pointStartY <= y && y <= pointEndY && pointStartX <= x && x <= pointEndX;

  return (<GridTableLayout>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, i) => (<th key={i} className="col-number" style={{ width }}>
          {i}
          </th>))
          }
        </tr>
      </thead>
      <tbody>{heights.map((height, i) => (<tr key={i}>
        <th className="row-number" style={{ height }}>{i + 1}</th>  
        {widths.map((width, j) => {
          const value = data[i][j];
          return (<td
            key={j}
            className={between(i, j) ? "selected": ""}
            draggable
            onClick={(e) => {
              setPointsStart([-1, -1]);
              setPointsEnd([-1, -1]);
            }}
            onDragStart={(e) => {
              e.currentTarget.classList.add("dragging");
              setPointsEnd([-1, -1]);
              setPointsStart([i, j]);
              
            }}
            onDragEnter={(e) => {
              setPointsEnd([i, j]);
            }}
          ><Cell
            value={value}
          /></td>);
        })}
      </tr>))
      }</tbody>
    </table>
  </GridTableLayout>);
};

